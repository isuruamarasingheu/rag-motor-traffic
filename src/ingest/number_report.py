"""Number extraction and verification report generator for legal text.

Implements the ocr-number-check skill: finds and flags every number, unit,
date, fine amount, and section reference in OCR-extracted text so a human
can verify them against the original scan.
"""

import argparse
import csv
import json
import re
from pathlib import Path
from typing import Any

# Regex patterns for numeric/statutory entities
PATTERNS = {
    "currency": re.compile(
        r"(?:Rs\.?|Rupees|LKR)\s*[\d,]+(?:\.\d{2}|/-)?|[\d,]+/-",
        re.IGNORECASE,
    ),
    "noise_limit": re.compile(
        r"\b\d+(?:\.\d+)?\s*(?:dB\(A\)|dB|dBA)\b",
        re.IGNORECASE,
    ),
    "speed_limit": re.compile(
        r"\b\d+\s*(?:km/h|kmph|miles\s+per\s+hour|m\.p\.h\.)\b",
        re.IGNORECASE,
    ),
    "unit_measure": re.compile(
        r"\b\d+(?:\.\d+)?\s*(?:kg|tonnes?|tons?|metres?|meters?|mm|cm|inches|feet|ft|kW|cc)\b",
        re.IGNORECASE,
    ),
    "date": re.compile(
        r"\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s*,?\s*\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4})\b",
        re.IGNORECASE,
    ),
    "section_ref": re.compile(
        r"\b(?:Section|section|Sec\.|s\.)\s*\d+[A-Z]?(?:\s*\(\d+\)(?:\s*\([a-z]\))*)?\b",
        re.IGNORECASE,
    ),
    "gazette_no": re.compile(
        r"\b(?:Gazette\s+(?:Extraordinary\s+)?No\.?|No\.)\s*\d+/\d+\b",
        re.IGNORECASE,
    ),
    "time_period": re.compile(
        r"\b\d+\s*(?:days?|months?|years?|hours?|calendar\s+days?|weeks?)\b",
        re.IGNORECASE,
    ),
    "generic_number": re.compile(
        r"\b\d+(?:,\d{3})*(?:\.\d+)?\b",
    ),
}

# Confusable character substitutions often produced by OCR
CONFUSABLES = [
    (r"\bO\d+", "Letter 'O' before digit (possible 0)"),
    (r"\d+O\b", "Letter 'O' after digit (possible 0)"),
    (r"\bl\d+", "Lowercase 'l' before digit (possible 1)"),
    (r"\d+l\b", "Lowercase 'l' after digit (possible 1)"),
    (r"\bI\d+", "Uppercase 'I' before digit (possible 1)"),
    (r"\d+I\b", "Uppercase 'I' after digit (possible 1)"),
    (r"\bS\d+", "Letter 'S' before digit (possible 5)"),
    (r"\d+S\b", "Letter 'S' after digit (possible 5)"),
    (r"\bZ\d+", "Letter 'Z' before digit (possible 2)"),
    (r"\d+Z\b", "Letter 'Z' after digit (possible 2)"),
    (r"\bB\d+", "Letter 'B' before digit (possible 8)"),
    (r"\d+B\b", "Letter 'B' after digit (possible 8)"),
]


def extract_context(text: str, match_start: int, match_end: int, window: int = 40) -> str:
    """Extract snippet context around a match."""
    start = max(0, match_start - window)
    end = min(len(text), match_end + window)
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(text) else ""
    snippet = text[start:end].replace("\n", " ").strip()
    return f"{prefix}{snippet}{suffix}"


def find_suspicion_flags(
    item_type: str,
    ocr_value: str,
    context: str,
    confidence: float,
) -> list[str]:
    """Detect potential OCR corruption or anomalies."""
    flags: list[str] = []

    # 1. OCR Confidence check
    if confidence < 0.85:
        flags.append(f"LOW_CONFIDENCE ({confidence:.2f})")

    # 2. Confusable character checks in surrounding context
    for pattern, reason in CONFUSABLES:
        if re.search(pattern, context):
            flags.append(f"CONFUSABLE_CHAR: {reason}")
            break

    # 3. Domain plausible range checks
    val_clean = re.sub(r"[^\d.]", "", ocr_value)
    if val_clean:
        try:
            num = float(val_clean)
            if item_type == "noise_limit" and (num < 50 or num > 130):
                flags.append(f"UNUSUAL_RANGE: Noise limit {num} dB outside [50, 130]")
            elif item_type == "speed_limit" and (num < 10 or num > 140):
                flags.append(f"UNUSUAL_RANGE: Speed limit {num} outside [10, 140]")
            elif item_type == "time_period" and "day" in ocr_value.lower() and num > 365:
                flags.append(f"UNUSUAL_RANGE: Time period {num} days > 365")
            elif item_type == "currency" and num < 10:
                flags.append(f"UNUSUAL_RANGE: Fine {num} unusually low")
        except ValueError:
            pass

    return flags


def analyze_document_text(
    doc_id: str,
    doc_dir: Path,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Scan document pages and extract all numbers with suspicion flags."""
    text_file = doc_dir / "text.txt"
    log_file = doc_dir / "extraction_log.json"

    if not text_file.exists():
        raise FileNotFoundError(f"Missing text.txt in {doc_dir}")

    full_text = text_file.read_text(encoding="utf-8")
    confidences: dict[int, float] = {}

    if log_file.exists():
        try:
            log_data = json.loads(log_file.read_text(encoding="utf-8"))
            for p_info in log_data.get("pages", []):
                p_num = p_info.get("page_number", 1)
                confidences[p_num] = float(p_info.get("confidence", 1.0))
        except (json.JSONDecodeError, OSError, KeyError, ValueError):
            confidences = {}

    # Split text by page headers
    page_chunks = re.split(r"--- Page (\d+) ---", full_text)
    items: list[dict[str, Any]] = []

    if len(page_chunks) > 1:
        # Alternates between [preamble, page_num_1, page_text_1, page_num_2, ...]
        for i in range(1, len(page_chunks), 2):
            page_num = int(page_chunks[i])
            page_text = page_chunks[i + 1]
            page_conf = confidences.get(page_num, 1.0)
            items.extend(scan_page_text(doc_id, page_num, page_text, page_conf, doc_dir))
    else:
        # No page headers, treat as page 1
        items.extend(scan_page_text(doc_id, 1, full_text, confidences.get(1, 1.0), doc_dir))

    stats = {
        "doc_id": doc_id,
        "total_numbers": len(items),
        "flagged_numbers": sum(1 for it in items if it["suspicion_flags"]),
        "currency_count": sum(1 for it in items if it["item_type"] == "currency"),
        "section_refs_count": sum(1 for it in items if it["item_type"] == "section_ref"),
        "speed_noise_count": sum(
            1 for it in items if it["item_type"] in ["noise_limit", "speed_limit"]
        ),
    }

    return items, stats


def scan_page_text(
    doc_id: str,
    page_num: int,
    text: str,
    confidence: float,
    doc_dir: Path,
) -> list[dict[str, Any]]:
    """Scan a single page text for numeric entities."""
    page_items: list[dict[str, Any]] = []
    seen_spans: set[tuple[int, int]] = set()
    page_img = doc_dir / "pages" / f"page_{page_num:03d}.png"
    img_ref = str(page_img.as_posix()) if page_img.exists() else None

    # Priority order: specific units and compound values first, generic numbers last
    ordered_types = [
        "currency",
        "noise_limit",
        "speed_limit",
        "unit_measure",
        "date",
        "section_ref",
        "gazette_no",
        "time_period",
        "generic_number",
    ]

    for item_type in ordered_types:
        pattern = PATTERNS[item_type]
        for match in pattern.finditer(text):
            span = match.span()
            # Avoid overlapping with already captured compound matches
            if any(s[0] <= span[0] and span[1] <= s[1] for s in seen_spans):
                continue

            seen_spans.add(span)
            ocr_val = match.group(0).strip()
            context = extract_context(text, span[0], span[1])
            flags = find_suspicion_flags(item_type, ocr_val, context, confidence)

            page_items.append({
                "doc_id": doc_id,
                "page": page_num,
                "item_type": item_type,
                "ocr_value": ocr_val,
                "context_snippet": context,
                "confidence": confidence,
                "suspicion_flags": "; ".join(flags),
                "image_ref": img_ref,
                "human_status": "unverified",
            })

    # Sort items by occurrence in text
    return page_items


def write_number_reports(
    doc_dir: Path,
    items: list[dict[str, Any]],
    stats: dict[str, Any],
) -> tuple[Path, Path]:
    """Write number_report.csv and number_report.md."""
    csv_path = doc_dir / "number_report.csv"
    md_path = doc_dir / "number_report.md"

    # 1. Write CSV
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "doc_id",
            "page",
            "item_type",
            "ocr_value",
            "context_snippet",
            "confidence",
            "suspicion_flags",
            "image_ref",
            "human_status",
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in items:
            writer.writerow(row)

    # 2. Write Markdown grouped by page
    lines = [
        f"# OCR Number Verification Report: {stats['doc_id']}",
        "",
        "## Summary",
        f"- **Total Numbers / Citations Found:** {stats['total_numbers']}",
        f"- **Flagged as Suspicious:** {stats['flagged_numbers']}",
        f"- **Currency / Fines Found:** {stats['currency_count']}",
        f"- **Speed / Noise Limits Found:** {stats['speed_noise_count']}",
        f"- **Section References Found:** {stats['section_refs_count']}",
        "",
        "> [!IMPORTANT]",
        "> Review flagged items below against the original page image.",
        "> Do not invent numbers from memory. Mark verified numbers as verified.",
        "",
        "---",
        "",
    ]

    # Group by page
    by_page: dict[int, list[dict[str, Any]]] = {}
    for it in items:
        by_page.setdefault(it["page"], []).append(it)

    for page_num in sorted(by_page.keys()):
        p_items = by_page[page_num]
        lines.append(f"## Page {page_num}")
        img = p_items[0]["image_ref"]
        if img:
            lines.append(f"*Original Scan Image:* `{img}`")
        lines.append("")
        lines.append("| Type | Value | Context Snippet | Flags | Status |")
        lines.append("|---|---|---|---|---|")

        for it in p_items:
            flag_text = f"⚠️ **{it['suspicion_flags']}**" if it["suspicion_flags"] else "OK"
            clean_snippet = it["context_snippet"].replace("|", "\\|")
            lines.append(
                f"| `{it['item_type']}` | **{it['ocr_value']}** | {clean_snippet} | {flag_text} | `[ ] unverified` |"
            )
        lines.append("")

    md_path.write_text("\n".join(lines), encoding="utf-8")
    return csv_path, md_path


def process_document_number_report(doc_dir: Path) -> dict[str, Any]:
    """Generate number verification report for a single document directory."""
    doc_id = doc_dir.name
    items, stats = analyze_document_text(doc_id, doc_dir)
    write_number_reports(doc_dir, items, stats)
    return stats


def process_all_interim_documents(interim_dir: Path = Path("data/interim")) -> list[dict[str, Any]]:
    """Generate number reports for all processed documents in data/interim/."""
    doc_dirs = [d for d in interim_dir.iterdir() if d.is_dir() and (d / "text.txt").exists()]
    doc_dirs.sort(key=lambda d: d.name)

    all_stats: list[dict[str, Any]] = []
    print(f"Generating number reports for {len(doc_dirs)} documents in {interim_dir}...")

    for d in doc_dirs:
        stats = process_document_number_report(d)
        all_stats.append(stats)
        print(
            f"  - {stats['doc_id']}: {stats['total_numbers']} numbers/citations "
            f"({stats['flagged_numbers']} flagged)"
        )

    # Master index report
    master_md = interim_dir / "NUMBER_VERIFICATION_INDEX.md"
    lines = [
        "# Corpus Number Verification Index",
        "",
        "| Document ID | Total Numbers | Flagged Suspicious | Fines / Currency | Speed / Noise | Section Refs | Report Path |",
        "|---|---|---|---|---|---|---|",
    ]
    for s in all_stats:
        lines.append(
            f"| `{s['doc_id']}` | {s['total_numbers']} | {s['flagged_numbers']} | "
            f"{s['currency_count']} | {s['speed_noise_count']} | {s['section_refs_count']} | "
            f"[`number_report.md`]({s['doc_id']}/number_report.md) |"
        )
    master_md.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nMaster verification index written to {master_md}")
    return all_stats


def main() -> None:
    """CLI entrypoint for number extraction reports."""
    parser = argparse.ArgumentParser(
        description="Extract and flag numbers from interim text for human verification"
    )
    parser.add_argument(
        "--interim-dir",
        type=Path,
        default=Path("data/interim"),
        help="Path to data/interim directory (default: data/interim)",
    )
    parser.add_argument(
        "--doc-id",
        type=str,
        default=None,
        help="Specific doc_id directory to process",
    )
    args = parser.parse_args()

    if args.doc_id:
        doc_dir = args.interim_dir / args.doc_id
        stats = process_document_number_report(doc_dir)
        print(f"Generated number report for {args.doc_id}: {stats}")
    else:
        process_all_interim_documents(args.interim_dir)


if __name__ == "__main__":
    main()
