"""Unit tests for indexing, embedding caching, Chroma storage, and BM25 search."""

from unittest.mock import MagicMock

import pytest

from src.chunking.schema import SectionRecord
from src.index.chroma import ChromaStore
from src.index.embedding import CachedEmbedder, SQLiteEmbeddingCache, build_embed_text
from src.retrieval.bm25 import BM25Index, tokenize


@pytest.fixture
def sample_records() -> list[SectionRecord]:
    return [
        SectionRecord(
            id="MTA-1951-s112",
            act="Motor Traffic Act No. 14 of 1951",
            instrument_type="act",
            part="Part VI",
            section="112",
            citation="Motor Traffic Act, Section 112",
            heading="Condition of motor vehicles",
            text="No person shall drive or cause or permit any motor vehicle to be driven on any highway unless such vehicle complies with all regulations.",
            parent_context="Part VI: Use of Motor Vehicles on Highways",
            definitions_used=["motor vehicle", "highway"],
            regulation_category="fitness",
            source_file="data/raw/principal_act/Consolidated_Act_2024.pdf",
            verified=True,
        ),
        SectionRecord(
            id="GAZ-1738-37-reg-4",
            act="National Environmental (Vehicle Noise) Regulations",
            instrument_type="gazette_regulation",
            section="4",
            citation="Gazette 1738/37, Regulation 4",
            heading="Maximum permissible noise levels",
            text="The maximum permissible noise levels for motorcycle silencers shall not exceed 85 dB(A) when tested as specified.",
            parent_context="Gazette 1738/37: Environmental Noise Standards",
            definitions_used=["motorcycle"],
            regulation_category="noise",
            amendment_date="2011-12-28",
            gazette_no="1738/37",
            source_file="data/raw/gazettes/1738_37_Vehicle_Noise_2011.pdf",
            verified=True,
        ),
        SectionRecord(
            id="MTA-1951-s140",
            act="Motor Traffic Act No. 14 of 1951",
            instrument_type="act",
            part="Part VIII",
            section="140",
            citation="Motor Traffic Act, Section 140",
            heading="Speed limits",
            text="No person shall drive a motor vehicle of any class or description on any highway at a speed exceeding the prescribed speed limits.",
            parent_context="Part VIII: Speed Limits and Safe Driving",
            definitions_used=["motor vehicle", "highway"],
            regulation_category="offences",
            source_file="data/raw/principal_act/Consolidated_Act_2024.pdf",
            verified=True,
        ),
    ]


def test_build_embed_text(sample_records: list[SectionRecord]) -> None:
    rec = sample_records[0]
    embed_text = build_embed_text(rec)
    assert "Citation: Motor Traffic Act, Section 112" in embed_text
    assert "Heading: Condition of motor vehicles" in embed_text
    assert "Context: Part VI: Use of Motor Vehicles on Highways" in embed_text
    assert "Definitions: motor vehicle, highway" in embed_text
    assert "Content: No person shall drive" in embed_text


def test_embedding_cache_zero_calls_on_second_run(
    tmp_path, sample_records: list[SectionRecord]
) -> None:
    """Task 5.1 Done when: second run makes zero API calls for unchanged records."""
    db_path = tmp_path / "test_embeddings.db"
    cache = SQLiteEmbeddingCache(db_path=db_path)

    # Mock OpenAI client
    mock_client = MagicMock()

    def create_mock_response(input, model):
        mock_resp = MagicMock()
        mock_resp.data = []
        for i, _ in enumerate(input):
            item = MagicMock()
            item.embedding = [0.1 * (i + 1), 0.2, 0.3]
            mock_resp.data.append(item)
        return mock_resp

    mock_client.embeddings.create.side_effect = create_mock_response

    embedder = CachedEmbedder(
        model="text-embedding-3-small",
        cache=cache,
        client=mock_client,
    )

    # First run: should call mock client
    embeddings_run1 = embedder.embed_records(sample_records)
    assert len(embeddings_run1) == 3
    assert embedder.api_calls_made == 1
    assert mock_client.embeddings.create.call_count == 1

    # Second run with same records: should hit disk cache, zero API calls
    embedder2 = CachedEmbedder(
        model="text-embedding-3-small",
        cache=cache,
        client=mock_client,
    )
    embeddings_run2 = embedder2.embed_records(sample_records)
    assert len(embeddings_run2) == 3
    assert embeddings_run1 == embeddings_run2
    assert embedder2.api_calls_made == 0
    # mock_client should still have been called exactly once total across both runs
    assert mock_client.embeddings.create.call_count == 1


def test_chroma_store_crud_and_metadata_filtering(
    tmp_path, sample_records: list[SectionRecord]
) -> None:
    """Task 5.2 Done when: query by id returns the right record and metadata filters work."""
    chroma_dir = tmp_path / "test_chroma"
    store = ChromaStore(persist_dir=chroma_dir, collection_name="test_sections")

    # Generate dummy embeddings (unit vectors)
    dummy_embs = [
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0],
    ]
    store.add_records(sample_records, dummy_embs)
    assert store.count() == 3

    # 1. Query by ID
    item = store.get_by_id("MTA-1951-s112")
    assert item is not None
    assert item["id"] == "MTA-1951-s112"
    assert item["metadata"]["act"] == "Motor Traffic Act No. 14 of 1951"
    assert item["metadata"]["section"] == "112"
    assert item["metadata"]["regulation_category"] == "fitness"

    # Non-existent ID
    none_item = store.get_by_id("NON-EXISTENT")
    assert none_item is None

    # 2. Vector query with metadata filter (isolate noise regulation)
    hits = store.query(
        query_embedding=[0.0, 0.9, 0.1],
        n_results=5,
        where={"regulation_category": "noise"},
    )
    assert len(hits) == 1
    assert hits[0]["id"] == "GAZ-1738-37-reg-4"
    assert hits[0]["metadata"]["regulation_category"] == "noise"
    assert hits[0]["score"] > 0.8


def test_bm25_index_exact_section_first(
    tmp_path, sample_records: list[SectionRecord]
) -> None:
    """Task 5.3 Done when: an exact section-number query ranks that section first."""
    index_file = tmp_path / "bm25.pkl"
    bm25 = BM25Index(index_path=index_file)
    bm25.build(sample_records)

    # 1. Exact query for "Section 112"
    results_112 = bm25.query("Section 112", top_k=3)
    assert len(results_112) > 0
    assert results_112[0]["id"] == "MTA-1951-s112"
    assert results_112[0]["rank"] == 1

    # 2. Exact query for "Section 140"
    results_140 = bm25.query("section 140", top_k=3)
    assert len(results_140) > 0
    assert results_140[0]["id"] == "MTA-1951-s140"
    assert results_140[0]["rank"] == 1

    # 3. Query for "noise silencer 85 dB"
    results_noise = bm25.query("motorcycle silencer 85 dB", top_k=3)
    assert len(results_noise) > 0
    assert results_noise[0]["id"] == "GAZ-1738-37-reg-4"
    assert results_noise[0]["rank"] == 1


def test_bm25_tokenization() -> None:
    tokens = tokenize("Motor Traffic Act, Section 112(1)(a) - 85 dB(A)!")
    assert "section" in tokens
    assert "112" in tokens
    assert "1" in tokens
    assert "a" in tokens
    assert "85" in tokens
