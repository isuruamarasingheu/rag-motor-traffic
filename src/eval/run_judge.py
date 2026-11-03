"""Run automated LLM-as-a-Judge evaluation and compute agreement metrics.

Conforms to Phase 10.2 and data/eval/FAITHFULNESS_RUBRIC.md.
"""

from __future__ import annotations

import argparse
import csv
import logging
from pathlib import Path
from typing import Any

from src.eval.judge import FaithfulnessJudge

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("eval.run_judge")


def compute_cohen_kappa(
    rater1: list[int],
    rater2: list[int],
    categories: list[int] | None = None,
    weights: str = "quadratic",
) -> float:
    """Calculate Cohen's kappa with optional linear or quadratic weights."""
    if len(rater1) != len(rater2) or not rater1:
        return 0.0

    cats = categories or sorted(set(rater1 + rater2))
    k = len(cats)
    if k <= 1:
        return 1.0

    cat_map = {cat: i for i, cat in enumerate(cats)}

    # Build observed confusion matrix
    observed = [[0 for _ in range(k)] for _ in range(k)]
    for r1, r2 in zip(rater1, rater2):
        if r1 in cat_map and r2 in cat_map:
            observed[cat_map[r1]][cat_map[r2]] += 1

    total = len(rater1)
    if total == 0:
        return 0.0

    # Build weight matrix
    weight_matrix = [[0.0 for _ in range(k)] for _ in range(k)]
    for i in range(k):
        for j in range(k):
            if weights == "quadratic":
                weight_matrix[i][j] = float((i - j) ** 2) / float((k - 1) ** 2) if k > 1 else 0.0
            elif weights == "linear":
                weight_matrix[i][j] = float(abs(i - j)) / float(k - 1) if k > 1 else 0.0
            else:
                weight_matrix[i][j] = 1.0 if i != j else 0.0

    # Marginal sums
    row_sums = [sum(observed[i][j] for j in range(k)) for i in range(k)]
    col_sums = [sum(observed[i][j] for i in range(k)) for j in range(k)]

    # Expected matrix
    expected = [[(row_sums[i] * col_sums[j]) / float(total) for j in range(k)] for i in range(k)]

    # Calculate weighted observed and expected disagreement
    po_disagree = sum(
        weight_matrix[i][j] * observed[i][j] for i in range(k) for j in range(k)
    ) / float(total)
    pe_disagree = sum(
        weight_matrix[i][j] * expected[i][j] for i in range(k) for j in range(k)
    ) / float(total)

    if pe_disagree == 0.0:
        return 1.0

    kappa = 1.0 - (po_disagree / pe_disagree)
    return round(kappa, 4)


def evaluate_scoring_sheet(
    input_csv: Path | str,
    output_csv: Path | str,
    output_md: Path | str,
    judge_model: str = "gpt-4o",
) -> dict[str, Any]:
    """Execute LLM judge over scoring sheet and output comparative analysis."""
    in_path = Path(input_csv)
    if not in_path.exists():
        raise FileNotFoundError(f"Input scoring sheet not found: {in_path}")

    logger.info("Initializing FaithfulnessJudge (model: %s)...", judge_model)
    judge = FaithfulnessJudge(model=judge_model)

    rows: list[dict[str, str]] = []
    with open(in_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    logger.info("Loaded %d rows from %s for evaluation", len(rows), in_path)

    evaluated_rows: list[dict[str, Any]] = []
    human_scores: list[int] = []
    judge_scores: list[int] = []

    for idx, row in enumerate(rows, 1):
        qid = row.get("query_id", f"Q{idx:03d}")
        q_text = row.get("question", "")
        status = row.get("pipeline_status", "answered")
        answer = row.get("system_answer", "")
        citations = row.get("citations", "")
        retrieved = row.get("retrieved_passages", "")

        logger.info("[%d/%d] Auditing %s...", idx, len(rows), qid)

        judge_result = judge.evaluate(
            question=q_text,
            retrieved_passages=retrieved,
            answer=answer,
            citations=citations,
            status=status,
        )

        j_score = judge_result.get("faithfulness_score", 0)
        j_inv_num = judge_result.get("invented_number", False)
        j_cite_acc = judge_result.get("citation_accuracy", "WRONG")
        j_claims = "; ".join(judge_result.get("unsupported_claims", []))
        j_reasoning = judge_result.get("reasoning", "")

        row_copy = dict(row)
        row_copy["judge_faithfulness_score"] = str(j_score)
        row_copy["judge_invented_number"] = str(j_inv_num)
        row_copy["judge_citation_accuracy"] = j_cite_acc
        row_copy["judge_unsupported_claims"] = j_claims
        row_copy["judge_reasoning"] = j_reasoning

        evaluated_rows.append(row_copy)

        # Check for human scores
        h_score_raw = row.get("human_faithfulness_score", "").strip()
        if h_score_raw.isdigit():
            human_scores.append(int(h_score_raw))
            judge_scores.append(j_score)

    # Save enriched CSV
    out_csv_path = Path(output_csv)
    out_csv_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = list(evaluated_rows[0].keys())
    with open(out_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(evaluated_rows)
    logger.info("Saved itemized judge evaluation to %s", out_csv_path)

    # Compute summary statistics
    all_judge_scores = [int(r["judge_faithfulness_score"]) for r in evaluated_rows]
    mean_judge_score = sum(all_judge_scores) / len(all_judge_scores) if all_judge_scores else 0.0
    grounded_count = sum(1 for s in all_judge_scores if s == 2)
    partial_count = sum(1 for s in all_judge_scores if s == 1)
    hallucinated_count = sum(1 for s in all_judge_scores if s == 0)
    invented_num_count = sum(1 for r in evaluated_rows if r["judge_invented_number"].lower() == "true")

    exact_agreement = 0.0
    quad_kappa = 0.0
    has_human_comparison = len(human_scores) > 0

    if has_human_comparison:
        agreements = sum(1 for h, j in zip(human_scores, judge_scores) if h == j)
        exact_agreement = agreements / len(human_scores)
        quad_kappa = compute_cohen_kappa(human_scores, judge_scores, categories=[0, 1, 2], weights="quadratic")

    # Generate Markdown Summary Report
    md_lines = [
        "# Automated LLM-as-a-Judge Faithfulness Benchmark Report",
        "",
        f"- **Evaluated File:** `{in_path.name}` ({len(evaluated_rows)} samples)",
        f"- **Judge Model:** `{judge_model}` (independent evaluator)",
        f"- **Mean Faithfulness Score:** **{mean_judge_score:.3f} / 2.000**",
        f"- **Fully Grounded Answers (Score 2):** {grounded_count} ({grounded_count / len(evaluated_rows) * 100:.1f}%)",
        f"- **Partially Grounded (Score 1):** {partial_count} ({partial_count / len(evaluated_rows) * 100:.1f}%)",
        f"- **Ungrounded / Hallucinated (Score 0):** {hallucinated_count} ({hallucinated_count / len(evaluated_rows) * 100:.1f}%)",
        f"- **Invented Number Rate:** {invented_num_count} / {len(evaluated_rows)} ({invented_num_count / len(evaluated_rows) * 100:.1f}%)",
        "",
    ]

    if has_human_comparison:
        md_lines.extend([
            "## Human vs. LLM Judge Inter-Rater Reliability",
            "",
            f"- **Evaluated Human Samples:** {len(human_scores)}",
            f"- **Exact Agreement Rate:** **{exact_agreement * 100:.1f}%**",
            f"- **Cohen's Weighted Kappa (Quadratic):** **{quad_kappa:.4f}**",
            "",
            "### Confusion Matrix (Rows: Human Rater, Columns: LLM Judge)",
            "| Human \\ Judge | Score 0 | Score 1 | Score 2 |",
            "|:---:|:---:|:---:|:---:|",
        ])
        for h in (0, 1, 2):
            counts = [
                sum(1 for hs, js in zip(human_scores, judge_scores) if hs == h and js == j)
                for j in (0, 1, 2)
            ]
            md_lines.append(f"| **Score {h}** | {counts[0]} | {counts[1]} | {counts[2]} |")
        md_lines.append("")

    md_lines.extend([
        "## Itemized Sample Breakdown",
        "",
        "| ID | Type | Status | Judge Score | Invented Num | Citation Acc | Unsupported Claims |",
        "|---|---|---|:---:|:---:|:---:|---|",
    ])

    for r in evaluated_rows:
        claims = r["judge_unsupported_claims"] or "None"
        md_lines.append(
            f"| `{r['query_id']}` | {r['type']} | `{r['pipeline_status']}` | **{r['judge_faithfulness_score']}** | {r['judge_invented_number']} | `{r['judge_citation_accuracy']}` | {claims} |"
        )

    out_md_path = Path(output_md)
    out_md_path.parent.mkdir(parents=True, exist_ok=True)
    out_md_path.write_text("\n".join(md_lines), encoding="utf-8")
    logger.info("Saved summary markdown report to %s", out_md_path)

    return {
        "total": len(evaluated_rows),
        "mean_score": mean_judge_score,
        "grounded_count": grounded_count,
        "exact_agreement": exact_agreement,
        "quadratic_kappa": quad_kappa,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run LLM-as-a-Judge faithfulness audit")
    parser.add_argument(
        "--sheet",
        default="reports/human_scoring_sheet_dev.csv",
        help="Input human scoring sheet CSV path",
    )
    parser.add_argument(
        "--model",
        default="gpt-4o",
        help="Judge model identifier (default: gpt-4o)",
    )
    parser.add_argument(
        "--output-csv",
        default="reports/judge_evaluation_dev.csv",
        help="Output CSV path",
    )
    parser.add_argument(
        "--output-md",
        default="reports/judge_vs_human_dev.md",
        help="Output Markdown summary path",
    )
    args = parser.parse_args()

    evaluate_scoring_sheet(
        input_csv=args.sheet,
        output_csv=args.output_csv,
        output_md=args.output_md,
        judge_model=args.model,
    )


if __name__ == "__main__":
    main()
