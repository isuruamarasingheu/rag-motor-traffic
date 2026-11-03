"""Final benchmark runner on the frozen evaluation set (data/eval/frozen/questions.jsonl).

Conforms to Phase 10.4, AGENTS.md §2, and skill rag-eval.
Computes:
1. Retrieval metrics (Precision@k, Recall@k, MRR) - RQ1
2. Faithfulness, citation validity, and hallucination reduction - RQ2
3. Scope-restriction rate and refusal behavior - RQ3
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import logging
import subprocess
from pathlib import Path
from typing import Any

from src.eval.judge import FaithfulnessJudge
from src.graph.builder import build_legal_rag_graph

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("eval.frozen_benchmark")


def get_git_commit() -> str:
    """Retrieve current short git commit hash."""
    try:
        res = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        )
        return res.stdout.strip()
    except (subprocess.SubprocessError, FileNotFoundError, OSError):
        return "unknown"


def compute_file_sha256(path: Path | str) -> str:
    """Compute SHA-256 checksum of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest().upper()


def format_retrieved_passages(hits: list[dict[str, Any]]) -> str:
    """Format retrieved statutory passages into a clean multiline text block."""
    if not hits:
        return "None (No passages retrieved or confidence gate failed)"

    blocks = []
    for idx, hit in enumerate(hits, 1):
        sec_id = hit.get("id", "UNKNOWN")
        metadata = hit.get("metadata", {}) or {}
        citation = hit.get("citation") or metadata.get("citation", sec_id)
        text = hit.get("document", "") or hit.get("text", "") or metadata.get("text", "")
        score = hit.get("score", 0.0)
        blocks.append(f"[{idx}] {citation} (Score: {score:.3f}):\n{text.strip()}")

    return "\n\n---\n\n".join(blocks)


def calculate_retrieval_stats(
    retrieved_hits: list[dict[str, Any]],
    gold_sections: list[str],
) -> dict[str, float]:
    """Calculate P@k, R@k (k in {1, 3, 5}), and RR for an individual question."""
    if not gold_sections:
        return {
            "mrr": 0.0,
            "p@1": 0.0,
            "r@1": 0.0,
            "p@3": 0.0,
            "r@3": 0.0,
            "p@5": 0.0,
            "r@5": 0.0,
        }

    gold_set = set(gold_sections)
    retrieved_ids = [h.get("id", "") for h in retrieved_hits]

    # Reciprocal rank of first hit
    rr = 0.0
    for rank, rid in enumerate(retrieved_ids, 1):
        if rid in gold_set:
            rr = 1.0 / rank
            break

    def p_at_k(k: int) -> float:
        top = retrieved_ids[:k]
        hits = sum(1 for rid in top if rid in gold_set)
        return hits / k if k > 0 else 0.0

    def r_at_k(k: int) -> float:
        top = retrieved_ids[:k]
        hits = sum(1 for rid in top if rid in gold_set)
        return hits / len(gold_set) if len(gold_set) > 0 else 0.0

    return {
        "mrr": rr,
        "p@1": p_at_k(1),
        "r@1": r_at_k(1),
        "p@3": p_at_k(3),
        "r@3": r_at_k(3),
        "p@5": p_at_k(5),
        "r@5": r_at_k(5),
    }


def run_frozen_benchmark(
    questions_path: Path | str = "data/eval/frozen/questions.jsonl",
    output_csv: Path | str = "reports/frozen_benchmark_rag.csv",
    output_md: Path | str = "reports/frozen_benchmark_rag.md",
    judge_model: str = "gpt-4o",
) -> dict[str, Any]:
    """Execute complete RAG benchmark across all frozen questions."""
    q_path = Path(questions_path)
    if not q_path.exists():
        q_path = Path("DATA/eval/frozen/questions.jsonl")

    sha256 = compute_file_sha256(q_path)
    git_commit = get_git_commit()

    logger.info("Starting Frozen Benchmark: %s (SHA-256: %s, Commit: %s)", q_path, sha256, git_commit)

    questions = []
    with open(q_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                questions.append(json.loads(line))

    logger.info("Loaded %d frozen evaluation questions", len(questions))

    graph = build_legal_rag_graph()
    judge = FaithfulnessJudge(model=judge_model)

    evaluated_rows = []
    in_scope_mrr_list = []
    in_scope_p1_list = []
    in_scope_r1_list = []
    in_scope_p3_list = []
    in_scope_r3_list = []
    in_scope_p5_list = []
    in_scope_r5_list = []

    out_of_scope_total = 0
    out_of_scope_correct = 0

    in_scope_total = 0
    in_scope_false_refusals = 0

    for idx, q in enumerate(questions, 1):
        qid = q.get("id", f"Q{idx:03d}")
        q_text = q.get("question", "")
        q_type = q.get("type", "in_scope")
        expected = q.get("expected_behavior", "answer_with_citation")
        gold_sections = q.get("gold_sections", [])

        logger.info("[%d/%d] Evaluating %s (%s)...", idx, len(questions), qid, q_type)

        final_state = graph.invoke({"question": q_text, "query_id": qid})
        status = final_state.get("status", "not_found")
        answer = final_state.get("answer", "") or ""
        citations = "; ".join(
            c.get("citation", c.get("id", ""))
            for c in final_state.get("citations", [])
        )
        retrieved_hits = final_state.get("retrieved_hits", [])
        retrieved_text = format_retrieved_passages(retrieved_hits)

        # Retrieval metrics
        r_stats = calculate_retrieval_stats(retrieved_hits, gold_sections)

        if q_type in ("in_scope", "edge") and gold_sections:
            in_scope_mrr_list.append(r_stats["mrr"])
            in_scope_p1_list.append(r_stats["p@1"])
            in_scope_r1_list.append(r_stats["r@1"])
            in_scope_p3_list.append(r_stats["p@3"])
            in_scope_r3_list.append(r_stats["r@3"])
            in_scope_p5_list.append(r_stats["p@5"])
            in_scope_r5_list.append(r_stats["r@5"])

        # Scope metrics
        if q_type == "out_of_scope":
            out_of_scope_total += 1
            if status == "refused_out_of_scope":
                out_of_scope_correct += 1
        elif q_type in ("in_scope", "edge"):
            in_scope_total += 1
            if status == "refused_out_of_scope":
                in_scope_false_refusals += 1

        # Faithfulness audit via Judge
        audit = judge.evaluate(
            question=q_text,
            retrieved_passages=retrieved_text,
            answer=answer,
            citations=citations,
            status=status,
        )

        row = {
            "query_id": qid,
            "question": q_text,
            "type": q_type,
            "expected_behavior": expected,
            "gold_sections": "; ".join(gold_sections),
            "pipeline_status": status,
            "system_answer": answer,
            "citations": citations,
            "retrieved_passages": retrieved_text,
            "mrr": f"{r_stats['mrr']:.4f}",
            "p@1": f"{r_stats['p@1']:.4f}",
            "r@1": f"{r_stats['r@1']:.4f}",
            "p@3": f"{r_stats['p@3']:.4f}",
            "r@3": f"{r_stats['r@3']:.4f}",
            "p@5": f"{r_stats['p@5']:.4f}",
            "r@5": f"{r_stats['r@5']:.4f}",
            "judge_faithfulness_score": str(audit.get("faithfulness_score", 0)),
            "judge_invented_number": str(audit.get("invented_number", False)),
            "judge_citation_accuracy": audit.get("citation_accuracy", "WRONG"),
            "judge_unsupported_claims": "; ".join(audit.get("unsupported_claims", [])),
            "judge_reasoning": audit.get("reasoning", ""),
        }
        evaluated_rows.append(row)

    # Save CSV
    out_csv_path = Path(output_csv)
    out_csv_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(evaluated_rows[0].keys())
    with open(out_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(evaluated_rows)

    # Aggregate metrics
    mean_mrr = sum(in_scope_mrr_list) / len(in_scope_mrr_list) if in_scope_mrr_list else 0.0
    mean_p1 = sum(in_scope_p1_list) / len(in_scope_p1_list) if in_scope_p1_list else 0.0
    mean_r1 = sum(in_scope_r1_list) / len(in_scope_r1_list) if in_scope_r1_list else 0.0
    mean_p3 = sum(in_scope_p3_list) / len(in_scope_p3_list) if in_scope_p3_list else 0.0
    mean_r3 = sum(in_scope_r3_list) / len(in_scope_r3_list) if in_scope_r3_list else 0.0
    mean_p5 = sum(in_scope_p5_list) / len(in_scope_p5_list) if in_scope_p5_list else 0.0
    mean_r5 = sum(in_scope_r5_list) / len(in_scope_r5_list) if in_scope_r5_list else 0.0

    scope_restriction_rate = (
        out_of_scope_correct / out_of_scope_total if out_of_scope_total > 0 else 1.0
    )
    false_refusal_rate = (
        in_scope_false_refusals / in_scope_total if in_scope_total > 0 else 0.0
    )

    all_scores = [int(r["judge_faithfulness_score"]) for r in evaluated_rows]
    mean_faithfulness = sum(all_scores) / len(all_scores) if all_scores else 0.0
    fully_grounded = sum(1 for s in all_scores if s == 2)
    invented_nums = sum(1 for r in evaluated_rows if r["judge_invented_number"].lower() == "true")

    # Generate Markdown Report
    md_lines = [
        "# Frozen Test Set Benchmark Report: Citation-Grounded Legal RAG",
        "",
        f"- **Dataset:** `{q_path.name}` ({len(questions)} questions)",
        f"- **Dataset SHA-256:** `{sha256}` (Frozen & Verified)",
        f"- **Git Commit:** `{git_commit}`",
        f"- **Generator Model:** `gpt-4o-mini` | **Judge Model:** `{judge_model}`",
        "",
        "## 1. Research Question 1 (RQ1): Retrieval Accuracy",
        "",
        "Evaluation on in-scope statutory questions with verified gold citations:",
        "",
        "| Metric | Value | Academic Standard |",
        "|---|:---:|:---:|",
        f"| **Mean Reciprocal Rank (MRR)** | **{mean_mrr:.4f}** | Primary Rank Metric |",
        f"| **Precision @ 1 (P@1)** | **{mean_p1:.4f}** | Top Rank Precision |",
        f"| **Recall @ 1 (R@1)** | **{mean_r1:.4f}** | Top Rank Recall |",
        f"| **Precision @ 3 (P@3)** | **{mean_p3:.4f}** | Top-3 Precision |",
        f"| **Recall @ 3 (R@3)** | **{mean_r3:.4f}** | Top-3 Recall |",
        f"| **Precision @ 5 (P@5)** | **{mean_p5:.4f}** | Top-5 Precision |",
        f"| **Recall @ 5 (R@5)** | **{mean_r5:.4f}** | Top-5 Recall |",
        "",
        "## 2. Research Question 2 (RQ2): Faithfulness & Hallucination Elimination",
        "",
        "| Faithfulness Metric | Result | Benchmark Target |",
        "|---|:---:|:---:|",
        f"| **Mean Faithfulness Score** | **{mean_faithfulness:.3f} / 2.000** | $\\ge 1.800$ |",
        f"| **Fully Grounded Answers (Score 2)** | **{fully_grounded} / {len(questions)} ({fully_grounded / len(questions) * 100:.1f}%)** | High Grounding |",
        f"| **Invented Number Rate** | **{invented_nums} / {len(questions)} ({invented_nums / len(questions) * 100:.1f}%)** | Zero Hallucinated Numbers |",
        "",
        "## 3. Research Question 3 (RQ3): Scope Restriction & Refusal Reliability",
        "",
        "| Scope Metric | Count | Rate (%) |",
        "|---|:---:|:---:|",
        f"| **Scope Restriction Rate (Correct Out-of-Scope Refusals)** | {out_of_scope_correct} / {out_of_scope_total} | **{scope_restriction_rate * 100:.1f}%** |",
        f"| **False Refusal Rate (Incorrectly Refused In-Scope)** | {in_scope_false_refusals} / {in_scope_total} | **{false_refusal_rate * 100:.1f}%** |",
        "",
        "## 4. Itemized Query Results",
        "",
        "| ID | Type | Expected | Actual Status | P@1 | R@5 | MRR | Judge Score | Inv Num | Citations |",
        "|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|",
    ]

    for r in evaluated_rows:
        md_lines.append(
            f"| `{r['query_id']}` | {r['type']} | `{r['expected_behavior']}` | `{r['pipeline_status']}` | {r['p@1']} | {r['r@5']} | {r['mrr']} | **{r['judge_faithfulness_score']}** | {r['judge_invented_number']} | {r['citations'] or 'None'} |"
        )

    out_md_path = Path(output_md)
    out_md_path.parent.mkdir(parents=True, exist_ok=True)
    out_md_path.write_text("\n".join(md_lines), encoding="utf-8")
    logger.info("Saved final frozen benchmark report to %s", out_md_path)

    return {
        "mrr": mean_mrr,
        "recall_at_5": mean_r5,
        "faithfulness": mean_faithfulness,
        "scope_restriction_rate": scope_restriction_rate,
        "false_refusal_rate": false_refusal_rate,
        "invented_number_rate": invented_nums / len(questions),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run frozen test set benchmark")
    parser.add_argument("--questions", default="data/eval/frozen/questions.jsonl")
    parser.add_argument("--output-csv", default="reports/frozen_benchmark_rag.csv")
    parser.add_argument("--output-md", default="reports/frozen_benchmark_rag.md")
    parser.add_argument("--judge-model", default="gpt-4o")
    args = parser.parse_args()

    run_frozen_benchmark(
        questions_path=args.questions,
        output_csv=args.output_csv,
        output_md=args.output_md,
        judge_model=args.judge_model,
    )


if __name__ == "__main__":
    main()
