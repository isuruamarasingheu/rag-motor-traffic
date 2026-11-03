"""Unit tests for peer rating sheet generator and agreement analyzer conforming to Phase 10.3."""

from __future__ import annotations

import csv
from pathlib import Path

from src.eval.generate_peer_sheet import create_blind_peer_sheet
from src.eval.peer_agreement import compute_peer_agreement, interpret_kappa


def test_interpret_kappa() -> None:
    assert "Almost Perfect" in interpret_kappa(0.92)
    assert "Substantial" in interpret_kappa(0.75)
    assert "Moderate" in interpret_kappa(0.55)
    assert "Fair" in interpret_kappa(0.35)
    assert "Slight" in interpret_kappa(0.15)
    assert "Poor" in interpret_kappa(-0.1)


def test_create_blind_peer_sheet(tmp_path: Path) -> None:
    primary_csv = tmp_path / "primary.csv"
    blank_csv = tmp_path / "blind_peer.csv"

    rows = [
        {
            "query_id": "Q001",
            "question": "What is the speed limit?",
            "type": "in_scope",
            "expected_behavior": "answer_with_citation",
            "pipeline_status": "answered",
            "system_answer": "50 km/h",
            "citations": "MTA-s140",
            "retrieved_passages": "Speed text",
            "human_faithfulness_score": "2",
            "invented_number": "FALSE",
            "citation_accuracy": "EXACT",
            "refusal_correctness": "CORRECT",
            "annotator_notes": "Rater 1 note",
        },
        {
            "query_id": "Q002",
            "question": "Land registry?",
            "type": "out_of_scope",
            "expected_behavior": "refuse",
            "pipeline_status": "refused_out_of_scope",
            "system_answer": "Refusal text",
            "citations": "",
            "retrieved_passages": "None",
            "human_faithfulness_score": "2",
            "invented_number": "FALSE",
            "citation_accuracy": "NA",
            "refusal_correctness": "CORRECT",
            "annotator_notes": "Refused cleanly",
        },
    ]

    with open(primary_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    out_path = create_blind_peer_sheet(
        primary_sheet_path=primary_csv,
        output_blank_csv=blank_csv,
        sample_size=2,
    )

    assert out_path.exists()
    with open(out_path, encoding="utf-8") as f:
        blind_rows = list(csv.DictReader(f))
        assert len(blind_rows) == 2
        for br in blind_rows:
            # Verify primary scores were stripped to preserve blinding
            assert br["peer_faithfulness_score"] == ""
            assert br["peer_invented_number"] == ""
            assert br["peer_citation_accuracy"] == ""
            assert br["peer_notes"] == ""
            assert "human_faithfulness_score" not in br


def test_compute_peer_agreement(tmp_path: Path) -> None:
    p_csv = tmp_path / "primary.csv"
    s_csv = tmp_path / "peer.csv"
    out_md = tmp_path / "agreement.md"
    out_csv = tmp_path / "agreement.csv"

    p_data = [
        {"query_id": "Q1", "question": "Q1 text", "pipeline_status": "answered", "human_faithfulness_score": "2", "invented_number": "FALSE", "annotator_notes": "ok"},
        {"query_id": "Q2", "question": "Q2 text", "pipeline_status": "answered", "human_faithfulness_score": "1", "invented_number": "FALSE", "annotator_notes": "partial"},
        {"query_id": "Q3", "question": "Q3 text", "pipeline_status": "answered", "human_faithfulness_score": "0", "invented_number": "TRUE", "annotator_notes": "bad"},
    ]
    s_data = [
        {"query_id": "Q1", "question": "Q1 text", "peer_faithfulness_score": "2", "peer_invented_number": "FALSE", "peer_notes": "agree"},
        {"query_id": "Q2", "question": "Q2 text", "peer_faithfulness_score": "1", "peer_invented_number": "FALSE", "peer_notes": "agree"},
        {"query_id": "Q3", "question": "Q3 text", "peer_faithfulness_score": "0", "peer_invented_number": "TRUE", "peer_notes": "agree"},
    ]

    with open(p_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(p_data[0].keys()))
        w.writeheader()
        w.writerows(p_data)

    with open(s_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(s_data[0].keys()))
        w.writeheader()
        w.writerows(s_data)

    metrics = compute_peer_agreement(
        primary_sheet_path=p_csv,
        peer_sheet_path=s_csv,
        output_md_path=out_md,
        output_csv_path=out_csv,
    )

    assert metrics["sample_size"] == 3
    assert metrics["exact_agreement"] == 1.0
    assert metrics["quadratic_kappa"] == 1.0
    assert "Almost Perfect" in metrics["interpretation"]
    assert out_md.exists()
    assert out_csv.exists()

