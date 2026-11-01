"""Validation utility for evaluation questions JSONL files."""

import argparse
import json
import sys
from pathlib import Path

from pydantic import ValidationError

from src.eval.schema import EvalQuestion


def validate_questions_file(file_path: Path) -> tuple[list[EvalQuestion], list[str]]:
    """Validate a JSONL questions file.

    Returns:
        Tuple of (list_of_valid_questions, list_of_error_strings)
    """
    if not file_path.exists():
        return [], [f"File not found: {file_path}"]

    valid_questions: list[EvalQuestion] = []
    errors: list[str] = []
    seen_ids: set[str] = set()

    with open(file_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, start=1):
            line_str = line.strip()
            if not line_str:
                continue

            try:
                data = json.loads(line_str)
            except json.JSONDecodeError as e:
                errors.append(f"Line {line_num}: Invalid JSON - {e}")
                continue

            try:
                q = EvalQuestion.model_validate(data)
                if q.id in seen_ids:
                    errors.append(
                        f"Line {line_num}: Duplicate question ID '{q.id}' already seen"
                    )
                else:
                    seen_ids.add(q.id)
                    valid_questions.append(q)
            except ValidationError as ve:
                for err in ve.errors():
                    field = ".".join(str(loc) for loc in err["loc"])
                    errors.append(f"Line {line_num} (field '{field}'): {err['msg']}")

    return valid_questions, errors


def main() -> None:
    """CLI entrypoint for validating questions."""
    parser = argparse.ArgumentParser(
        description="Validate evaluation questions JSONL file against schema"
    )
    parser.add_argument(
        "file_path",
        type=Path,
        help="Path to questions.jsonl to validate",
    )
    args = parser.parse_args()

    valid, errors = validate_questions_file(args.file_path)
    if errors:
        print(f"Validation failed with {len(errors)} error(s):", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        sys.exit(1)

    print(f"Validation successful! {len(valid)} valid questions in {args.file_path}.")


if __name__ == "__main__":
    main()
