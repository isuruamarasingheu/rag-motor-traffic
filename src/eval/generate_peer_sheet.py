"""Generate a blinded evaluation sheet for a second independent human peer rater.

Conforms to Phase 10.3 and data/eval/FAITHFULNESS_RUBRIC.md.
"""

from __future__ import annotations

import argparse
import csv
import logging
import random
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("eval.generate_peer_sheet")


def create_blind_peer_sheet(
    primary_sheet_path: Path | str,
    output_blank_csv: Path | str,
    sample_size: int = 10,
    seed: int = 42,
) -> Path:
    """Create a blinded peer evaluation sheet with all primary ratings removed."""
    in_path = Path(primary_sheet_path)
    out_path = Path(output_blank_csv)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if not in_path.exists():
        raise FileNotFoundError(f"Primary scoring sheet not found: {in_path}")

    rows: list[dict[str, str]] = []
    with open(in_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    logger.info("Loaded %d rows from %s", len(rows), in_path)

    # Stratified sampling by type
    rng = random.Random(seed)
    by_type: dict[str, list[dict[str, str]]] = {}
    for r in rows:
        by_type.setdefault(r.get("type", "in_scope"), []).append(r)

    sampled: list[dict[str, str]] = []
    if sample_size <= 0 or sample_size >= len(rows):
        sampled = list(rows)
    else:
        for q_list in by_type.values():
            count = max(1, round(len(q_list) / len(rows) * sample_size))
            sampled.extend(rng.sample(q_list, min(count, len(q_list))))

        if len(sampled) > sample_size:
            sampled = rng.sample(sampled, sample_size)
        elif len(sampled) < sample_size:
            rem = [r for r in rows if r not in sampled]
            sampled.extend(rng.sample(rem, sample_size - len(sampled)))

    sampled.sort(key=lambda x: x.get("query_id", ""))
    logger.info("Selected %d questions for blind peer review", len(sampled))

    peer_rows = []
    for r in sampled:
        # Strictly exclude primary human scores or judge scores to preserve double-blind objectivity
        peer_rows.append({
            "query_id": r.get("query_id", ""),
            "question": r.get("question", ""),
            "type": r.get("type", ""),
            "expected_behavior": r.get("expected_behavior", ""),
            "pipeline_status": r.get("pipeline_status", ""),
            "system_answer": r.get("system_answer", ""),
            "citations": r.get("citations", ""),
            "retrieved_passages": r.get("retrieved_passages", ""),
            "peer_faithfulness_score": "",    # Blank for peer rater: 0, 1, 2
            "peer_invented_number": "",        # Blank for peer rater: TRUE / FALSE
            "peer_citation_accuracy": "",      # Blank for peer rater: EXACT / PARENT / WRONG / NA
            "peer_refusal_correctness": "",    # Blank for peer rater: CORRECT / FALSE_REFUSAL / MISSED_REFUSAL
            "peer_notes": "",                  # Blank for peer rater comments
        })

    fieldnames = [
        "query_id",
        "question",
        "type",
        "expected_behavior",
        "pipeline_status",
        "system_answer",
        "citations",
        "retrieved_passages",
        "peer_faithfulness_score",
        "peer_invented_number",
        "peer_citation_accuracy",
        "peer_refusal_correctness",
        "peer_notes",
    ]

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(peer_rows)

    logger.info("Saved blind peer scoring sheet to %s", out_path)
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate blind peer scoring sheet")
    parser.add_argument(
        "--primary",
        default="reports/human_scoring_sheet_dev.csv",
        help="Primary scoring sheet CSV path",
    )
    parser.add_argument(
        "--output",
        default="data/eval/peer_scoring_sheet_blank.csv",
        help="Output blind peer scoring sheet path",
    )
    parser.add_argument(
        "--sample-size",
        type=int,
        default=10,
        help="Sample size for peer review (default: 10)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Sampling random seed",
    )
    args = parser.parse_args()

    create_blind_peer_sheet(
        primary_sheet_path=args.primary,
        output_blank_csv=args.output,
        sample_size=args.sample_size,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
