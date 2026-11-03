"""Ungrounded Baseline benchmark runner on the frozen evaluation set.

Conforms to Phase 10.4 and skill rag-eval.
Evaluates the same generator model (gpt-4o-mini) WITHOUT retrieval, scoring
faithfulness against the true corpus text to demonstrate hallucination reduction (RQ2).
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
from pathlib import Path
from typing import Any

from openai import OpenAI

from src.eval.judge import FaithfulnessJudge
from src.eval.run_frozen_benchmark import compute_file_sha256, get_git_commit

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("eval.baseline")

BASELINE_SYSTEM_PROMPT = """You are an AI legal information assistant. Answer the following citizen question regarding Sri Lanka law to the best of your knowledge. Provide legal section numbers, fine amounts, and statutory limits if you know them."""


def load_corpus_dict(corpus_path: Path | str = "data/processed/sections.jsonl") -> dict[str, dict[str, Any]]:
    """Load corpus units indexed by section ID for ground truth comparison."""
    path = Path(corpus_path)
    if not path.exists():
        path = Path("DATA/processed/sections.jsonl")

    corpus = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rec = json.loads(line)
                corpus[rec["id"]] = rec
    return corpus


def run_ungrounded_baseline(
    questions_path: Path | str = "data/eval/frozen/questions.jsonl",
    output_csv: Path | str = "reports/frozen_benchmark_baseline.csv",
    output_md: Path | str = "reports/frozen_benchmark_baseline.md",
    model: str = "gpt-4o-mini",
    judge_model: str = "gpt-4o",
) -> dict[str, Any]:
    """Execute ungrounded baseline across all frozen questions."""
    q_path = Path(questions_path)
    if not q_path.exists():
        q_path = Path("DATA/eval/frozen/questions.jsonl")

    sha256 = compute_file_sha256(q_path)
    git_commit = get_git_commit()

    logger.info("Starting Ungrounded Baseline Benchmark: %s (Commit: %s)", q_path, git_commit)

    questions = []
    with open(q_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                questions.append(json.loads(line))

    logger.info("Loaded %d frozen evaluation questions", len(questions))

    corpus = load_corpus_dict()
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    judge = FaithfulnessJudge(model=judge_model)

    evaluated_rows = []
    out_of_scope_refusals = 0
    out_of_scope_total = 0

    for idx, q in enumerate(questions, 1):
        qid = q.get("id", f"Q{idx:03d}")
        q_text = q.get("question", "")
        q_type = q.get("type", "in_scope")
        expected = q.get("expected_behavior", "answer_with_citation")
        gold_sections = q.get("gold_sections", [])

        logger.info("[%d/%d] Baseline generating for %s (%s)...", idx, len(questions), qid, q_type)

        # 1. Call ungrounded model (Zero context / No retrieval)
        try:
            resp = client.chat.completions.create(
                model=model,
                temperature=0.0,
                messages=[
                    {"role": "system", "content": BASELINE_SYSTEM_PROMPT},
                    {"role": "user", "content": q_text},
                ],
            )
            raw_answer = resp.choices[0].message.content or ""
        except (RuntimeError, ValueError, KeyError, TypeError, OSError) as e:
            raw_answer = f"ERROR: {e}"

        # 2. Gather true gold passage text from corpus for the judge to audit against
        gold_passages_list = []
        for gid in gold_sections:
            if gid in corpus:
                c_unit = corpus[gid]
                gold_passages_list.append(f"[{gid}] {c_unit.get('citation', gid)}:\n{c_unit.get('text', '')}")

        gold_text = "\n\n---\n\n".join(gold_passages_list) if gold_passages_list else "None (Out of scope or absent)"

        # Check scope refusal
        is_refusal = (
            "cannot answer" in raw_answer.lower()
            or "outside my scope" in raw_answer.lower()
            or "not able to" in raw_answer.lower()
        )
        if q_type == "out_of_scope":
            out_of_scope_total += 1
            if is_refusal:
                out_of_scope_refusals += 1

        # 3. Audit ungrounded answer against true statutory facts
        audit = judge.evaluate(
            question=q_text,
            retrieved_passages=gold_text,
            answer=raw_answer,
            citations="None (Ungrounded baseline does not verify citations)",
            status="answered" if not is_refusal else "refused_out_of_scope",
        )

        row = {
            "query_id": qid,
            "question": q_text,
            "type": q_type,
            "expected_behavior": expected,
            "gold_sections": "; ".join(gold_sections),
            "baseline_answer": raw_answer,
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

    # Aggregates
    all_scores = [int(r["judge_faithfulness_score"]) for r in evaluated_rows]
    mean_faithfulness = sum(all_scores) / len(all_scores) if all_scores else 0.0
    fully_grounded = sum(1 for s in all_scores if s == 2)
    invented_nums = sum(1 for r in evaluated_rows if r["judge_invented_number"].lower() == "true")
    scope_refusal_rate = out_of_scope_refusals / out_of_scope_total if out_of_scope_total > 0 else 0.0

    md_lines = [
        "# Ungrounded Baseline Benchmark Report (gpt-4o-mini without RAG)",
        "",
        f"- **Dataset:** `{q_path.name}` ({len(questions)} questions)",
        f"- **Dataset SHA-256:** `{sha256}`",
        f"- **Model:** `{model}` (Zero Retrieval / Parametric Memory Only)",
        f"- **Judge Model:** `{judge_model}` (Audited against authentic corpus text)",
        "",
        "## Baseline Performance Summary (Direct Comparison to RAG)",
        "",
        "| Metric | Ungrounded Baseline | Grounded RAG Target |",
        "|---|:---:|:---:|",
        f"| **Mean Faithfulness Score** | **{mean_faithfulness:.3f} / 2.000** | 2.000 / 2.000 |",
        f"| **Fully Grounded Answers** | **{fully_grounded} / {len(questions)} ({fully_grounded / len(questions) * 100:.1f}%)** | ~100% |",
        f"| **Invented Number / Hallucination Rate** | **{invented_nums} / {len(questions)} ({invented_nums / len(questions) * 100:.1f}%)** | 0.0% |",
        f"| **Scope Refusal Rate (Out-of-Scope)** | **{out_of_scope_refusals} / {out_of_scope_total} ({scope_refusal_rate * 100:.1f}%)** | 100.0% |",
        "",
        "## Itemized Query Audit",
        "",
        "| ID | Type | Faithfulness Score | Invented Number | Citation Acc | Reasoning Snippet |",
        "|---|---|:---:|:---:|:---:|---|",
    ]

    for r in evaluated_rows:
        reasoning = (r["judge_reasoning"] or "").replace("\n", " ")[:90] + "..."
        md_lines.append(
            f"| `{r['query_id']}` | {r['type']} | **{r['judge_faithfulness_score']}** | {r['judge_invented_number']} | `{r['judge_citation_accuracy']}` | {reasoning} |"
        )

    out_md_path = Path(output_md)
    out_md_path.parent.mkdir(parents=True, exist_ok=True)
    out_md_path.write_text("\n".join(md_lines), encoding="utf-8")
    logger.info("Saved ungrounded baseline report to %s", out_md_path)

    return {
        "mean_faithfulness": mean_faithfulness,
        "invented_number_rate": invented_nums / len(questions),
        "fully_grounded_rate": fully_grounded / len(questions),
        "scope_refusal_rate": scope_refusal_rate,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run ungrounded baseline benchmark")
    parser.add_argument("--questions", default="data/eval/frozen/questions.jsonl")
    parser.add_argument("--output-csv", default="reports/frozen_benchmark_baseline.csv")
    parser.add_argument("--output-md", default="reports/frozen_benchmark_baseline.md")
    parser.add_argument("--model", default="gpt-4o-mini")
    parser.add_argument("--judge-model", default="gpt-4o")
    args = parser.parse_args()

    run_ungrounded_baseline(
        questions_path=args.questions,
        output_csv=args.output_csv,
        output_md=args.output_md,
        model=args.model,
        judge_model=args.judge_model,
    )


if __name__ == "__main__":
    main()
