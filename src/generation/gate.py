"""Confidence gate module.

Filters low-confidence retrievals before reaching generation to prevent
hallucinations and save LLM token costs on unsupported or out-of-scope queries.
Threshold calibrated empirically on the development question set.
"""

from __future__ import annotations

from typing import Any


class ConfidenceGate:
    """Evaluates whether retrieval results exceed the confidence threshold."""

    def __init__(
        self,
        dense_threshold: float = 0.40,
        rrf_threshold: float = 0.014,
    ) -> None:
        """Initialize confidence gate.

        Args:
            dense_threshold: Minimum dense cosine similarity score required on top hit.
                Calibrated on dev set: in-scope min is 0.4302, out-of-scope max is 0.3730.
            rrf_threshold: Minimum RRF fusion score required on top hit.
                Calibrated on dev set: in-scope min is 0.0155, out-of-scope max is 0.0136.
        """
        self.dense_threshold = dense_threshold
        self.rrf_threshold = rrf_threshold

    def evaluate(self, retrieved_hits: list[dict[str, Any]]) -> tuple[bool, float, str]:
        """Evaluate retrieval confidence.

        Returns:
            (passes_gate, score_used, reason)
        """
        if not retrieved_hits:
            return False, 0.0, "No legal documents retrieved."

        top_hit = retrieved_hits[0]
        dense_score = top_hit.get("dense_score")
        rrf_score = top_hit.get("score", 0.0)

        # If dense score is available, it provides calibrated semantic similarity
        if dense_score is not None:
            if dense_score >= self.dense_threshold:
                return (
                    True,
                    float(dense_score),
                    f"Dense score {dense_score:.4f} >= threshold {self.dense_threshold}",
                )
            return (
                False,
                float(dense_score),
                f"Dense score {dense_score:.4f} below threshold {self.dense_threshold}",
            )

        # Fallback to RRF fusion score if dense score is not present
        if rrf_score >= self.rrf_threshold:
            return (
                True,
                float(rrf_score),
                f"RRF score {rrf_score:.5f} >= threshold {self.rrf_threshold}",
            )

        return (
            False,
            float(rrf_score),
            f"RRF score {rrf_score:.5f} below threshold {self.rrf_threshold}",
        )
