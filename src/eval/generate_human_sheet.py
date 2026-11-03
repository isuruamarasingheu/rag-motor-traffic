"""Generate human evaluation and scoring sheets for faithfulness and grounding evaluation.

Conforms to Phase 10.1 and data/eval/FAITHFULNESS_RUBRIC.md.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import random
from pathlib import Path
from typing import Any

from src.graph.builder import build_legal_rag_graph

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("eval.generate_human_sheet")


def load_questions(questions_path: Path | str) -> list[dict[str, Any]]:
    """Load JSONL questions file."""
    path = Path(questions_path)
    if not path.exists():
        raise FileNotFoundError(f"Questions file not found: {path}")

    questions = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                questions.append(json.loads(line))
    return questions


def sample_questions_stratified(
    questions: list[dict[str, Any]],
    sample_size: int,
    seed: int = 42,
) -> list[dict[str, Any]]:
    """Sample questions proportionally across types (in_scope, edge, out_of_scope)."""
    if sample_size <= 0 or sample_size >= len(questions):
        return questions

    rng = random.Random(seed)
    by_type: dict[str, list[dict[str, Any]]] = {}
    for q in questions:
        q_type = q.get("type", "in_scope")
        by_type.setdefault(q_type, []).append(q)

    sampled: list[dict[str, Any]] = []
    for q_type, q_list in by_type.items():
        type_count = max(1, round(len(q_list) / len(questions) * sample_size))
        chosen = rng.sample(q_list, min(type_count, len(q_list)))
        sampled.extend(chosen)

    # Adjust if rounding gave slightly different count
    if len(sampled) > sample_size:
        sampled = rng.sample(sampled, sample_size)
    elif len(sampled) < sample_size:
        remaining = [q for q in questions if q not in sampled]
        sampled.extend(rng.sample(remaining, sample_size - len(sampled)))

    sampled.sort(key=lambda x: x.get("id", ""))
    return sampled


def format_retrieved_passages(hits: list[dict[str, Any]]) -> str:
    """Format retrieved statutory passages into a clean multiline text block."""
    if not hits:
        return "None (No passages retrieved or confidence gate failed)"

    blocks = []
    for idx, hit in enumerate(hits, 1):
        sec_id = hit.get("id", "UNKNOWN")
        citation = hit.get("citation", sec_id)
        text = hit.get("text", "").strip()
        score = hit.get("score", 0.0)
        blocks.append(f"[{idx}] {citation} (Score: {score:.3f}):\n{text}")

    return "\n\n---\n\n".join(blocks)


def generate_scoring_sheet(
    questions_path: Path | str,
    output_csv_path: Path | str,
    sample_size: int = -1,
    seed: int = 42,
) -> Path:
    """Run pipeline on questions and export a formatted human evaluation sheet."""
    q_path = Path(questions_path)
    out_path = Path(output_csv_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    questions = load_questions(q_path)
    logger.info("Loaded %d questions from %s", len(questions), q_path)

    sample = sample_questions_stratified(questions, sample_size, seed=seed)
    logger.info("Selected %d sample questions for evaluation", len(sample))

    logger.info("Initializing LangGraph pipeline...")
    graph = build_legal_rag_graph()

    csv_rows = []
    for idx, q in enumerate(sample, 1):
        qid = q.get("id", f"Q{idx:03d}")
        question_text = q.get("question", "")
        q_type = q.get("type", "in_scope")
        expected = q.get("expected_behavior", "answer_with_citation")
        gold_sections = "; ".join(q.get("gold_sections", []))

        logger.info("[%d/%d] Processing %s: %s", idx, len(sample), qid, question_text)

        initial_state = {
            "question": question_text,
            "query_id": qid,
        }

        try:
            final_state = graph.invoke(initial_state)
            pipeline_status = final_state.get("status", "not_found")
            system_answer = final_state.get("answer", "") or ""
            citations = "; ".join(
                c.get("citation", c.get("id", ""))
                for c in final_state.get("citations", [])
            )
            retrieved_hits = final_state.get("retrieved_hits", [])
            retrieved_text = format_retrieved_passages(retrieved_hits)
        except (RuntimeError, ValueError, KeyError, TypeError, OSError) as exc:
            logger.error("Error processing %s: %s", qid, exc)
            pipeline_status = "error"
            system_answer = f"ERROR: {exc}"
            citations = ""
            retrieved_text = ""

        csv_rows.append({
            "query_id": qid,
            "question": question_text,
            "type": q_type,
            "expected_behavior": expected,
            "gold_sections": gold_sections,
            "pipeline_status": pipeline_status,
            "system_answer": system_answer,
            "citations": citations,
            "retrieved_passages": retrieved_text,
            "human_faithfulness_score": "",  # Blank for human: 0, 1, 2
            "invented_number": "",           # Blank for human: TRUE / FALSE
            "citation_accuracy": "",         # Blank for human: EXACT / PARENT / WRONG / NA
            "refusal_correctness": "",       # Blank for human: CORRECT / FALSE_REFUSAL / MISSED_REFUSAL
            "annotator_notes": "",           # Blank for qualitative remarks
        })

    fieldnames = [
        "query_id",
        "question",
        "type",
        "expected_behavior",
        "gold_sections",
        "pipeline_status",
        "system_answer",
        "citations",
        "retrieved_passages",
        "human_faithfulness_score",
        "invented_number",
        "citation_accuracy",
        "refusal_correctness",
        "annotator_notes",
    ]

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(csv_rows)

    logger.info("Human scoring sheet successfully saved to %s", out_path)
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate human evaluation sheet for legal RAG faithfulness"
    )
    parser.add_argument(
        "--set",
        default="dev",
        choices=["dev", "frozen"],
        help="Evaluation question set (default: dev)",
    )
    parser.add_argument(
        "--sample-size",
        type=int,
        default=-1,
        help="Number of questions to sample (-1 for full set)",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Custom output CSV path",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Sampling random seed",
    )
    args = parser.parse_args()

    q_file = Path(f"data/eval/{args.set}/questions.jsonl")
    if not q_file.exists():
        q_file = Path(f"DATA/eval/{args.set}/questions.jsonl")

    output_file = args.output
    if not output_file:
        output_file = f"reports/human_scoring_sheet_{args.set}.csv"

    generate_scoring_sheet(
        questions_path=q_file,
        output_csv_path=output_file,
        sample_size=args.sample_size,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
