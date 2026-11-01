"""Text extraction and OCR pipeline for Sri Lanka Motor Traffic legal documents.

Handles direct extraction for digital PDFs, OCR for scanned documents,
renders page images at 250 dpi, and logs extraction statistics per document.
"""

import argparse
import json
import re
from pathlib import Path
from typing import Any

import pymupdf
from rapidocr_onnxruntime import RapidOCR


def clean_html_to_text(html_content: str) -> str:
    """Basic extraction of plain text from HTML documents."""
    # Remove script and style elements
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html_content, flags=re.DOTALL)
    # Replace breaks and paragraphs with newlines
    text = re.sub(r"<(br|p|div|tr)[^>]*>", "\n", text, flags=re.IGNORECASE)
    # Remove all remaining tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Normalize excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_document(
    file_path: Path,
    interim_dir: Path,
    dpi: int = 250,
    save_images: bool = True,
    ocr_engine: RapidOCR | None = None,
) -> dict[str, Any]:
    """Extract text from a single source file into data/interim/<doc_id>/.

    Args:
        file_path: Path to source file in data/raw/.
        interim_dir: Base directory for interim output (e.g. data/interim/).
        dpi: Resolution for page image rendering (default 250 dpi).
        save_images: Whether to render and save page images.
        ocr_engine: Optional pre-initialized RapidOCR instance.

    Returns:
        Extraction log dictionary.
    """
    doc_id = file_path.stem
    doc_output_dir = interim_dir / doc_id
    doc_output_dir.mkdir(parents=True, exist_ok=True)
    pages_dir = doc_output_dir / "pages"
    if save_images:
        pages_dir.mkdir(parents=True, exist_ok=True)

    log_data: dict[str, Any] = {
        "doc_id": doc_id,
        "source_file": str(file_path.as_posix()),
        "file_type": file_path.suffix.lower(),
        "page_count": 0,
        "extraction_method": "unknown",
        "total_chars": 0,
        "pages": [],
    }

    suffix = file_path.suffix.lower()

    # 1. Handle Markdown procedural guides
    if suffix in [".md", ".markdown", ".txt"]:
        text = file_path.read_text(encoding="utf-8")
        log_data["page_count"] = 1
        log_data["extraction_method"] = "direct_text"
        log_data["total_chars"] = len(text)
        log_data["pages"].append(
            {
                "page_number": 1,
                "char_count": len(text),
                "method": "direct_text",
                "confidence": 1.0,
            }
        )
        (doc_output_dir / "text.txt").write_text(text, encoding="utf-8")

    # 2. Handle HTML statutory documents
    elif suffix in [".html", ".htm"]:
        raw_html = file_path.read_text(encoding="utf-8", errors="replace")
        text = clean_html_to_text(raw_html)
        log_data["page_count"] = 1
        log_data["extraction_method"] = "html_clean"
        log_data["total_chars"] = len(text)
        log_data["pages"].append(
            {
                "page_number": 1,
                "char_count": len(text),
                "method": "html_clean",
                "confidence": 1.0,
            }
        )
        (doc_output_dir / "text.txt").write_text(text, encoding="utf-8")

    # 3. Handle PDF documents
    elif suffix == ".pdf":
        doc = pymupdf.open(file_path)
        log_data["page_count"] = len(doc)
        full_text_pages: list[str] = []
        overall_methods: set[str] = set()

        for page_index in range(len(doc)):
            page_num = page_index + 1
            page = doc[page_index]
            page_img_path = pages_dir / f"page_{page_num:03d}.png"

            # Always render image at 250 dpi if save_images is enabled
            if save_images:
                pix = page.get_pixmap(dpi=dpi)
                pix.save(page_img_path)

            raw_page_text = page.get_text().strip()

            # If digital text is present
            if len(raw_page_text) >= 50:
                page_text = raw_page_text
                method = "direct_digital_text"
                confidence = 1.0
            else:
                # Scanned page - invoke RapidOCR
                method = "rapidocr"
                if ocr_engine is None:
                    ocr_engine = RapidOCR()

                # Ensure image exists for OCR
                if not page_img_path.exists():
                    pix = page.get_pixmap(dpi=dpi)
                    pix.save(page_img_path)

                ocr_result, _ = ocr_engine(str(page_img_path))
                if ocr_result:
                    lines = [item[1] for item in ocr_result]
                    scores = [float(item[2]) for item in ocr_result]
                    page_text = "\n".join(lines)
                    confidence = round(sum(scores) / max(1, len(scores)), 4)
                else:
                    page_text = ""
                    confidence = 0.0

            overall_methods.add(method)
            log_data["pages"].append(
                {
                    "page_number": page_num,
                    "char_count": len(page_text),
                    "method": method,
                    "confidence": confidence,
                    "image_path": str(page_img_path.as_posix())
                    if save_images
                    else None,
                }
            )
            full_text_pages.append(f"--- Page {page_num} ---\n{page_text}")

        doc.close()
        full_text = "\n\n".join(full_text_pages)
        log_data["total_chars"] = len(full_text)
        log_data["extraction_method"] = (
            "direct_digital_text"
            if overall_methods == {"direct_digital_text"}
            else "ocr"
            if overall_methods == {"rapidocr"}
            else "hybrid_digital_and_ocr"
        )
        (doc_output_dir / "text.txt").write_text(full_text, encoding="utf-8")

    # Write extraction log
    log_file = doc_output_dir / "extraction_log.json"
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(log_data, f, indent=2, ensure_ascii=False)

    return log_data


def process_all_raw_documents(
    raw_dir: Path = Path("data/raw"),
    interim_dir: Path = Path("data/interim"),
    dpi: int = 250,
    save_images: bool = True,
) -> list[dict[str, Any]]:
    """Process all valid raw files into data/interim/."""
    valid_suffixes = {".pdf", ".html", ".htm", ".md"}
    raw_files = [
        p
        for p in raw_dir.rglob("*")
        if p.is_file() and p.suffix.lower() in valid_suffixes and p.name != "SOURCES.md"
    ]
    raw_files.sort(key=lambda p: p.name)

    print(f"Found {len(raw_files)} documents to process in {raw_dir}...")
    ocr_engine = RapidOCR()
    results: list[dict[str, Any]] = []

    for i, file_path in enumerate(raw_files, start=1):
        print(f"[{i}/{len(raw_files)}] Extracting: {file_path.relative_to(raw_dir)}...")
        log = extract_document(
            file_path=file_path,
            interim_dir=interim_dir,
            dpi=dpi,
            save_images=save_images,
            ocr_engine=ocr_engine,
        )
        results.append(log)
        print(
            f"       Done: {log['page_count']} page(s), "
            f"{log['total_chars']} chars, method={log['extraction_method']}"
        )

    summary_file = interim_dir / "extraction_summary.json"
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\nAll extractions complete! Summary written to {summary_file}")
    return results


def main() -> None:
    """CLI entrypoint for document extraction."""
    parser = argparse.ArgumentParser(
        description="Extract text and render pages from raw legal documents"
    )
    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=Path("data/raw"),
        help="Input raw documents directory (default: data/raw)",
    )
    parser.add_argument(
        "--interim-dir",
        type=Path,
        default=Path("data/interim"),
        help="Target interim directory (default: data/interim)",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=250,
        help="Image rendering resolution in DPI (default: 250)",
    )
    parser.add_argument(
        "--no-images",
        action="store_true",
        help="Skip saving 250 dpi page images to save disk space during testing",
    )
    args = parser.parse_args()

    process_all_raw_documents(
        raw_dir=args.raw_dir,
        interim_dir=args.interim_dir,
        dpi=args.dpi,
        save_images=not args.no_images,
    )


if __name__ == "__main__":
    main()
