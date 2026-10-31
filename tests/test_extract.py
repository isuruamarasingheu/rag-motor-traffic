"""Unit tests for text extraction pipeline."""

from pathlib import Path

import pymupdf

from src.ingest.extract import clean_html_to_text, extract_document


def test_clean_html_to_text():
    """Verify HTML stripping removes tags and preserves legal text."""
    html = """
    <html>
      <head><title>Act</title><style>.test {color: red;}</style></head>
      <body>
        <h1>Motor Traffic Act</h1>
        <p>Section 1. This Act may be cited as the <b>Motor Traffic Act</b>.</p>
        <br/>
        <div>Section 2. Registration requirement.</div>
      </body>
    </html>
    """
    cleaned = clean_html_to_text(html)
    assert "Motor Traffic Act" in cleaned
    assert "Section 1. This Act may be cited" in cleaned
    assert "color: red;" not in cleaned
    assert "<p>" not in cleaned


def test_extract_markdown_document(tmp_path: Path):
    """Verify extraction from markdown source."""
    raw_dir = tmp_path / "raw"
    interim_dir = tmp_path / "interim"
    raw_dir.mkdir()
    md_file = raw_dir / "guide.md"
    md_file.write_text("# Test Guide\nContent here.", encoding="utf-8")

    log = extract_document(
        file_path=md_file,
        interim_dir=interim_dir,
        save_images=False,
    )

    doc_dir = interim_dir / "guide"
    assert (doc_dir / "text.txt").exists()
    assert (doc_dir / "extraction_log.json").exists()
    assert log["page_count"] == 1
    assert log["extraction_method"] == "direct_text"
    assert "Test Guide" in (doc_dir / "text.txt").read_text(encoding="utf-8")


def test_extract_pdf_digital_document(tmp_path: Path):
    """Verify extraction and 250 dpi image rendering on a digital PDF."""
    raw_dir = tmp_path / "raw"
    interim_dir = tmp_path / "interim"
    raw_dir.mkdir()
    pdf_path = raw_dir / "sample_statute.pdf"

    # Create a small synthetic PDF with text using PyMuPDF
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text(
        pymupdf.Point(50, 100),
        "Section 112. Power to prescribe speed limits.\n"
        "The Minister may by regulation prescribe maximum speeds.",
        fontsize=12,
    )
    doc.save(pdf_path)
    doc.close()

    log = extract_document(
        file_path=pdf_path,
        interim_dir=interim_dir,
        dpi=100,  # use lower dpi for quick test
        save_images=True,
    )

    doc_dir = interim_dir / "sample_statute"
    assert (doc_dir / "text.txt").exists()
    assert (doc_dir / "extraction_log.json").exists()
    assert (doc_dir / "pages" / "page_001.png").exists()
    assert log["page_count"] == 1
    assert log["extraction_method"] == "direct_digital_text"
    extracted_text = (doc_dir / "text.txt").read_text(encoding="utf-8")
    assert "Section 112" in extracted_text
