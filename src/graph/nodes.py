"""LangGraph node functions and conditional edge routers for the legal RAG assistant."""

from __future__ import annotations

from typing import Any, Literal

from src.generation.gate import ConfidenceGate
from src.generation.generator import LEGAL_DISCLAIMER, GroundedGenerator
from src.graph.logger import PipelineLogger
from src.graph.scope import REFUSAL_MESSAGE, ScopeClassifier
from src.graph.state import GraphState
from src.retrieval.hybrid import HybridRetriever
from src.retrieval.rewrite import QueryRewriter


class PipelineNodes:
    """Encapsulates node execution logic with injected dependencies."""

    def __init__(
        self,
        scope_classifier: ScopeClassifier | None = None,
        rewriter: QueryRewriter | None = None,
        retriever: HybridRetriever | None = None,
        gate: ConfidenceGate | None = None,
        generator: GroundedGenerator | None = None,
        logger: PipelineLogger | None = None,
        top_k: int = 8,
    ) -> None:
        self.scope_classifier = scope_classifier or ScopeClassifier()
        self.rewriter = rewriter or QueryRewriter()
        self.retriever = retriever or HybridRetriever()
        self.gate = gate or ConfidenceGate()
        self.generator = generator or GroundedGenerator()
        self.logger = logger or PipelineLogger()
        self.top_k = top_k

    def scope_check(self, state: GraphState) -> dict[str, Any]:
        """Node: Classify question scope (in-scope vs out-of-scope)."""
        question = state.get("question", "")
        result = self.scope_classifier.classify(question)
        return {
            "is_in_scope": result.in_scope,
            "scope_reason": result.reason,
        }

    def refuse(self, state: GraphState) -> dict[str, Any]:
        """Node: Construct standard domain refusal for out-of-scope queries."""
        return {
            "status": "refused_out_of_scope",
            "answer": REFUSAL_MESSAGE,
            "citations": [],
            "disclaimer": LEGAL_DISCLAIMER,
        }

    def rewrite_and_retrieve(self, state: GraphState) -> dict[str, Any]:
        """Node: Expand query with statutory terms, decompose if compound, and perform hybrid retrieval."""
        question = state.get("question", "")
        rewrite_res = self.rewriter.rewrite(question)
        rewritten = rewrite_res.rewritten_query
        sub_queries = getattr(rewrite_res, "sub_queries", None) or [rewritten]

        if len(sub_queries) > 1:
            per_sub_k = min(self.top_k, max(3, (self.top_k // len(sub_queries)) + 2))
            hits_by_id: dict[str, dict[str, Any]] = {}
            for sq in sub_queries:
                sub_hits = self.retriever.retrieve(sq, top_k=per_sub_k)
                for h in sub_hits:
                    hid = h["id"]
                    if hid not in hits_by_id:
                        hits_by_id[hid] = h
                    else:
                        if h.get("score", 0.0) > hits_by_id[hid].get("score", 0.0):
                            hits_by_id[hid] = h

            merged_hits = sorted(
                hits_by_id.values(),
                key=lambda x: x.get("score", 0.0),
                reverse=True,
            )[: self.top_k]
            hits = merged_hits
        else:
            hits = self.retriever.retrieve(rewritten, top_k=self.top_k)

        return {
            "rewritten_query": rewritten,
            "retrieved_hits": hits,
        }

    def confidence_gate(self, state: GraphState) -> dict[str, Any]:
        """Node: Evaluate retrieval confidence before invoking LLM generation."""
        hits = state.get("retrieved_hits", [])
        passed, score, reason = self.gate.evaluate(hits)
        return {
            "confidence_passed": passed,
            "confidence_score": score,
            "confidence_reason": reason,
        }

    def not_found(self, state: GraphState) -> dict[str, Any]:
        """Node: Construct not_found response when confidence threshold fails."""
        return {
            "status": "not_found",
            "answer": (
                "I could not find a relevant provision in Sri Lanka's Motor Traffic Act "
                "or gazette regulations to answer your question."
            ),
            "citations": [],
            "disclaimer": LEGAL_DISCLAIMER,
        }

    def generate(self, state: GraphState) -> dict[str, Any]:
        """Node: Generate grounded, cited answer using retrieved provisions."""
        question = state.get("question", "")
        hits = state.get("retrieved_hits", [])

        gen_result = self.generator.generate(question=question, retrieved_hits=hits)
        return {
            "status": gen_result.get("status", "not_found"),
            "answer": gen_result.get("answer"),
            "citations": gen_result.get("citations", []),
            "disclaimer": gen_result.get("disclaimer", LEGAL_DISCLAIMER),
        }

    def respond(self, state: GraphState) -> dict[str, Any]:
        """Node: Log interaction and return final validated response contract."""
        self.logger.log_interaction(dict(state))
        return {
            "status": state.get("status", "not_found"),
            "answer": state.get("answer"),
            "citations": state.get("citations", []),
            "disclaimer": state.get("disclaimer", LEGAL_DISCLAIMER),
        }


def route_scope(state: GraphState) -> Literal["rewrite_and_retrieve", "refuse"]:
    """Conditional router following scope_check node."""
    if state.get("is_in_scope", True):
        return "rewrite_and_retrieve"
    return "refuse"


def route_confidence(state: GraphState) -> Literal["generate", "not_found"]:
    """Conditional router following confidence_gate node."""
    if state.get("confidence_passed", False):
        return "generate"
    return "not_found"
