"""Embedding service with persistent disk caching for legal section records."""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
from pathlib import Path
from typing import TYPE_CHECKING, Any

import tiktoken
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

if TYPE_CHECKING:
    from src.chunking.schema import SectionRecord

_TOKENIZER = None


def get_tokenizer() -> tiktoken.Encoding:
    global _TOKENIZER
    if _TOKENIZER is None:
        _TOKENIZER = tiktoken.get_encoding("cl100k_base")
    return _TOKENIZER


def truncate_tokens(text: str, max_tokens: int = 7500) -> str:
    """Safely truncate text to stay within OpenAI embedding model token limit (8191)."""
    enc = get_tokenizer()
    tokens = enc.encode(text)
    if len(tokens) > max_tokens:
        return enc.decode(tokens[:max_tokens])
    return text


def build_embed_text(record: SectionRecord, max_tokens: int = 7500) -> str:
    """Format a section record into a coherent representation for semantic embedding."""
    parts = []
    if record.citation:
        parts.append(f"Citation: {record.citation}")
    if record.heading:
        parts.append(f"Heading: {record.heading}")
    if (
        record.parent_context
        and record.parent_context.strip() != record.heading.strip()
    ):
        parts.append(f"Context: {record.parent_context}")
    if record.definitions_used:
        parts.append(f"Definitions: {', '.join(record.definitions_used)}")
    parts.append(f"Content: {record.text}")
    full_text = "\n".join(parts)
    return truncate_tokens(full_text, max_tokens=max_tokens)


class SQLiteEmbeddingCache:
    """Persistent disk cache for vector embeddings using SQLite."""

    def __init__(self, db_path: str | Path = "data/cache/embeddings.db") -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS embeddings (
                    cache_key TEXT PRIMARY KEY,
                    model TEXT NOT NULL,
                    embedding_json TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.commit()

    @staticmethod
    def compute_key(model: str, text: str) -> str:
        """Compute deterministic SHA-256 hash for model and input text."""
        content = f"{model}::{text}".encode()
        return hashlib.sha256(content).hexdigest()

    def get(self, cache_key: str) -> list[float] | None:
        """Retrieve embedding vector from cache if present."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT embedding_json FROM embeddings WHERE cache_key = ?",
                (cache_key,),
            )
            row = cursor.fetchone()
            if row:
                return json.loads(row[0])
        return None

    def get_many(self, cache_keys: list[str]) -> dict[str, list[float]]:
        """Retrieve multiple embeddings in bulk."""
        if not cache_keys:
            return {}
        results = {}
        # Query in chunks of 500 to adhere to SQLite parameter limits
        chunk_size = 500
        with self._get_connection() as conn:
            cursor = conn.cursor()
            for i in range(0, len(cache_keys), chunk_size):
                chunk = cache_keys[i : i + chunk_size]
                placeholders = ",".join("?" for _ in chunk)
                cursor.execute(
                    f"SELECT cache_key, embedding_json FROM embeddings WHERE cache_key IN ({placeholders})",
                    chunk,
                )
                for key, val in cursor.fetchall():
                    results[key] = json.loads(val)
        return results

    def set_many(self, items: list[tuple[str, str, list[float]]]) -> None:
        """Store multiple embeddings in a single atomic transaction.

        items: list of (cache_key, model, embedding)
        """
        if not items:
            return
        with self._get_connection() as conn:
            conn.executemany(
                """
                INSERT OR REPLACE INTO embeddings (cache_key, model, embedding_json)
                VALUES (?, ?, ?)
                """,
                [(k, m, json.dumps(emb)) for k, m, emb in items],
            )
            conn.commit()


class CachedEmbedder:
    """Embedding manager with disk-caching to guarantee zero duplicate API calls."""

    def __init__(
        self,
        model: str = "text-embedding-3-small",
        cache: SQLiteEmbeddingCache | None = None,
        cache_path: str | Path = "data/cache/embeddings.db",
        client: Any | None = None,
    ) -> None:
        self.model = model
        self.cache = cache or SQLiteEmbeddingCache(cache_path)
        self._client = client
        self.api_calls_made = 0

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            api_key = os.getenv("OPENAI_API_KEY")
            self._client = OpenAI(api_key=api_key)
        return self._client

    def embed_texts(self, texts: list[str], batch_size: int = 100) -> list[list[float]]:
        """Generate embeddings for a list of texts, fetching cached values where available."""
        if not texts:
            return []

        # 0. Ensure all texts fit within token bounds
        safe_texts = [truncate_tokens(t) for t in texts]

        # 1. Compute cache keys
        keys = [self.cache.compute_key(self.model, text) for text in safe_texts]

        # 2. Bulk lookup in cache
        cached_map = self.cache.get_many(keys)

        # 3. Identify missing items
        missing_indices = [i for i, k in enumerate(keys) if k not in cached_map]

        # 4. Fetch missing embeddings via OpenAI API in batches
        if missing_indices:
            for start_idx in range(0, len(missing_indices), batch_size):
                batch_indices = missing_indices[start_idx : start_idx + batch_size]
                batch_texts = [safe_texts[idx] for idx in batch_indices]

                response = self.client.embeddings.create(
                    input=batch_texts, model=self.model
                )
                self.api_calls_made += 1

                batch_items_to_cache: list[tuple[str, str, list[float]]] = []
                for local_i, emb_data in enumerate(response.data):
                    idx = batch_indices[local_i]
                    emb_vector = emb_data.embedding
                    key = keys[idx]
                    cached_map[key] = emb_vector
                    batch_items_to_cache.append((key, self.model, emb_vector))

                # Immediately store batch items in disk cache
                self.cache.set_many(batch_items_to_cache)

        # 5. Assemble result in original order
        return [cached_map[k] for k in keys]

    def embed_records(
        self, records: list[SectionRecord], batch_size: int = 100
    ) -> list[list[float]]:
        """Extract legal context representation and embed section records."""
        texts = [build_embed_text(r) for r in records]
        return self.embed_texts(texts, batch_size=batch_size)
