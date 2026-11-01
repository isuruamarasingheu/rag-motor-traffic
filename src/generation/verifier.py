"""Citation and numeric grounding verifier.

Enforces:
1. Every cited section ID exists in the corpus registry.
2. Every cited section ID is present in the retrieved set for the query.
3. Every numeric statutory figure (fine, speed, dB, time limit) in the answer
   is grounded in the retrieved text, preventing hallucinated numbers.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class CitationVerificationResult:
    """Result of citation and grounding verification."""

    is_valid: bool
    valid_citations: list[dict[str, str]] = field(default_factory=list)
    invalid_ids: list[str] = field(default_factory=list)
    not_retrieved_ids: list[str] = field(default_factory=list)
    flagged_numbers: list[str] = field(default_factory=list)
    error_message: str | None = None


class CitationVerifier:
    """Verifies citation authenticity against corpus registry and retrieved hits."""

    def __init__(self, sections_path: Path | str | None = None) -> None:
        self.sections_path = Path(sections_path or "data/processed/sections.jsonl")
        self.corpus_registry: dict[str, dict[str, Any]] = {}
        self._load_corpus()

    def _load_corpus(self) -> None:
        """Load valid section IDs and metadata from processed corpus."""
        if not self.sections_path.exists():
            return
        with open(self.sections_path, "r", encoding="utf-8") as f:
            for line in f:
                line_str = line.strip()
                if not line_str:
                    continue
                record = json.loads(line_str)
                sid = record.get("id")
                if sid:
                    self.corpus_registry[sid] = {
                        "id": sid,
                        "citation": record.get("citation", sid),
                        "text": record.get("text", ""),
                        "heading": record.get("heading", ""),
                    }

    def verify_citations(
        self,
        cited_ids: list[str],
        retrieved_ids: list[str],
    ) -> tuple[bool, list[str], list[str]]:
        """Verify cited IDs exist in corpus and in the retrieved set.

        Returns:
            (is_valid, invalid_ids, not_retrieved_ids)
        """
        if not cited_ids:
            return False, [], []

        invalid_ids = []
        not_retrieved_ids = []
        retrieved_set = set(retrieved_ids)

        for cid in cited_ids:
            clean_cid = cid.strip()
            if not clean_cid:
                continue
            if clean_cid not in self.corpus_registry:
                invalid_ids.append(clean_cid)
            elif clean_cid not in retrieved_set:
                not_retrieved_ids.append(clean_cid)

        is_valid = len(invalid_ids) == 0 and len(not_retrieved_ids) == 0
        return is_valid, invalid_ids, not_retrieved_ids

    def verify_numbers(
        self,
        answer_text: str,
        retrieved_texts: list[str],
        allowed_numbers: set[str] | None = None,
    ) -> list[str]:
        """Extract numbers from answer and check whether they appear in retrieved texts.

        Returns a list of ungrounded / hallucinated numbers found in the answer.
        """
        if not answer_text.strip() or not retrieved_texts:
            return []

        # Find all numeric tokens (integers and decimals)
        raw_numbers = re.findall(r"\b\d+(?:[\.,]\d+)?\b", answer_text)
        if not raw_numbers:
            return []

        # Normalize retrieved text into combined string
        combined_source = " ".join(retrieved_texts)
        source_numbers = set(re.findall(r"\b\d+(?:[\.,]\d+)?\b", combined_source))

        # Additional allowed numbers (e.g. section numbers cited, year 1951, bullet points 1, 2, 3)
        whitelist = set(allowed_numbers or set())
        # Always whitelist basic enumeration digits 1..5 and act year 1951
        whitelist.update({"1", "2", "3", "4", "5", "14", "1951"})

        flagged: list[str] = []
        for num in raw_numbers:
            # Clean trailing punctuation
            clean_num = num.strip(".,")
            if not clean_num:
                continue
            if clean_num in whitelist:
                continue
            if clean_num not in source_numbers:
                flagged.append(clean_num)

        return sorted(set(flagged))

    def verify(
        self,
        answer_text: str,
        cited_ids: list[str],
        retrieved_hits: list[dict[str, Any]],
    ) -> CitationVerificationResult:
        """Perform comprehensive citation and numeric grounding verification."""
        retrieved_ids = [hit["id"] for hit in retrieved_hits if "id" in hit]
        retrieved_texts = [
            hit.get("document", "") or hit.get("metadata", {}).get("text", "")
            for hit in retrieved_hits
        ]

        # 1. Verify cited IDs
        _is_cit_valid, invalid_ids, not_retrieved_ids = self.verify_citations(
            cited_ids=cited_ids,
            retrieved_ids=retrieved_ids,
        )

        # 2. Extract allowed numbers from cited section IDs (e.g. "112" from "MTA-1951-s112")
        allowed_nums = set()
        for cid in cited_ids:
            allowed_nums.update(re.findall(r"\d+", cid))

        # 3. Verify numbers
        flagged_numbers = self.verify_numbers(
            answer_text=answer_text,
            retrieved_texts=retrieved_texts,
            allowed_numbers=allowed_nums,
        )

        # Determine overall validity
        errors = []
        if invalid_ids:
            errors.append(f"Cited section IDs not in corpus: {invalid_ids}")
        if not_retrieved_ids:
            errors.append(
                f"Cited section IDs not in retrieved context: {not_retrieved_ids}"
            )
        if not cited_ids:
            errors.append("No citations provided for answered status.")
        if flagged_numbers:
            errors.append(f"Ungrounded numeric values detected: {flagged_numbers}")

        is_valid = len(errors) == 0

        # Build verified citation objects conforming to API contract
        valid_citations: list[dict[str, str]] = []
        for cid in cited_ids:
            clean_cid = cid.strip()
            if clean_cid in self.corpus_registry and clean_cid in set(retrieved_ids):
                rec = self.corpus_registry[clean_cid]
                valid_citations.append(
                    {
                        "id": clean_cid,
                        "citation": rec.get("citation", clean_cid),
                        "text": rec.get("text", ""),
                    }
                )

        return CitationVerificationResult(
            is_valid=is_valid,
            valid_citations=valid_citations,
            invalid_ids=invalid_ids,
            not_retrieved_ids=not_retrieved_ids,
            flagged_numbers=flagged_numbers,
            error_message="; ".join(errors) if errors else None,
        )
