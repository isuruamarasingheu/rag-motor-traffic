"""Deterministic stratified split for evaluation questions."""

import argparse
import json
import random
import sys
from collections import defaultdict
from pathlib import Path

from src.eval.schema import EvalQuestion
from src.eval.validate import validate_questions_file


def split_questions(
    input_file: Path,
    dev_output: Path,
    frozen_output: Path,
    dev_ratio: float = 0.30,
    seed: int = 42,
    force: bool = False,
) -> None:
    """Split questions into dev and frozen sets deterministically and stratified by type.

    Args:
        input_file: Source questions.jsonl path.
        dev_output: Path to write dev/questions.jsonl.
        frozen_output: Path to write frozen/questions.jsonl.
        dev_ratio: Fraction of questions to allocate to dev set (default 0.30).
        seed: Random seed for deterministic stratification.
        force: Allow overwriting frozen_output if True.
    """
    if frozen_output.exists() and not force:
        raise FileExistsError(
            f"Safety check: '{frozen_output}' already exists! "
            "AGENTS.md Rule 5 forbids overwriting frozen evaluation sets. "
            "Use force=True only if explicitly requested."
        )

    valid_questions, errors = validate_questions_file(input_file)
    if errors:
        raise ValueError(
            f"Input file '{input_file}' has validation errors:\n"
            + "\n".join(f"  - {e}" for e in errors)
        )

    if not valid_questions:
        raise ValueError(f"Input file '{input_file}' contains no valid questions.")

    # Group by type for stratified splitting
    by_type: dict[str, list[EvalQuestion]] = defaultdict(list)
    for q in valid_questions:
        by_type[q.type].append(q)

    rng = random.Random(seed)
    dev_questions: list[EvalQuestion] = []
    frozen_questions: list[EvalQuestion] = []

    for _, q_list in sorted(by_type.items()):
        # Sort by id first so ordering is strictly reproducible across runs/platforms
        sorted_list = sorted(q_list, key=lambda x: x.id)
        rng.shuffle(sorted_list)

        dev_count = round(len(sorted_list) * dev_ratio)
        # Ensure at least 1 in dev if category has items
        if dev_count == 0 and len(sorted_list) > 1:
            dev_count = 1

        dev_questions.extend(sorted_list[:dev_count])
        frozen_questions.extend(sorted_list[dev_count:])

    # Sort each output set by id
    dev_questions.sort(key=lambda x: x.id)
    frozen_questions.sort(key=lambda x: x.id)

    dev_output.parent.mkdir(parents=True, exist_ok=True)
    frozen_output.parent.mkdir(parents=True, exist_ok=True)

    with open(dev_output, "w", encoding="utf-8") as f:
        for q in dev_questions:
            f.write(json.dumps(q.model_dump(), ensure_ascii=False) + "\n")

    with open(frozen_output, "w", encoding="utf-8") as f:
        for q in frozen_questions:
            f.write(json.dumps(q.model_dump(), ensure_ascii=False) + "\n")

    print(
        f"Split complete (seed={seed}, dev_ratio={dev_ratio:.2f}):\n"
        f"  Total: {len(valid_questions)}\n"
        f"  Dev: {len(dev_questions)} -> {dev_output}\n"
        f"  Frozen: {len(frozen_questions)} -> {frozen_output}"
    )


def main() -> None:
    """CLI entrypoint for question splitting."""
    parser = argparse.ArgumentParser(
        description="Stratified split of evaluation questions into dev and frozen"
    )
    parser.add_argument(
        "input_file",
        type=Path,
        help="Path to unpartitioned questions.jsonl",
    )
    parser.add_argument(
        "--dev-output",
        type=Path,
        default=Path("data/eval/dev/questions.jsonl"),
        help="Target path for dev questions.jsonl",
    )
    parser.add_argument(
        "--frozen-output",
        type=Path,
        default=Path("data/eval/frozen/questions.jsonl"),
        help="Target path for frozen questions.jsonl",
    )
    parser.add_argument(
        "--dev-ratio",
        type=float,
        default=0.30,
        help="Fraction for dev set (default: 0.30)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed (default: 42)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Allow overwriting frozen_output if it already exists",
    )
    args = parser.parse_args()

    try:
        split_questions(
            input_file=args.input_file,
            dev_output=args.dev_output,
            frozen_output=args.frozen_output,
            dev_ratio=args.dev_ratio,
            seed=args.seed,
            force=args.force,
        )
    except (ValueError, FileExistsError, OSError) as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
