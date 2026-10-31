"""Tests for evaluation question schema, validation, and splitting."""

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from src.eval.schema import EvalQuestion
from src.eval.split import split_questions
from src.eval.validate import validate_questions_file


def test_eval_question_valid():
    """Verify that a compliant question record parses successfully."""
    data = {
        "id": "Q001",
        "question": "What is the legal speed limit inside built-up urban areas?",
        "type": "in_scope",
        "gold_sections": ["GAZ-1775-32-reg-2"],
        "expected_behavior": "answer_with_citation",
        "notes": "urban speed limit",
    }
    q = EvalQuestion.model_validate(data)
    assert q.id == "Q001"
    assert q.type == "in_scope"
    assert q.expected_behavior == "answer_with_citation"


def test_eval_question_invalid_type():
    """Verify that an illegal question type fails validation."""
    data = {
        "id": "Q002",
        "question": "Sample query?",
        "type": "invalid_category",
        "gold_sections": [],
        "expected_behavior": "answer_with_citation",
    }
    with pytest.raises(ValidationError):
        EvalQuestion.model_validate(data)


def test_validate_questions_file_with_errors(tmp_path: Path):
    """Verify that validate_questions_file catches line numbers and duplicates."""
    file_path = tmp_path / "questions.jsonl"
    lines = [
        json.dumps({
            "id": "Q001",
            "question": "Valid query one?",
            "type": "in_scope",
            "gold_sections": ["TODO"],
            "expected_behavior": "answer_with_citation",
        }),
        "invalid json line",
        json.dumps({
            "id": "Q001",  # duplicate ID
            "question": "Valid query duplicate?",
            "type": "in_scope",
            "gold_sections": ["TODO"],
            "expected_behavior": "answer_with_citation",
        }),
    ]
    file_path.write_text("\n".join(lines), encoding="utf-8")

    valid, errors = validate_questions_file(file_path)
    assert len(valid) == 1
    assert len(errors) == 2
    assert "Line 2" in errors[0]
    assert "Line 3" in errors[1] and "Duplicate question ID 'Q001'" in errors[1]


def test_split_questions_deterministic_and_stratified(tmp_path: Path):
    """Verify split is deterministic and preserves distribution across types."""
    input_file = tmp_path / "all_questions.jsonl"
    records = []
    # 10 in_scope, 5 edge, 5 out_of_scope = 20 total
    for i in range(10):
        records.append({
            "id": f"Q_IN_{i:02d}",
            "question": f"In-scope question number {i:02d}?",
            "type": "in_scope",
            "gold_sections": ["TODO"],
            "expected_behavior": "answer_with_citation",
        })
    for i in range(5):
        records.append({
            "id": f"Q_ED_{i:02d}",
            "question": f"Edge question number {i:02d}?",
            "type": "edge",
            "gold_sections": ["TODO"],
            "expected_behavior": "answer_with_citation",
        })
    for i in range(5):
        records.append({
            "id": f"Q_OUT_{i:02d}",
            "question": f"Out of scope question number {i:02d}?",
            "type": "out_of_scope",
            "gold_sections": [],
            "expected_behavior": "refuse",
        })

    input_file.write_text(
        "\n".join(json.dumps(r) for r in records), encoding="utf-8"
    )

    dev_out = tmp_path / "dev.jsonl"
    frozen_out = tmp_path / "frozen.jsonl"

    split_questions(
        input_file=input_file,
        dev_output=dev_out,
        frozen_output=frozen_out,
        dev_ratio=0.30,
        seed=42,
    )

    assert dev_out.exists()
    assert frozen_out.exists()

    dev_valid, dev_errs = validate_questions_file(dev_out)
    frozen_valid, frozen_errs = validate_questions_file(frozen_out)
    assert not dev_errs
    assert not frozen_errs

    # Total must equal 20
    assert len(dev_valid) + len(frozen_valid) == 20
    # Stratified: 10*0.3=3 in_scope, 5*0.3=1.5->2 edge, 5*0.3=1.5->2 out_of_scope -> total 7 in dev
    assert len(dev_valid) == 7
    assert len(frozen_valid) == 13

    # Protection against overwriting frozen
    with pytest.raises(FileExistsError):
        split_questions(
            input_file=input_file,
            dev_output=dev_out,
            frozen_output=frozen_out,
            dev_ratio=0.30,
            seed=42,
            force=False,
        )
