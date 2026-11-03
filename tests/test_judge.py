"""Unit tests for FaithfulnessJudge and evaluation runner conforming to Phase 10.2."""

from __future__ import annotations

import csv
from pathlib import Path
from unittest.mock import MagicMock

from src.eval.judge import FaithfulnessJudge
from src.eval.run_judge import compute_cohen_kappa, evaluate_scoring_sheet


def test_parse_judge_response_clean_json() -> None:
    raw = '{"faithfulness_score": 2, "invented_number": false, "citation_accuracy": "EXACT", "unsupported_claims": [], "reasoning": "Fully grounded."}'
    parsed = FaithfulnessJudge._parse_judge_response(raw)
    assert parsed["faithfulness_score"] == 2
    assert parsed["invented_number"] is False
    assert parsed["citation_accuracy"] == "EXACT"
    assert parsed["unsupported_claims"] == []


def test_parse_judge_response_markdown_fenced() -> None:
    raw = """```json
    {
      "faithfulness_score": 1,
      "invented_number": false,
      "citation_accuracy": "PARENT",
      "unsupported_claims": ["Minor lay wording"],
      "reasoning": "Parent section cited."
    }
    ```"""
    parsed = FaithfulnessJudge._parse_judge_response(raw)
    assert parsed["faithfulness_score"] == 1
    assert parsed["citation_accuracy"] == "PARENT"
    assert "Minor lay wording" in parsed["unsupported_claims"]


def test_invented_number_zero_tolerance_enforced() -> None:
    judge = FaithfulnessJudge(model="test-model", cache_path="tmp_test_cache.json")
    # Simulate LLM returning score 2 but invented_number=True
    judge._call_llm = MagicMock(return_value='{"faithfulness_score": 2, "invented_number": true, "citation_accuracy": "WRONG", "unsupported_claims": ["Rs 50000"], "reasoning": "Invented fine"}')

    res = judge.evaluate(
        question="What is the fine?",
        retrieved_passages="Text with no fine amount mentioned",
        answer="The fine is Rs 50,000.",
    )

    assert res["invented_number"] is True
    assert res["faithfulness_score"] == 0  # Zero tolerance enforced!


def test_judge_caching(tmp_path: Path) -> None:
    cache_file = tmp_path / "cache.json"
    judge = FaithfulnessJudge(model="test-model", cache_path=cache_file)
    mock_llm = MagicMock(return_value='{"faithfulness_score": 2, "invented_number": false, "citation_accuracy": "EXACT", "unsupported_claims": [], "reasoning": "Grounded"}')
    judge._call_llm = mock_llm

    # Call 1
    res1 = judge.evaluate("Q1", "Retrieved", "Ans1")
    assert mock_llm.call_count == 1
    assert res1["faithfulness_score"] == 2

    # Call 2 with identical inputs -> must hit cache
    res2 = judge.evaluate("Q1", "Retrieved", "Ans1")
    assert mock_llm.call_count == 1  # No additional API call!
    assert res2 == res1


def test_compute_cohen_kappa() -> None:
    # Perfect agreement
    r1 = [2, 2, 1, 0, 2]
    r2 = [2, 2, 1, 0, 2]
    assert compute_cohen_kappa(r1, r2, categories=[0, 1, 2]) == 1.0

    # Slight disagreement
    r3 = [2, 2, 1, 0, 1]
    kappa = compute_cohen_kappa(r1, r3, categories=[0, 1, 2], weights="quadratic")
    assert 0.5 < kappa < 1.0


def test_evaluate_scoring_sheet_pipeline(tmp_path: Path, monkeypatch) -> None:
    in_csv = tmp_path / "human_sheet.csv"
    out_csv = tmp_path / "judge_sheet.csv"
    out_md = tmp_path / "judge_report.md"

    rows = [
        {
            "query_id": "Q001",
            "question": "What is the noise limit?",
            "type": "in_scope",
            "expected_behavior": "answer_with_citation",
            "gold_sections": "GAZ-1738",
            "pipeline_status": "answered",
            "system_answer": "Limit is 98 dB.",
            "citations": "Gazette 1738",
            "retrieved_passages": "Maximum noise is 98 dB.",
            "human_faithfulness_score": "2",
            "invented_number": "FALSE",
            "citation_accuracy": "EXACT",
            "refusal_correctness": "CORRECT",
            "annotator_notes": "",
        }
    ]

    with open(in_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    mock_judge = MagicMock()
    mock_judge.evaluate.return_value = {
        "faithfulness_score": 2,
        "invented_number": False,
        "citation_accuracy": "EXACT",
        "unsupported_claims": [],
        "reasoning": "Fully entailed.",
    }

    monkeypatch.setattr("src.eval.run_judge.FaithfulnessJudge", lambda **kwargs: mock_judge)

    summary = evaluate_scoring_sheet(
        input_csv=in_csv,
        output_csv=out_csv,
        output_md=out_md,
        judge_model="gpt-4o",
    )

    assert summary["total"] == 1
    assert summary["exact_agreement"] == 1.0
    assert out_csv.exists()
    assert out_md.exists()

    md_content = out_md.read_text(encoding="utf-8")
    assert "Automated LLM-as-a-Judge Faithfulness Benchmark Report" in md_content
    assert "Exact Agreement Rate" in md_content

