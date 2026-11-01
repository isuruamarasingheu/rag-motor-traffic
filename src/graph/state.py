"""State definitions for the LangGraph legal RAG pipeline."""

from __future__ import annotations

from typing import Any, Literal, TypedDict


class GraphState(TypedDict, total=False):
    """Execution state schema passed across LangGraph nodes."""

    # Query inputs
    question: str
    query_id: str | None
    rewritten_query: str

    # Scope classification
    is_in_scope: bool
    scope_reason: str

    # Retrieval & Confidence Gating
    retrieved_hits: list[dict[str, Any]]
    confidence_passed: bool
    confidence_score: float
    confidence_reason: str

    # Generation & Citations
    raw_generation: dict[str, Any]

    # Final Response Contract (AGENTS.md §6.3)
    status: Literal["answered", "refused_out_of_scope", "not_found"]
    answer: str | None
    citations: list[dict[str, str]]
    disclaimer: str

    # Metadata & Logging
    execution_log: dict[str, Any]
