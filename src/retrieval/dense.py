"""Dense semantic retrieval module using OpenAI embeddings and Chroma vector store."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from src.index.chroma import ChromaStore
from src.index.embedding import CachedEmbedder


class DenseRetriever:
    """Retrieves legal section records via dense vector similarity."""

    def __init__(
        self,
        chroma_dir: str | Path = "data/chroma_db",
        collection_name: str = "mta_sections",
        embedding_model: str = "text-embedding-3-small",
        embedding_cache_db: str | Path = "data/cache/embeddings.db",
        embedder: CachedEmbedder | None = None,
        store: ChromaStore | None = None,
    ) -> None:
        self.embedder = embedder or CachedEmbedder(
            model=embedding_model,
            cache_path=embedding_cache_db,
        )
        self.store = store or ChromaStore(
            persist_dir=chroma_dir,
            collection_name=collection_name,
        )

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        where: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Retrieve top-k most similar records for a query string."""
        clean_query = query.strip()
        if not clean_query:
            return []

        # Embed query text
        query_embs = self.embedder.embed_texts([clean_query])
        if not query_embs:
            return []

        # Query vector store
        hits = self.store.query(
            query_embedding=query_embs[0],
            n_results=top_k,
            where=where,
        )

        # Attach rank attribute
        for rank, hit in enumerate(hits, start=1):
            hit["rank"] = rank

        return hits
