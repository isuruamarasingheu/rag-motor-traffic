"""Unit tests for number extraction and suspicion flagging."""

import json
from pathlib import Path

from src.ingest.number_report import (
    analyze_document_text,
    find_suspicion_flags,
    write_number_reports,
)


def test_find_suspicion_flags_confusables():
    """Verify that confusable characters nearby numbers are flagged."""
    flags_o = find_suspicion_flags(
        item_type="generic_number",
        ocr_value="100",
        context="fine amount is O100 rupees",
        confidence=0.95,
    )
    assert any("CONFUSABLE_CHAR" in f for f in flags_o)

    flags_l = find_suspicion_flags(
        item_type="generic_number",
        ocr_value="50",
        context="speed limit is l50 km/h",
        confidence=0.95,
    )
    assert any("CONFUSABLE_CHAR" in f for f in flags_l)


def test_find_suspicion_flags_unusual_range():
    """Verify that values outside domain limits are flagged."""
    flags_db = find_suspicion_flags(
        item_type="noise_limit",
        ocr_value="250 dB(A)",
        context="noise level shall not exceed 250 dB(A)",
        confidence=0.95,
    )
    assert any("UNUSUAL_RANGE" in f for f in flags_db)

    flags_speed = find_suspicion_flags(
        item_type="speed_limit",
        ocr_value="350 km/h",
        context="maximum speed is 350 km/h",
        confidence=0.95,
    )
    assert any("UNUSUAL_RANGE" in f for f in flags_speed)


def test_analyze_and_write_number_reports(tmp_path: Path):
    """Verify end-to-end number scanning and report generation."""
    doc_dir = tmp_path / "test_doc"
    doc_dir.mkdir()
    pages_dir = doc_dir / "pages"
    pages_dir.mkdir()

    sample_text = """--- Page 1 ---
Section 112. The fine shall be Rs. 5,000/- for speeding over 70 km/h.
The decibel level must be below 85 dB(A).

--- Page 2 ---
Under Gazette No. 2054/09, spot fines apply within 14 days.
Date of gazette: 15 January 2018.
"""
    (doc_dir / "text.txt").write_text(sample_text, encoding="utf-8")
    (doc_dir / "extraction_log.json").write_text(
        json.dumps(
            {
                "pages": [
                    {"page_number": 1, "confidence": 0.98},
                    {"page_number": 2, "confidence": 0.98},
                ]
            }
        ),
        encoding="utf-8",
    )

    items, stats = analyze_document_text("test_doc", doc_dir)
    assert stats["total_numbers"] >= 6
    assert stats["currency_count"] >= 1
    assert stats["section_refs_count"] >= 1

    csv_path, md_path = write_number_reports(doc_dir, items, stats)
    assert csv_path.exists()
    assert md_path.exists()

    md_content = md_path.read_text(encoding="utf-8")
    assert "Rs. 5,000/-" in md_content
    assert "70 km/h" in md_content
    assert "85 dB(A)" in md_content
    assert "15 January 2018" in md_content
