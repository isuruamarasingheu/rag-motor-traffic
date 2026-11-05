"""Tests for FastAPI backend endpoints."""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from src.api.main import app, set_pipeline_graph
from src.generation.generator import LEGAL_DISCLAIMER


@pytest.fixture(autouse=True)
def reset_graph() -> None:
    """Ensure pipeline graph is reset after each test."""
    yield
    set_pipeline_graph(None)


def test_health_endpoint() -> None:
    """GET /health returns 200 with service information."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Motor Traffic" in data["app"]
    assert "version" in data


def test_ask_valid_answered() -> None:
    """POST /ask returns answered status with verified citations and disclaimer."""
    mock_graph = MagicMock()
    mock_graph.invoke.return_value = {
        "status": "answered",
        "answer": "Musical horns are prohibited under Gazette 1738/37.",
        "citations": [
            {
                "id": "GAZ-1738-37-reg-3",
                "citation": "Gazette No. 1738/37, Regulation 3",
                "text": "No person shall use a musical horn on a motor vehicle.",
            }
        ],
        "disclaimer": LEGAL_DISCLAIMER,
    }
    set_pipeline_graph(mock_graph)

    client = TestClient(app)
    payload = {
        "question": "Can I use a musical horn on my car?",
        "query_id": "test-q1",
    }
    response = client.post("/ask", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "answered"
    assert "Musical horns are prohibited" in data["answer"]
    assert len(data["citations"]) == 1
    assert data["citations"][0]["id"] == "GAZ-1738-37-reg-3"
    assert "legal information" in data["disclaimer"]


def test_ask_refused_out_of_scope() -> None:
    """POST /ask returns refused_out_of_scope for non-traffic questions."""
    mock_graph = MagicMock()
    mock_graph.invoke.return_value = {
        "status": "refused_out_of_scope",
        "answer": "I am specialized exclusively in Sri Lanka's Motor Traffic Act...",
        "citations": [],
        "disclaimer": LEGAL_DISCLAIMER,
    }
    set_pipeline_graph(mock_graph)

    client = TestClient(app)
    payload = {"question": "Can my landlord evict me without notice?"}
    response = client.post("/ask", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "refused_out_of_scope"
    assert data["citations"] == []
    assert "specialized exclusively" in data["answer"]


def test_ask_not_found() -> None:
    """POST /ask returns not_found when provisions cannot be retrieved."""
    mock_graph = MagicMock()
    mock_graph.invoke.return_value = {
        "status": "not_found",
        "answer": "I could not find a relevant provision in the corpus.",
        "citations": [],
        "disclaimer": LEGAL_DISCLAIMER,
    }
    set_pipeline_graph(mock_graph)

    client = TestClient(app)
    payload = {"question": "What is the speed limit on Neptune?"}
    response = client.post("/ask", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "not_found"
    assert data["citations"] == []


def test_ask_validation_error() -> None:
    """POST /ask returns 422 for questions that are too short or empty."""
    client = TestClient(app)

    # Empty question
    resp_empty = client.post("/ask", json={"question": ""})
    assert resp_empty.status_code == 422

    # Whitespace only
    resp_ws = client.post("/ask", json={"question": "   "})
    assert resp_ws.status_code == 422

    # Missing question field
    resp_missing = client.post("/ask", json={})
    assert resp_missing.status_code == 422


def test_translate_endpoint_sinhala() -> None:
    """POST /translate translates plain-language answer to Sinhala using mock client."""
    client = TestClient(app)
    mock_openai = MagicMock()
    mock_resp = MagicMock()
    mock_resp.choices = [
        MagicMock(message=MagicMock(content="හෙල්මට් නොපැළඳ ධාවනය කිරීමේ දඩය රු. 1,000 කි."))
    ]
    mock_openai.chat.completions.create.return_value = mock_resp

    from unittest.mock import patch
    with patch("src.api.main.get_openai_client", return_value=mock_openai):
        payload = {
            "text": "The fine for driving without wearing a helmet is Rs. 1,000.",
            "target_language": "si",
        }
        resp = client.post("/translate", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["target_language"] == "si"
        assert "රු. 1,000" in data["translated_text"]


def test_translate_validation_error() -> None:
    """POST /translate returns 422 for invalid language or empty text."""
    client = TestClient(app)
    resp = client.post("/translate", json={"text": "", "target_language": "si"})
    assert resp.status_code == 422

    resp_lang = client.post("/translate", json={"text": "Hello", "target_language": "fr"})
    assert resp_lang.status_code == 422


def test_list_resources_endpoint() -> None:
    """GET /resources returns curated legal instruments with metadata."""
    client = TestClient(app)
    resp = client.get("/resources")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 15
    first = data[0]
    assert "id" in first
    assert "title" in first
    assert "instrument_type" in first
    assert "sections_count" in first


def test_list_resources_filter_and_search() -> None:
    """GET /resources filters by type, category and search term."""
    client = TestClient(app)

    # Filter by instrument type
    resp_gaz = client.get("/resources?instrument_type=gazette_regulation")
    assert resp_gaz.status_code == 200
    for r in resp_gaz.json():
        assert r["instrument_type"] == "gazette_regulation"

    # Search keyword
    resp_q = client.get("/resources?q=2054/09")
    assert resp_q.status_code == 200
    results = resp_q.json()
    assert len(results) >= 1
    assert any("2054/09" in r.get("gazette_no", "") for r in results)


def test_get_resource_detail_endpoint() -> None:
    """GET /resources/{resource_id} returns resource details and associated sections."""
    client = TestClient(app)
    resp = client.get("/resources/res-gazette-2054-09")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "res-gazette-2054-09"
    assert "Spot Fines" in data["title"]
    assert "sections" in data
    assert len(data["sections"]) > 0

    # Non-existent ID returns 404
    resp_404 = client.get("/resources/res-non-existent-xyz")
    assert resp_404.status_code == 404


def test_view_resource_pdf_endpoint() -> None:
    """GET /pdf/{resource_id} streams authentic legal PDF document."""
    client = TestClient(app)
    resp = client.get("/pdf/res-gazette-2054-09")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert "Gazette_2054-09" in resp.headers.get("content-disposition", "")
    assert len(resp.content) > 1000

    # 404 for non-existent
    resp_404 = client.get("/pdf/res-does-not-exist")
    assert resp_404.status_code == 404


def test_view_raw_file_security() -> None:
    """GET /pdf-file allows accessing raw legal documents but blocks path traversal."""
    client = TestClient(app)

    # Valid file in repository
    resp = client.get("/pdf-file?path=gazettes/Gazette_1738-37_2011_Horn_Decibel_Limits.pdf")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"

    # Directory traversal attempt
    resp_bad = client.get("/pdf-file?path=../../configs/base.yaml")
    assert resp_bad.status_code in (403, 404)


