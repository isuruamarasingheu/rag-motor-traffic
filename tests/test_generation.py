"""Tests for grounded generation, citation verification, and confidence gating."""

import json
from unittest.mock import MagicMock

from src.generation.gate import ConfidenceGate
from src.generation.generator import (
    LEGAL_DISCLAIMER,
    GroundedGenerator,
    extract_json_from_response,
)
from src.generation.prompts import (
    GROUNDED_SYSTEM_PROMPT,
    PROMPT_VERSION,
    build_generation_context,
    format_section_for_prompt,
    render_user_prompt,
)
from src.generation.verifier import CitationVerifier


def test_prompt_version_and_content() -> None:
    """Verify prompt version is v1.0 and contains core grounding rules."""
    assert PROMPT_VERSION == "v1.0"
    assert "ONLY USE RETRIEVED TEXT" in GROUNDED_SYSTEM_PROMPT
    assert "CITATIONS ARE MANDATORY" in GROUNDED_SYSTEM_PROMPT
    assert "VERBATIM QUOTATION" in GROUNDED_SYSTEM_PROMPT
    assert "HONEST REFUSAL / NOT FOUND" in GROUNDED_SYSTEM_PROMPT


def test_prompt_context_rendering() -> None:
    """Verify section hits are rendered with structured headers and text."""
    hits = [
        {
            "id": "MTA-1951-s112",
            "metadata": {
                "citation": "Motor Traffic Act, Section 112",
                "heading": "Classification of motor vehicles",
            },
            "document": "Motor vehicles shall be divided into nine classes.",
        }
    ]
    rendered_item = format_section_for_prompt(hits[0], 0)
    assert "--- [Section 1] ID: MTA-1951-s112 ---" in rendered_item
    assert "Citation: Motor Traffic Act, Section 112" in rendered_item
    assert "Heading: Classification of motor vehicles" in rendered_item
    assert "Motor vehicles shall be divided into nine classes." in rendered_item

    prompt = render_user_prompt("What classes of vehicles exist?", hits)
    assert "CITIZEN QUESTION:" in prompt
    assert "What classes of vehicles exist?" in prompt
    assert "RETRIEVED LEGAL SECTIONS:" in prompt
    assert "MTA-1951-s112" in prompt


def test_empty_retrieval_prompt_rendering() -> None:
    """Empty retrieval list renders safe placeholder."""
    context = build_generation_context([])
    assert "No legal provisions retrieved" in context


def test_extract_json_from_response() -> None:
    """JSON extraction handles raw JSON, markdown-wrapped JSON, and noisy text."""
    raw_clean = '{"status": "answered", "answer": "Test answer"}'
    assert extract_json_from_response(raw_clean)["status"] == "answered"

    raw_fence = '```json\n{"status": "answered", "answer": "With fences"}\n```'
    assert extract_json_from_response(raw_fence)["answer"] == "With fences"

    raw_noisy = 'Here is the answer:\n{"status": "not_found", "answer": "Not found"}\nHope this helps.'
    assert extract_json_from_response(raw_noisy)["status"] == "not_found"


# --- Citation Verifier Tests ---


def test_citation_verifier_valid_case(tmp_path) -> None:
    """Valid citation in corpus and in retrieved set passes verification."""
    sections_file = tmp_path / "sections.jsonl"
    sections_file.write_text(
        json.dumps(
            {
                "id": "MTA-1951-s112",
                "citation": "Motor Traffic Act, Section 112",
                "text": "Every driver shall possess a licence.",
                "heading": "Licence requirement",
            }
        )
        + "\n",
        encoding="utf-8",
    )

    verifier = CitationVerifier(sections_path=sections_file)
    retrieved_hits = [
        {
            "id": "MTA-1951-s112",
            "document": "Every driver shall possess a licence.",
        }
    ]

    result = verifier.verify(
        answer_text="Every driver must hold a licence under section 112.",
        cited_ids=["MTA-1951-s112"],
        retrieved_hits=retrieved_hits,
    )

    assert result.is_valid is True
    assert len(result.valid_citations) == 1
    assert result.valid_citations[0]["id"] == "MTA-1951-s112"
    assert result.invalid_ids == []
    assert result.not_retrieved_ids == []
    assert result.flagged_numbers == []


def test_citation_verifier_invented_citation(tmp_path) -> None:
    """Invented citation not in corpus fails verification."""
    sections_file = tmp_path / "sections.jsonl"
    sections_file.write_text(
        json.dumps(
            {
                "id": "MTA-1951-s112",
                "citation": "Motor Traffic Act, Section 112",
                "text": "Valid section text.",
            }
        )
        + "\n",
        encoding="utf-8",
    )

    verifier = CitationVerifier(sections_path=sections_file)
    retrieved_hits = [{"id": "MTA-1951-s112", "document": "Valid section text."}]

    result = verifier.verify(
        answer_text="Under section 999 you cannot do this.",
        cited_ids=["MTA-1951-s999"],
        retrieved_hits=retrieved_hits,
    )

    assert result.is_valid is False
    assert "MTA-1951-s999" in result.invalid_ids


def test_citation_verifier_not_retrieved_citation(tmp_path) -> None:
    """Citation exists in corpus but was NOT retrieved for this query fails verification."""
    sections_file = tmp_path / "sections.jsonl"
    records = [
        {"id": "MTA-1951-s112", "citation": "Section 112", "text": "Text 112"},
        {"id": "MTA-1951-s2", "citation": "Section 2", "text": "Text 2"},
    ]
    sections_file.write_text(
        "\n".join(json.dumps(r) for r in records) + "\n",
        encoding="utf-8",
    )

    verifier = CitationVerifier(sections_path=sections_file)
    # Only s112 was retrieved
    retrieved_hits = [{"id": "MTA-1951-s112", "document": "Text 112"}]

    # LLM cited s2, which exists in corpus but was not retrieved
    result = verifier.verify(
        answer_text="According to section 2, you must register.",
        cited_ids=["MTA-1951-s2"],
        retrieved_hits=retrieved_hits,
    )

    assert result.is_valid is False
    assert "MTA-1951-s2" in result.not_retrieved_ids


def test_number_verifier_grounded_and_invented(tmp_path) -> None:
    """Verifies that numbers present in retrieved text pass, while invented numbers are flagged."""
    verifier = CitationVerifier(sections_path=tmp_path / "dummy.jsonl")

    retrieved_texts = [
        "The noise level shall not exceed 85 dB(A) for passenger cars or 90 dB(A) for lorries."
    ]

    # Grounded numbers: 85 and 90 are in retrieved text
    grounded_ans = (
        "The permitted noise limit is 85 dB(A) or 90 dB(A) depending on vehicle class."
    )
    flagged = verifier.verify_numbers(grounded_ans, retrieved_texts)
    assert flagged == []

    # Invented numbers: 105 and 5000 do not exist in retrieved text
    hallucinated_ans = "The maximum noise limit is 105 dB(A) and the fine is Rs. 5000."
    flagged = verifier.verify_numbers(hallucinated_ans, retrieved_texts)
    assert "105" in flagged
    assert "5000" in flagged


# --- Confidence Gate Tests ---


def test_confidence_gate_dense_score() -> None:
    """Confidence gate passes above threshold and rejects below threshold."""
    gate = ConfidenceGate(dense_threshold=0.40, rrf_threshold=0.014)

    # Above threshold
    hits_high = [{"id": "s1", "dense_score": 0.52, "score": 0.016}]
    passed, score, _ = gate.evaluate(hits_high)
    assert passed is True
    assert score == 0.52

    # Below threshold
    hits_low = [{"id": "s2", "dense_score": 0.31, "score": 0.009}]
    passed, score, _ = gate.evaluate(hits_low)
    assert passed is False
    assert score == 0.31

    # Empty hits
    passed, _, reason = gate.evaluate([])
    assert passed is False
    assert "No legal documents" in reason


def test_confidence_gate_rrf_fallback() -> None:
    """Confidence gate uses RRF score when dense_score is not present."""
    gate = ConfidenceGate(dense_threshold=0.40, rrf_threshold=0.014)

    hits_rrf_high = [{"id": "s1", "score": 0.016}]
    passed, score, _ = gate.evaluate(hits_rrf_high)
    assert passed is True
    assert score == 0.016

    hits_rrf_low = [{"id": "s2", "score": 0.008}]
    passed, score, _ = gate.evaluate(hits_rrf_low)
    assert passed is False


# --- GroundedGenerator Tests with Mock LLM ---


def test_generator_successful_grounded_answer(tmp_path) -> None:
    """Generator produces valid answered status and verified citations."""
    sections_file = tmp_path / "sections.jsonl"
    sections_file.write_text(
        json.dumps(
            {
                "id": "GAZ-1738-37-reg-3",
                "citation": "Gazette No. 1738/37, Regulation 3",
                "text": "No person shall use a musical horn on a motor vehicle.",
            }
        )
        + "\n",
        encoding="utf-8",
    )
    verifier = CitationVerifier(sections_path=sections_file)

    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(
        {
            "status": "answered",
            "answer": 'Musical horns are prohibited. The law states "No person shall use a musical horn on a motor vehicle".',
            "cited_section_ids": ["GAZ-1738-37-reg-3"],
            "key_quote": "No person shall use a musical horn on a motor vehicle",
        }
    )
    mock_client.chat.completions.create.return_value.choices = [mock_choice]

    generator = GroundedGenerator(client=mock_client, verifier=verifier)

    retrieved = [
        {
            "id": "GAZ-1738-37-reg-3",
            "document": "No person shall use a musical horn on a motor vehicle.",
            "metadata": {"citation": "Gazette No. 1738/37, Regulation 3"},
        }
    ]

    response = generator.generate("Can I use a musical horn?", retrieved)

    assert response["status"] == "answered"
    assert "Musical horns are prohibited" in response["answer"]
    assert len(response["citations"]) == 1
    assert response["citations"][0]["id"] == "GAZ-1738-37-reg-3"
    assert response["disclaimer"] == LEGAL_DISCLAIMER


def test_generator_not_found_response(tmp_path) -> None:
    """Generator cleanly handles not_found response from LLM."""
    verifier = CitationVerifier(sections_path=tmp_path / "dummy.jsonl")

    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(
        {
            "status": "not_found",
            "answer": "The retrieved sections do not contain rules regarding this topic.",
            "cited_section_ids": [],
        }
    )
    mock_client.chat.completions.create.return_value.choices = [mock_choice]

    generator = GroundedGenerator(client=mock_client, verifier=verifier)
    retrieved = [{"id": "MTA-1951-s1", "document": "Irrelevant text."}]

    response = generator.generate("Question about unrelated law?", retrieved)
    assert response["status"] == "not_found"
    assert response["citations"] == []
    assert "not contain" in response["answer"]


def test_generator_retry_on_invalid_citation(tmp_path) -> None:
    """Generator detects invalid citation, triggers retry with feedback, and succeeds on valid retry."""
    sections_file = tmp_path / "sections.jsonl"
    sections_file.write_text(
        json.dumps(
            {
                "id": "MTA-1951-s161-1",
                "citation": "Section 161(1)",
                "text": "The driver shall stop the vehicle immediately after an accident.",
            }
        )
        + "\n",
        encoding="utf-8",
    )
    verifier = CitationVerifier(sections_path=sections_file)

    mock_client = MagicMock()

    # First attempt: cites unretrieved section MTA-1951-s999
    choice_bad = MagicMock()
    choice_bad.message.content = json.dumps(
        {
            "status": "answered",
            "answer": "You must stop immediately.",
            "cited_section_ids": ["MTA-1951-s999"],
        }
    )

    # Second attempt (after retry feedback): cites valid retrieved section MTA-1951-s161-1
    choice_good = MagicMock()
    choice_good.message.content = json.dumps(
        {
            "status": "answered",
            "answer": 'You must stop immediately. The law states "stop the vehicle immediately".',
            "cited_section_ids": ["MTA-1951-s161-1"],
            "key_quote": "stop the vehicle immediately",
        }
    )

    mock_client.chat.completions.create.return_value.choices = [choice_bad]
    # Configure subsequent call
    mock_client.chat.completions.create.side_effect = [
        MagicMock(choices=[choice_bad]),
        MagicMock(choices=[choice_good]),
    ]

    generator = GroundedGenerator(client=mock_client, verifier=verifier)
    retrieved = [
        {
            "id": "MTA-1951-s161-1",
            "document": "The driver shall stop the vehicle immediately after an accident.",
            "metadata": {"citation": "Section 161(1)"},
        }
    ]

    response = generator.generate("What should I do after an accident?", retrieved)

    assert response["status"] == "answered"
    assert response["citations"][0]["id"] == "MTA-1951-s161-1"
    assert mock_client.chat.completions.create.call_count == 2
