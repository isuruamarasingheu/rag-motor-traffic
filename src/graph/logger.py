"""Structured pipeline execution logger for query evaluation and error analysis."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


class PipelineLogger:
    """Logs query interactions and pipeline decisions for error analysis."""

    def __init__(self, log_path: Path | str | None = None) -> None:
        self.log_path = Path(log_path or "reports/pipeline_queries.jsonl")
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

    def log_interaction(self, state: dict[str, Any]) -> dict[str, Any]:
        """Format and append interaction record from pipeline state."""
        retrieved_hits = state.get("retrieved_hits") or []
        retrieved_ids = [hit["id"] for hit in retrieved_hits if "id" in hit]
        top_dense_score = (
            retrieved_hits[0].get("dense_score") if retrieved_hits else None
        )
        top_rrf_score = retrieved_hits[0].get("score") if retrieved_hits else None

        citations = state.get("citations") or []
        cited_ids = [c["id"] for c in citations if "id" in c]

        record = {
            "timestamp": datetime.now(UTC).isoformat(),
            "query_id": state.get("query_id"),
            "original_query": state.get("question"),
            "rewritten_query": state.get("rewritten_query"),
            "is_in_scope": state.get("is_in_scope"),
            "scope_reason": state.get("scope_reason"),
            "confidence_passed": state.get("confidence_passed"),
            "confidence_score": state.get("confidence_score"),
            "top_dense_score": top_dense_score,
            "top_rrf_score": top_rrf_score,
            "retrieved_ids": retrieved_ids,
            "status": state.get("status"),
            "cited_ids": cited_ids,
            "has_answer": bool(state.get("answer")),
        }

        try:
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except OSError:
            pass

        return record
