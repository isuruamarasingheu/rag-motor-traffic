"""BM25 sparse keyword index over legal section records using rank_bm25."""

from __future__ import annotations

import pickle
import re
from pathlib import Path
from typing import Any

from rank_bm25 import BM25Okapi

from src.chunking.schema import SectionRecord


def tokenize(text: str) -> list[str]:
    """Tokenize text into alphanumeric words and preserved numbers/sections."""
    if not text:
        return []
    # Lowercase and match alphanumeric tokens (preserving section numbers and compound words)
    tokens = re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)?", text.lower())
    return tokens


def build_bm25_doc_text(record: SectionRecord) -> str:
    """Format full text representation of a section for lexical indexing.

    Repeats the primary statutory identifier anchor so exact section queries
    consistently rank the target section above passing cross-references.
    """
    sec_anchor = f"section {record.section} {record.citation} {record.id}"
    parts = [
        sec_anchor,
        sec_anchor,
        sec_anchor,
        record.heading,
        record.parent_context,
        record.text,
    ]
    if record.definitions_used:
        parts.append(" ".join(record.definitions_used))
    return " ".join(parts)


class BM25Index:
    """Persistent BM25Okapi index over legal section records."""

    def __init__(self, index_path: str | Path = "data/bm25_index.pkl") -> None:
        self.index_path = Path(index_path)
        self.record_ids: list[str] = []
        self.bm25: BM25Okapi | None = None

    def build(self, records: list[SectionRecord]) -> None:
        """Build BM25 index from section records and persist to disk."""
        if not records:
            raise ValueError("Cannot build BM25 index from empty records list")

        self.record_ids = [r.id for r in records]
        tokenized_corpus = [tokenize(build_bm25_doc_text(r)) for r in records]
        self.bm25 = BM25Okapi(tokenized_corpus)

        self.save()

    def save(self) -> None:
        """Serialize BM25 index and record IDs to disk."""
        if self.bm25 is None:
            raise ValueError("No BM25 index to save")
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "record_ids": self.record_ids,
            "bm25": self.bm25,
        }
        with open(self.index_path, "wb") as f:
            pickle.dump(payload, f)

    def load(self) -> None:
        """Load serialized BM25 index from disk."""
        if not self.index_path.exists():
            raise FileNotFoundError(f"BM25 index not found at {self.index_path}")
        with open(self.index_path, "rb") as f:
            payload = pickle.load(f)
        self.record_ids = payload["record_ids"]
        self.bm25 = payload["bm25"]

    def query(self, query_str: str, top_k: int = 5) -> list[dict[str, Any]]:
        """Query BM25 index and return ranked records with scores."""
        if self.bm25 is None:
            self.load()

        tokens = tokenize(query_str)
        if not tokens:
            return []

        scores = self.bm25.get_scores(tokens)
        # Pair with record ID and original index
        scored_pairs = sorted(
            enumerate(scores),
            key=lambda x: x[1],
            reverse=True,
        )

        results = []
        for rank, (idx, score) in enumerate(scored_pairs[:top_k], start=1):
            if score <= 0.0:
                continue
            results.append(
                {
                    "id": self.record_ids[idx],
                    "score": float(score),
                    "rank": rank,
                }
            )
        return results
