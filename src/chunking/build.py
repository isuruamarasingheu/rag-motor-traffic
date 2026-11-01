"""Corpus build script converting interim text to structured section units.

Outputs validated SectionRecord lines into data/processed/sections.jsonl.
"""

import argparse
import json
import random
from pathlib import Path
from typing import Any

from src.chunking.parser import (
    parse_consolidated_act,
    parse_gazette,
    parse_procedural_guide,
)
from src.chunking.schema import SectionRecord


def build_corpus(
    interim_dir: Path = Path("data/interim"),
    processed_dir: Path = Path("data/processed"),
    output_filename: str = "sections.jsonl",
) -> list[SectionRecord]:
    """Parse all verified interim text files and write data/processed/sections.jsonl."""
    processed_dir.mkdir(parents=True, exist_ok=True)
    output_file = processed_dir / output_filename

    all_records: list[SectionRecord] = []
    seen_ids: set[str] = set()

    # 1. Parse Consolidated Motor Traffic Act
    mta_dir = interim_dir / "Motor-Traffic-Consolidated-2024"
    if (mta_dir / "text.txt").exists():
        print(f"Parsing Consolidated Motor Traffic Act from {mta_dir}...")
        mta_text = (mta_dir / "text.txt").read_text(encoding="utf-8")
        mta_records = parse_consolidated_act(mta_text)
        print(f"  -> Generated {len(mta_records)} section units from Consolidated Act.")
        all_records.extend(mta_records)

    # 2. Parse Gazettes
    gazette_dirs = sorted([d for d in interim_dir.glob("Gazette_*") if d.is_dir()])
    print(f"\nParsing {len(gazette_dirs)} subsidiary gazette regulations...")
    for g_dir in gazette_dirs:
        text_file = g_dir / "text.txt"
        if not text_file.exists():
            continue
        g_text = text_file.read_text(encoding="utf-8")
        source_rel = f"data/raw/gazettes/{g_dir.name}.pdf"
        g_records = parse_gazette(g_dir.name, g_text, source_rel)
        all_records.extend(g_records)
        print(f"  - {g_dir.name}: {len(g_records)} units")

    # 3. Parse Procedural Guides
    proc_files = [
        ("DMT_Registration_and_Transfer_Procedures", "data/raw/procedural_guides/DMT_Registration_and_Transfer_Procedures.md"),
        ("Police_Spot_Fine_Payment_and_Appeal_Guide", "data/raw/procedural_guides/Police_Spot_Fine_Payment_and_Appeal_Guide.md"),
        ("DMT_Circular_2022-14_Foreign_License", "data/raw/procedural_guides/DMT_Circular_2022-14_Foreign_License.pdf"),
    ]
    print(f"\nParsing {len(proc_files)} procedural guides...")
    for doc_name, source_rel in proc_files:
        proc_dir = interim_dir / doc_name
        text_file = proc_dir / "text.txt"
        if not text_file.exists():
            continue
        p_text = text_file.read_text(encoding="utf-8")
        p_records = parse_procedural_guide(doc_name, p_text, source_rel)
        all_records.extend(p_records)
        print(f"  - {doc_name}: {len(p_records)} units")

    # 4. Validation & Deduplication
    valid_records: list[SectionRecord] = []
    for rec in all_records:
        rec_id = rec.id
        if rec_id in seen_ids:
            # Suffix with disambiguation
            dup_count = sum(1 for x in seen_ids if x.startswith(rec_id))
            rec_id = f"{rec_id}-d{dup_count + 1}"
            rec.id = rec_id

        seen_ids.add(rec_id)
        assert len(rec.text) >= 10, f"Empty text in record {rec.id}"
        assert rec.citation, f"Missing citation in record {rec.id}"
        assert rec.source_file, f"Missing source_file in record {rec.id}"
        valid_records.append(rec)

    # 5. Write JSONL file
    with open(output_file, "w", encoding="utf-8") as f:
        for rec in valid_records:
            f.write(json.dumps(rec.model_dump(), ensure_ascii=False) + "\n")

    print(f"\nCorpus build complete! Total units: {len(valid_records)} -> {output_file}")
    report_corpus_statistics(valid_records)
    return valid_records


def report_corpus_statistics(records: list[SectionRecord]) -> dict[str, Any]:
    """Generate and display structural audit statistics per statute-chunking skill."""
    by_type: dict[str, int] = {}
    by_category: dict[str, int] = {}
    by_part: dict[str, int] = {}

    for r in records:
        by_type[r.instrument_type] = by_type.get(r.instrument_type, 0) + 1
        by_category[r.regulation_category] = by_category.get(r.regulation_category, 0) + 1
        if r.part:
            by_part[r.part] = by_part.get(r.part, 0) + 1

    print("\n--- Corpus Breakdown ---")
    print("By Instrument Type:")
    for k, v in sorted(by_type.items()):
        print(f"  - {k}: {v}")

    print("\nBy Regulation Category:")
    for k, v in sorted(by_category.items()):
        print(f"  - {k}: {v}")

    print("\nMotor Traffic Act Units per Part:")
    for k, v in sorted(by_part.items()):
        print(f"  - {k}: {v}")

    # Sample 3 random records with details
    rng = random.Random(42)
    sample_records = rng.sample(records, min(3, len(records)))
    print("\n--- 3 Sample Records Audit ---")
    for i, s_rec in enumerate(sample_records, start=1):
        print(f"\n[Sample {i}]")
        print(f"  ID: {s_rec.id}")
        print(f"  Citation: {s_rec.citation}")
        print(f"  Category: {s_rec.regulation_category}")
        print(f"  Heading: {s_rec.heading}")
        print(f"  Parent Context: {s_rec.parent_context[:100]}...")
        print(f"  Definitions Used: {s_rec.definitions_used}")
        print(f"  Refers To: {s_rec.refers_to}")
        print(f"  Text Snippet: {s_rec.text[:120].replace(chr(10), ' ')}...")

    return {
        "total": len(records),
        "by_type": by_type,
        "by_category": by_category,
        "by_part": by_part,
    }


def main() -> None:
    """CLI entrypoint for building corpus."""
    parser = argparse.ArgumentParser(
        description="Build structured section records for legal RAG corpus"
    )
    parser.add_argument(
        "--interim-dir",
        type=Path,
        default=Path("data/interim"),
        help="Input interim directory (default: data/interim)",
    )
    parser.add_argument(
        "--processed-dir",
        type=Path,
        default=Path("data/processed"),
        help="Target processed directory (default: data/processed)",
    )
    args = parser.parse_args()

    build_corpus(
        interim_dir=args.interim_dir,
        processed_dir=args.processed_dir,
    )


if __name__ == "__main__":
    main()
