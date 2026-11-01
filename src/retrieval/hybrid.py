"""Hybrid retrieval module combining dense semantic search and BM25 keyword search via RRF."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from src.index.chroma import ChromaStore
from src.retrieval.bm25 import BM25Index
from src.retrieval.dense import DenseRetriever


def compute_rrf_scores(
    dense_hits: list[dict[str, Any]],
    bm25_hits: list[dict[str, Any]],
    rrf_k: int = 60,
    dense_weight: float = 0.5,
    bm25_weight: float = 0.5,
) -> list[dict[str, Any]]:
    """Fuse ranked lists from dense and BM25 retrievers using Reciprocal Rank Fusion."""
    score_map: dict[str, float] = {}
    details_map: dict[str, dict[str, Any]] = {}

    # Process dense hits
    for hit in dense_hits:
        rid = hit["id"]
        rank = hit["rank"]
        rrf_contrib = dense_weight / (rrf_k + rank)
        score_map[rid] = score_map.get(rid, 0.0) + rrf_contrib
        details_map[rid] = {
            "id": rid,
            "document": hit.get("document"),
            "metadata": hit.get("metadata", {}),
            "dense_score": hit.get("score"),
            "dense_rank": rank,
            "bm25_score": None,
            "bm25_rank": None,
        }

    # Process BM25 hits
    for hit in bm25_hits:
        rid = hit["id"]
        rank = hit["rank"]
        rrf_contrib = bm25_weight / (rrf_k + rank)
        score_map[rid] = score_map.get(rid, 0.0) + rrf_contrib
        if rid in details_map:
            details_map[rid]["bm25_score"] = hit.get("score")
            details_map[rid]["bm25_rank"] = rank
        else:
            details_map[rid] = {
                "id": rid,
                "document": hit.get("document"),
                "metadata": hit.get("metadata", {}),
                "dense_score": None,
                "dense_rank": None,
                "bm25_score": hit.get("score"),
                "bm25_rank": rank,
            }

    # Sort descending by fused RRF score
    sorted_items = sorted(score_map.items(), key=lambda item: item[1], reverse=True)

    results = []
    for rank, (rid, score) in enumerate(sorted_items, start=1):
        item = details_map[rid]
        item["score"] = score
        item["rank"] = rank
        results.append(item)

    return results


class HybridRetriever:
    """Combines Dense and BM25 retrieval using Reciprocal Rank Fusion (RRF)."""

    def __init__(
        self,
        dense_retriever: DenseRetriever | None = None,
        bm25_index: BM25Index | None = None,
        chroma_store: ChromaStore | None = None,
        chroma_dir: str | Path = "data/chroma_db",
        bm25_path: str | Path = "data/bm25_index.pkl",
        rrf_k: int = 60,
        dense_weight: float = 0.5,
        bm25_weight: float = 0.5,
    ) -> None:
        self.dense_retriever = dense_retriever or DenseRetriever(chroma_dir=chroma_dir)
        self.bm25_index = bm25_index or BM25Index(index_path=bm25_path)
        self.chroma_store = chroma_store or self.dense_retriever.store
        self.rrf_k = rrf_k
        self.dense_weight = dense_weight
        self.bm25_weight = bm25_weight

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        candidate_pool_size: int = 20,
        where: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Perform hybrid retrieval with dense + BM25 and fusion."""
        clean_query = query.strip()
        if not clean_query:
            return []

        # Retrieve candidates from both branches
        dense_hits = self.dense_retriever.retrieve(
            clean_query, top_k=candidate_pool_size, where=where
        )
        bm25_hits = self.bm25_index.query(clean_query, top_k=candidate_pool_size)

        # Merge via RRF
        fused = compute_rrf_scores(
            dense_hits=dense_hits,
            bm25_hits=bm25_hits,
            rrf_k=self.rrf_k,
            dense_weight=self.dense_weight,
            bm25_weight=self.bm25_weight,
        )

        top_hits = fused[:top_k]

        # Enrich any hits that came solely from BM25 and lack metadata/document
        for hit in top_hits:
            if not hit.get("metadata") or not hit.get("document"):
                record_data = self.chroma_store.get_by_id(hit["id"])
                if record_data:
                    hit["metadata"] = record_data.get("metadata", {})
                    hit["document"] = record_data.get("document", "")

        return top_hits
