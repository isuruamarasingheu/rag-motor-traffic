"""Chroma vector database client and collection manager for legal section records."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import chromadb

from src.chunking.schema import SectionRecord
from src.index.embedding import build_embed_text


class ChromaStore:
    """Manages persistent Chroma vector storage for legal sections."""

    def __init__(
        self,
        persist_dir: str | Path = "data/chroma_db",
        collection_name: str = "mta_sections",
    ) -> None:
        self.persist_dir = Path(persist_dir)
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.collection_name = collection_name
        self.client = chromadb.PersistentClient(path=str(self.persist_dir))
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    @staticmethod
    def _prepare_metadata(record: SectionRecord) -> dict[str, str | int | float | bool]:
        """Convert SectionRecord to Chroma-compatible flat metadata dictionary."""
        return {
            "id": record.id,
            "act": record.act,
            "section": record.section,
            "instrument_type": record.instrument_type,
            "regulation_category": record.regulation_category,
            "amendment_date": record.amendment_date or "",
            "citation": record.citation,
            "heading": record.heading,
            "part": record.part or "",
            "source_file": record.source_file,
            "verified": bool(record.verified),
        }

    def add_records(
        self,
        records: list[SectionRecord],
        embeddings: list[list[float]],
        batch_size: int = 250,
    ) -> None:
        """Upsert section records with embeddings and metadata in batches."""
        if not records:
            return
        if len(records) != len(embeddings):
            raise ValueError(
                f"Mismatch: got {len(records)} records and {len(embeddings)} embeddings"
            )

        total = len(records)
        for i in range(0, total, batch_size):
            batch_recs = records[i : i + batch_size]
            batch_embs = embeddings[i : i + batch_size]

            ids = [r.id for r in batch_recs]
            documents = [build_embed_text(r) for r in batch_recs]
            metadatas = [self._prepare_metadata(r) for r in batch_recs]

            self.collection.upsert(
                ids=ids,
                embeddings=batch_embs,
                documents=documents,
                metadatas=metadatas,
            )

    def get_by_id(self, record_id: str) -> dict[str, Any] | None:
        """Retrieve a record by its unique ID."""
        result = self.collection.get(
            ids=[record_id], include=["metadatas", "documents"]
        )
        if result and result["ids"]:
            return {
                "id": result["ids"][0],
                "document": result["documents"][0] if result["documents"] else None,
                "metadata": result["metadatas"][0] if result["metadatas"] else None,
            }
        return None

    def query(
        self,
        query_embedding: list[float],
        n_results: int = 5,
        where: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Dense similarity search with optional metadata filtering."""
        kwargs: dict[str, Any] = {
            "query_embeddings": [query_embedding],
            "n_results": n_results,
            "include": ["metadatas", "documents", "distances"],
        }
        if where:
            kwargs["where"] = where

        res = self.collection.query(**kwargs)
        if not res or not res["ids"] or not res["ids"][0]:
            return []

        hits = []
        ids = res["ids"][0]
        distances = res["distances"][0] if res.get("distances") else [0.0] * len(ids)
        documents = res["documents"][0] if res.get("documents") else [None] * len(ids)
        metadatas = res["metadatas"][0] if res.get("metadatas") else [{}] * len(ids)

        for i, rid in enumerate(ids):
            # For cosine distance: cosine similarity = 1 - cosine distance
            dist = distances[i]
            sim = 1.0 - dist
            hits.append(
                {
                    "id": rid,
                    "score": sim,
                    "distance": dist,
                    "document": documents[i],
                    "metadata": metadatas[i],
                }
            )
        return hits

    def count(self) -> int:
        """Return the number of items in the collection."""
        return self.collection.count()

    def reset_collection(self) -> None:
        """Delete existing collection and recreate an empty one."""
        existing_names = [c.name for c in self.client.list_collections()]
        if self.collection_name in existing_names:
            self.client.delete_collection(name=self.collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
        )
