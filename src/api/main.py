"""FastAPI application for the Sri Lankan Motor Traffic Act legal assistant."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from src.api.schemas import AskRequest, AskResponse, HealthResponse
from src.generation.generator import LEGAL_DISCLAIMER
from src.graph.builder import ask_legal_assistant, build_legal_rag_graph

app = FastAPI(
    title="Sri Lanka Motor Traffic Legal Assistant API",
    description=(
        "Citation-grounded legal information assistant for Sri Lanka's "
        "Motor Traffic Act No. 14 of 1951 and subsidiary traffic regulations."
    ),
    version="1.0.0",
)

# Enable CORS for local development and frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cached compiled graph instance for production requests
_pipeline_graph: Any | None = None


def get_pipeline_graph() -> Any:
    """Retrieve or initialize the compiled LangGraph pipeline."""
    global _pipeline_graph
    if _pipeline_graph is None:
        _pipeline_graph = build_legal_rag_graph()
    return _pipeline_graph


def set_pipeline_graph(graph: Any | None) -> None:
    """Inject a custom compiled graph (used for isolated testing)."""
    global _pipeline_graph
    _pipeline_graph = graph


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        app="Sri Lanka Motor Traffic Act Legal Assistant",
        version="1.0.0",
    )


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    """Answer a citizen's question using citation-grounded RAG."""
    clean_question = request.question.strip()
    if not clean_question:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Question cannot be empty or purely whitespace.",
        )

    try:
        graph = get_pipeline_graph()
        result = ask_legal_assistant(
            question=clean_question,
            query_id=request.query_id,
            graph=graph,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the request: {exc}",
        ) from exc

    return AskResponse(
        status=result.get("status", "not_found"),
        answer=result.get("answer"),
        citations=result.get("citations", []),
        disclaimer=result.get("disclaimer", LEGAL_DISCLAIMER),
    )
