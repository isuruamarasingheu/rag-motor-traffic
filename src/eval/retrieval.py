"""Retrieval evaluation harness implementing rag-eval skill metrics."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

PROC_ALIASES: dict[str, str] = {
    "PROC-POL-FINE-s4": "PROC-PG-POL-4",
    "PROC-POL-FINE-s2-1": "PROC-PG-POL-2",
    "PROC-POL-FINE-s2-2": "PROC-PG-POL-2",
    "PROC-POL-FINE-s1-2": "PROC-PG-POL-1",
    "PROC-DMT-TRANSFER": "PROC-PG-DMT-2",
    "PROC-DMT-LICENCE": "PROC-PG-DMT-3",
    "PROC-DMT-CIRCULAR-2022-14": "PROC-DMT_Circular_2022-14_Foreign_License",
}


def is_section_match(retrieved_id: str, gold_id: str) -> bool:
    """Check if retrieved section ID matches gold section ID (including subsections and aliases)."""
    r = PROC_ALIASES.get(retrieved_id, retrieved_id)
    g = PROC_ALIASES.get(gold_id, gold_id)

    if r == g:
        return True

    # Subsection match (e.g. retrieved MTA-1951-s161-1 for gold MTA-1951-s161)
    if r.startswith(f"{g}-") or g.startswith(f"{r}-"):
        return True

    # Base section match if both share the exact base section ID (e.g., MTA-1951-s161)
    if "-s" in r and "-s" in g:
        r_base = r.rsplit("-", 1)[0] if len(r.rsplit("-", 1)[1]) <= 2 else r
        g_base = g.rsplit("-", 1)[0] if len(g.rsplit("-", 1)[1]) <= 2 else g
        if r_base == g_base:
            return True

    return False


def precision_at_k(retrieved_ids: list[str], gold_ids: list[str], k: int) -> float:
    """Calculate Precision@k for a single question."""
    if k <= 0:
        return 0.0
    cutoff = retrieved_ids[:k]
    hits = sum(
        1 for rid in cutoff if any(is_section_match(rid, gid) for gid in gold_ids)
    )
    return hits / k


def recall_at_k(retrieved_ids: list[str], gold_ids: list[str], k: int) -> float:
    """Calculate Recall@k for a single question."""
    if not gold_ids:
        return 0.0
    cutoff = retrieved_ids[:k]
    matched_golds = sum(
        1 for gid in gold_ids if any(is_section_match(rid, gid) for rid in cutoff)
    )
    return matched_golds / len(gold_ids)


def reciprocal_rank(retrieved_ids: list[str], gold_ids: list[str]) -> float:
    """Calculate Reciprocal Rank (RR) of the first matching gold section."""
    for rank, rid in enumerate(retrieved_ids, start=1):
        if any(is_section_match(rid, gid) for gid in gold_ids):
            return 1.0 / rank
    return 0.0


def evaluate_retrieval_variant(
    questions: list[dict[str, Any]],
    retrieve_fn: Callable[[str, int], list[dict[str, Any]]],
    k_values: list[int] | None = None,
    top_k: int = 5,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Evaluate a retrieval variant across a list of questions.

    Returns (aggregated_metrics, per_question_details).
    """
    if k_values is None:
        k_values = [1, 3, 5]

    per_question_rows = []
    # Filter only questions with gold sections (exclude out_of_scope)
    eval_questions = [q for q in questions if q.get("gold_sections")]

    if not eval_questions:
        return {}, []

    for q in eval_questions:
        qid = q["id"]
        q_text = q["question"]
        q_type = q.get("type", "in_scope")
        gold_sections = q["gold_sections"]

        hits = retrieve_fn(q_text, top_k)
        retrieved_ids = [h["id"] for h in hits]

        p_at_k = {
            f"p@{k}": precision_at_k(retrieved_ids, gold_sections, k) for k in k_values
        }
        r_at_k = {
            f"r@{k}": recall_at_k(retrieved_ids, gold_sections, k) for k in k_values
        }
        rr = reciprocal_rank(retrieved_ids, gold_sections)

        row = {
            "id": qid,
            "type": q_type,
            "question": q_text,
            "gold_sections": gold_sections,
            "retrieved_ids": retrieved_ids,
            "mrr": rr,
            **p_at_k,
            **r_at_k,
        }
        per_question_rows.append(row)

    # Compute aggregates (Overall and by question type)
    def compute_mean_metrics(rows: list[dict[str, Any]]) -> dict[str, float]:
        if not rows:
            return {}
        n = len(rows)
        res = {
            "count": float(n),
            "mrr": sum(r["mrr"] for r in rows) / n,
        }
        for k in k_values:
            res[f"p@{k}"] = sum(r[f"p@{k}"] for r in rows) / n
            res[f"r@{k}"] = sum(r[f"r@{k}"] for r in rows) / n
        return res

    overall_metrics = compute_mean_metrics(per_question_rows)
    in_scope_rows = [r for r in per_question_rows if r["type"] == "in_scope"]
    edge_rows = [r for r in per_question_rows if r["type"] == "edge"]

    summary = {
        "overall": overall_metrics,
        "in_scope": compute_mean_metrics(in_scope_rows),
        "edge": compute_mean_metrics(edge_rows),
    }

    return summary, per_question_rows
