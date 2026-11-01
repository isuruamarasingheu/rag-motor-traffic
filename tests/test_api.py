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
