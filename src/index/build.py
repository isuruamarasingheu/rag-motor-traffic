"""Build script to generate embeddings, Chroma vector store, and BM25 index."""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

import yaml

from src.chunking.schema import SectionRecord
from src.index.chroma import ChromaStore
from src.index.embedding import CachedEmbedder
from src.retrieval.bm25 import BM25Index

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("index.build")


def load_config(config_path: str = "configs/base.yaml") -> dict:
    with open(config_path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_records(sections_path: str | Path) -> list[SectionRecord]:
    path = Path(sections_path)
    if not path.exists():
        raise FileNotFoundError(f"Sections file not found: {path}")

    records = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(SectionRecord.model_validate(json.loads(line)))
    return records


def build_all(config_path: str = "configs/base.yaml", reset: bool = False) -> None:
    config = load_config(config_path)
    paths = config.get("paths", {})
    models = config.get("models", {})

    sections_file = Path(paths.get("sections_file", "data/processed/sections.jsonl"))
    chroma_dir = Path(paths.get("chroma_dir", "data/chroma_db"))
    embedding_cache_db = Path("data/cache/embeddings.db")
    bm25_path = Path("data/bm25_index.pkl")
    embedding_model = models.get("embedding_model", "text-embedding-3-small")

    logger.info("Loading section records from %s...", sections_file)
    all_records = load_records(sections_file)
    logger.info("Total records loaded: %d", len(all_records))

    # Enforce non-negotiable rule: only verified records may be indexed
    verified_records = [r for r in all_records if r.verified]
    logger.info("Verified records for indexing: %d", len(verified_records))

    if len(verified_records) < len(all_records):
        logger.warning(
            "Skipped %d unverified records per data contract rules",
            len(all_records) - len(verified_records),
        )

    # 1. Embeddings with persistent caching
    logger.info("Generating embeddings using model '%s'...", embedding_model)
    embedder = CachedEmbedder(
        model=embedding_model,
        cache_path=embedding_cache_db,
    )
    embeddings = embedder.embed_records(verified_records, batch_size=100)
    logger.info(
        "Embedding complete. API calls made: %d (cached: %d)",
        embedder.api_calls_made,
        len(verified_records) - (embedder.api_calls_made * 100),
    )

    # 2. Chroma Vector Database
    logger.info("Updating Chroma persistent vector store at %s...", chroma_dir)
    chroma_store = ChromaStore(persist_dir=chroma_dir, collection_name="mta_sections")
    if reset:
        logger.info("Resetting Chroma collection '%s'...", chroma_store.collection_name)
        chroma_store.reset_collection()
    chroma_store.add_records(verified_records, embeddings, batch_size=250)
    logger.info(
        "Chroma collection 'mta_sections' updated. Total documents: %d",
        chroma_store.count(),
    )

    # 3. BM25 Lexical Index
    logger.info("Building BM25 sparse index at %s...", bm25_path)
    bm25_index = BM25Index(index_path=bm25_path)
    bm25_index.build(verified_records)
    logger.info("BM25 index built and serialized successfully.")

    logger.info("Phase 5 Indexing Build complete!")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build dense and lexical indexes for legal RAG."
    )
    parser.add_argument(
        "--config",
        default="configs/base.yaml",
        help="Path to YAML configuration file.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Reset vector collection before building.",
    )
    args = parser.parse_args()
    build_all(config_path=args.config, reset=args.reset)


if __name__ == "__main__":
    main()
