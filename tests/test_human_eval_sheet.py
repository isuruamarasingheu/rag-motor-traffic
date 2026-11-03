"""Tests for human scoring sheet generator tool conforming to Phase 10.1."""

from __future__ import annotations

import csv
from pathlib import Path
from unittest.mock import MagicMock

from src.eval.generate_human_sheet import (
    format_retrieved_passages,
    generate_scoring_sheet,
    load_questions,
    sample_questions_stratified,
)


def test_load_questions(tmp_path: Path) -> None:
    test_jsonl = tmp_path / "questions.jsonl"
    test_jsonl.write_text(
        '{"id": "Q001", "question": "Speed limit?", "type": "in_scope"}\n'
        '{"id": "Q002", "question": "Land registry?", "type": "out_of_scope"}\n',
        encoding="utf-8",
    )
    qs = load_questions(test_jsonl)
    assert len(qs) == 2
    assert qs[0]["id"] == "Q001"
    assert qs[1]["type"] == "out_of_scope"


def test_sample_questions_stratified() -> None:
    questions = [
        {"id": f"IN_{i}", "type": "in_scope"} for i in range(10)
    ] + [
        {"id": f"OUT_{i}", "type": "out_of_scope"} for i in range(5)
    ] + [
        {"id": f"EDGE_{i}", "type": "edge"} for i in range(5)
    ]
    sampled = sample_questions_stratified(questions, sample_size=8, seed=42)
    assert len(sampled) == 8
    types = {q["type"] for q in sampled}
    assert "in_scope" in types
    assert len(types) >= 2


def test_format_retrieved_passages() -> None:
    hits = [
        {"id": "MTA-s140", "citation": "MTA Section 140", "text": "Speed limit text", "score": 0.85},
        {"id": "GAZ-1738", "citation": "Gazette 1738", "text": "Noise limit text", "score": 0.72},
    ]
    formatted = format_retrieved_passages(hits)
    assert "MTA Section 140" in formatted
    assert "Gazette 1738" in formatted
    assert "0.850" in formatted


def test_generate_scoring_sheet(tmp_path: Path, monkeypatch) -> None:
    q_file = tmp_path / "questions.jsonl"
    q_file.write_text(
        '{"id": "Q001", "question": "What is the speed limit?", "type": "in_scope", "expected_behavior": "answer_with_citation", "gold_sections": ["MTA-s140"]}\n',
        encoding="utf-8",
    )
    out_csv = tmp_path / "scoring_sheet.csv"

    mock_graph = MagicMock()
    mock_graph.invoke.return_value = {
        "status": "answered",
        "answer": "The speed limit is 50 km/h.",
        "citations": [{"id": "MTA-s140", "citation": "MTA Section 140"}],
        "retrieved_hits": [{"id": "MTA-s140", "citation": "MTA Section 140", "text": "Speed limit is 50 km/h", "score": 0.9}],
    }

    monkeypatch.setattr("src.eval.generate_human_sheet.build_legal_rag_graph", lambda: mock_graph)

    generated_path = generate_scoring_sheet(
        questions_path=q_file,
        output_csv_path=out_csv,
        sample_size=1,
    )

    assert generated_path.exists()
    with open(generated_path, encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        assert len(reader) == 1
        row = reader[0]
        assert row["query_id"] == "Q001"
        assert row["pipeline_status"] == "answered"
        assert "50 km/h" in row["system_answer"]
        assert "MTA Section 140" in row["citations"]
        assert "human_faithfulness_score" in row
        assert "invented_number" in row
        assert "citation_accuracy" in row

