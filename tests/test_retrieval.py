"""Unit tests for Dense, BM25, Hybrid RRF, Query Rewriting, and Eval metrics."""

from unittest.mock import MagicMock

from src.eval.retrieval import (
    evaluate_retrieval_variant,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
)
from src.retrieval.dense import DenseRetriever
from src.retrieval.hybrid import HybridRetriever, compute_rrf_scores
from src.retrieval.rewrite import QueryRewriter


def test_retrieval_metrics_calculation() -> None:
    gold = ["MTA-1951-s112", "GAZ-1738-37-reg-4"]
    retrieved = [
        "MTA-1951-s140",
        "MTA-1951-s112",
        "MTA-1951-s115",
        "GAZ-1738-37-reg-4",
        "MTA-1951-s2",
    ]

    # Precision
    assert precision_at_k(retrieved, gold, k=1) == 0.0
    assert precision_at_k(retrieved, gold, k=2) == 1 / 2
    assert precision_at_k(retrieved, gold, k=3) == 1 / 3
    assert precision_at_k(retrieved, gold, k=5) == 2 / 5

    # Recall
    assert recall_at_k(retrieved, gold, k=1) == 0.0
    assert recall_at_k(retrieved, gold, k=2) == 1 / 2
    assert recall_at_k(retrieved, gold, k=4) == 2 / 2  # 1.0

    # Reciprocal Rank (first match is at rank 2: MTA-1951-s112)
    assert reciprocal_rank(retrieved, gold) == 1.0 / 2.0


def test_reciprocal_rank_fusion_math() -> None:
    dense_hits = [
        {"id": "docA", "rank": 1, "score": 0.95, "document": "A text", "metadata": {}},
        {"id": "docB", "rank": 2, "score": 0.85, "document": "B text", "metadata": {}},
    ]
    bm25_hits = [
        {"id": "docB", "rank": 1, "score": 15.0, "document": "B text", "metadata": {}},
        {"id": "docC", "rank": 2, "score": 10.0, "document": "C text", "metadata": {}},
    ]

    fused = compute_rrf_scores(
        dense_hits=dense_hits,
        bm25_hits=bm25_hits,
        rrf_k=60,
        dense_weight=0.5,
        bm25_weight=0.5,
    )

    # docB appears in both:
    # docB score = 0.5 / (60 + 2) + 0.5 / (60 + 1) = 0.5/62 + 0.5/61 = 0.008064 + 0.008196 = ~0.01626
    # docA score = 0.5 / (60 + 1) = 0.5/61 = ~0.008196
    # docC score = 0.5 / (60 + 2) = 0.5/62 = ~0.008064
    assert len(fused) == 3
    assert fused[0]["id"] == "docB"
    assert fused[0]["rank"] == 1
    assert fused[1]["id"] == "docA"
    assert fused[1]["rank"] == 2
    assert fused[2]["id"] == "docC"
    assert fused[2]["rank"] == 3


def test_dense_retriever_mocked() -> None:
    mock_embedder = MagicMock()
    mock_embedder.embed_texts.return_value = [[0.1, 0.2, 0.3]]

    mock_store = MagicMock()
    mock_store.query.return_value = [
        {
            "id": "MTA-1951-s112",
            "score": 0.92,
            "document": "Sample text",
            "metadata": {"section": "112"},
        }
    ]

    retriever = DenseRetriever(embedder=mock_embedder, store=mock_store)
    hits = retriever.retrieve("Condition of vehicles", top_k=1)

    assert len(hits) == 1
    assert hits[0]["id"] == "MTA-1951-s112"
    assert hits[0]["rank"] == 1
    mock_embedder.embed_texts.assert_called_once_with(["Condition of vehicles"])


def test_query_rewriter_rule_based() -> None:
    rewriter = QueryRewriter(use_llm=False)
    res = rewriter.rewrite("Can I use a musical horn or dual-tone air horn on my car?")
    assert "musical horn" in res.expanded_terms
    assert "harsh shrill or musical sound" in res.rewritten_query
    assert "air horn" in res.expanded_terms
    assert (
        res.original_query
        == "Can I use a musical horn or dual-tone air horn on my car?"
    )


def test_evaluate_retrieval_variant_logic() -> None:
    questions = [
        {
            "id": "Q01",
            "type": "in_scope",
            "question": "Speed limits?",
            "gold_sections": ["MTA-1951-s140"],
        },
        {
            "id": "Q02",
            "type": "edge",
            "question": "Seatbelts?",
            "gold_sections": ["GAZ-1718-12-reg-2"],
        },
        {
            "id": "Q03",
            "type": "out_of_scope",
            "question": "Python sorting?",
            "gold_sections": [],
        },
    ]

    # Fake retrieve function that returns MTA-1951-s140 for Q01, and nothing for Q02
    def fake_retrieve(q: str, k: int):
        if "Speed" in q:
            return [{"id": "MTA-1951-s140", "rank": 1, "score": 0.9}]
        return [{"id": "IRRELEVANT", "rank": 1, "score": 0.1}]

    summary, details = evaluate_retrieval_variant(questions, fake_retrieve, top_k=5)

    assert len(details) == 2  # Only Q01 and Q02 evaluated (Q03 excluded)
    assert summary["overall"]["count"] == 2.0
    assert summary["in_scope"]["mrr"] == 1.0  # Q01 ranked #1
    assert summary["edge"]["mrr"] == 0.0  # Q02 missed
    assert summary["overall"]["mrr"] == 0.5  # (1.0 + 0.0) / 2


def test_hybrid_retriever_integration() -> None:
    mock_dense = MagicMock()
    mock_dense.retrieve.return_value = [
        {
            "id": "doc1",
            "rank": 1,
            "score": 0.9,
            "document": "Doc 1 text",
            "metadata": {"heading": "Head 1"},
        }
    ]

    mock_bm25 = MagicMock()
    mock_bm25.query.return_value = [{"id": "doc1", "rank": 1, "score": 10.0}]

    mock_chroma = MagicMock()
    mock_chroma.get_by_id.return_value = {
        "id": "doc1",
        "document": "Doc 1 text",
        "metadata": {"heading": "Head 1"},
    }

    retriever = HybridRetriever(
        dense_retriever=mock_dense,
        bm25_index=mock_bm25,
        chroma_store=mock_chroma,
    )

    hits = retriever.retrieve("test query", top_k=1)
    assert len(hits) == 1
    assert hits[0]["id"] == "doc1"
    assert hits[0]["rank"] == 1
    assert hits[0]["dense_score"] == 0.9
    assert hits[0]["bm25_score"] == 10.0


def test_query_rewriter_sub_queries_fallback() -> None:
    """Offline rule-based rewriter provides sub_queries matching expanded query."""
    rewriter = QueryRewriter(use_llm=False)
    res = rewriter.rewrite("Can I install musical horn?")
    assert "musical horn" in res.expanded_terms
    assert len(res.sub_queries) >= 1
    assert res.sub_queries[0] == res.rewritten_query


def test_query_rewriter_sub_queries_llm_json() -> None:
    """LLM rewriter parses JSON output into rewritten_query and decomposed sub_queries."""
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.choices = [
        MagicMock(
            message=MagicMock(
                content='{"rewritten_query": "noise limits and contest procedure", "sub_queries": ["horn limits", "exhaust limits", "contest fine"]}'
            )
        )
    ]
    mock_client.chat.completions.create.return_value = mock_resp

    rewriter = QueryRewriter(client=mock_client, use_llm=True)
    res = rewriter.rewrite("Is my horn loud and how do I contest fine?")
    assert len(res.sub_queries) == 3
    assert res.sub_queries[0] == "horn limits"
    assert res.sub_queries[1] == "exhaust limits"
    assert res.sub_queries[2] == "contest fine"


def test_query_rewriter_singlish_expansion() -> None:
    """Verifies that common Singlish terms expand to formal statutory terms."""
    rewriter = QueryRewriter(use_llm=False)
    res = rewriter.rewrite("helmet nathiwa giyoth fine eka keeyada?")
    assert "helmet nathiwa" in res.expanded_terms
    assert "section 158" in res.rewritten_query.lower()
    assert "gazette 2054/09" in res.rewritten_query.lower()
