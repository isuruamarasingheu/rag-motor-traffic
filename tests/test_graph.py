"""Integration tests for the LangGraph legal RAG pipeline."""

import json
from pathlib import Path
from unittest.mock import MagicMock

from src.generation.gate import ConfidenceGate
from src.generation.generator import GroundedGenerator
from src.graph.builder import ask_legal_assistant, build_legal_rag_graph
from src.graph.logger import PipelineLogger
from src.graph.nodes import PipelineNodes
from src.graph.scope import REFUSAL_MESSAGE, ScopeClassifier
from src.retrieval.hybrid import HybridRetriever
from src.retrieval.rewrite import QueryRewriter, QueryRewriteResult


def create_mock_nodes(tmp_path: Path) -> PipelineNodes:
    """Helper creating mock PipelineNodes with isolated temp log."""
    log_file = tmp_path / "test_pipeline_log.jsonl"
    logger = PipelineLogger(log_path=log_file)

    mock_scope = MagicMock(spec=ScopeClassifier)
    mock_rewriter = MagicMock(spec=QueryRewriter)
    mock_retriever = MagicMock(spec=HybridRetriever)
    mock_gate = MagicMock(spec=ConfidenceGate)
    mock_generator = MagicMock(spec=GroundedGenerator)

    return PipelineNodes(
        scope_classifier=mock_scope,
        rewriter=mock_rewriter,
        retriever=mock_retriever,
        gate=mock_gate,
        generator=mock_generator,
        logger=logger,
        top_k=5,
    )


def test_pipeline_in_scope_answered(tmp_path: Path) -> None:
    """In-scope query passing confidence gate generates an answered response with citations."""
    nodes = create_mock_nodes(tmp_path)

    # 1. Scope: In-scope
    nodes.scope_classifier.classify.return_value = MagicMock(
        in_scope=True, reason="Motor vehicle question"
    )

    # 2. Rewrite
    nodes.rewriter.rewrite.return_value = QueryRewriteResult(
        original_query="Can I use a musical horn?",
        rewritten_query="musical horn noise regulation",
        expanded_terms=["musical horn"],
    )

    # 3. Retrieve
    retrieved_hit = {
        "id": "GAZ-1738-37-reg-3",
        "document": "No person shall use a musical horn on a motor vehicle.",
        "dense_score": 0.55,
        "score": 0.016,
    }
    nodes.retriever.retrieve.return_value = [retrieved_hit]

    # 4. Gate passes
    nodes.gate.evaluate.return_value = (True, 0.55, "Score exceeds threshold")

    # 5. Generator returns answered
    nodes.generator.generate.return_value = {
        "status": "answered",
        "answer": 'Musical horns are prohibited by law under Gazette 1738/37: "No person shall use a musical horn".',
        "citations": [
            {
                "id": "GAZ-1738-37-reg-3",
                "citation": "Gazette No. 1738/37, Regulation 3",
                "text": "No person shall use a musical horn on a motor vehicle.",
            }
        ],
        "disclaimer": "This is legal information, not legal advice.",
    }

    graph = build_legal_rag_graph(nodes=nodes)
    response = ask_legal_assistant("Can I use a musical horn on my car?", graph=graph)

    assert response["status"] == "answered"
    assert "Musical horns are prohibited" in response["answer"]
    assert len(response["citations"]) == 1
    assert response["citations"][0]["id"] == "GAZ-1738-37-reg-3"
    assert "legal information" in response["disclaimer"]


def test_pipeline_out_of_scope_refusal(tmp_path: Path) -> None:
    """Out-of-scope query is routed directly to refusal and does not query retrieval/generation."""
    nodes = create_mock_nodes(tmp_path)

    # Scope: Out-of-scope
    nodes.scope_classifier.classify.return_value = MagicMock(
        in_scope=False, reason="Tenancy dispute is out of domain"
    )

    graph = build_legal_rag_graph(nodes=nodes)
    response = ask_legal_assistant(
        "Can a landlord evict a tenant without notice?", graph=graph
    )

    assert response["status"] == "refused_out_of_scope"
    assert response["citations"] == []
    assert response["answer"] == REFUSAL_MESSAGE
    # Verify retrieval and generator were never called
    nodes.retriever.retrieve.assert_not_called()
    nodes.generator.generate.assert_not_called()


def test_pipeline_not_found_due_to_low_confidence(tmp_path: Path) -> None:
    """In-scope query with low retrieval confidence triggers not_found and skips generation."""
    nodes = create_mock_nodes(tmp_path)

    nodes.scope_classifier.classify.return_value = MagicMock(
        in_scope=True, reason="In-scope topic"
    )
    nodes.rewriter.rewrite.return_value = QueryRewriteResult(
        original_query="What is the rule on rocket propulsion on highways?",
        rewritten_query="rocket propulsion highway",
        expanded_terms=[],
    )
    # Low confidence hit
    nodes.retriever.retrieve.return_value = [
        {"id": "MTA-1951-s1", "dense_score": 0.18, "score": 0.005}
    ]
    # Gate fails
    nodes.gate.evaluate.return_value = (False, 0.18, "Score below 0.40 cutoff")

    graph = build_legal_rag_graph(nodes=nodes)
    response = ask_legal_assistant(
        "What is the rule on rocket propulsion on highways?", graph=graph
    )

    assert response["status"] == "not_found"
    assert response["citations"] == []
    assert "could not find a relevant provision" in response["answer"]
    # Generator should not have been called
    nodes.generator.generate.assert_not_called()


def test_pipeline_rule_based_scope_and_logging(tmp_path: Path) -> None:
    """Test full pipeline with actual rule-based ScopeClassifier and PipelineLogger."""
    log_file = tmp_path / "test_run.jsonl"
    logger = PipelineLogger(log_path=log_file)
    scope_classifier = ScopeClassifier(use_llm=False)

    # 1. Test out-of-scope keyword routing
    nodes = PipelineNodes(scope_classifier=scope_classifier, logger=logger)
    graph = build_legal_rag_graph(nodes=nodes)

    out_scope_res = ask_legal_assistant(
        "Can an employee sue for wrongful termination without notice?", graph=graph
    )
    assert out_scope_res["status"] == "refused_out_of_scope"

    # Verify log entry exists
    assert log_file.exists()
    lines = log_file.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1
    log_data = json.loads(lines[0])
    assert log_data["status"] == "refused_out_of_scope"
    assert log_data["is_in_scope"] is False
