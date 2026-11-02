"""FastAPI application for the Sri Lankan Motor Traffic Act legal assistant."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from src.api.schemas import (
    AskRequest,
    AskResponse,
    FineItem,
    HealthResponse,
    SectionItem,
)
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


_sections_cache: list[dict[str, Any]] | None = None
_fines_cache: list[dict[str, Any]] | None = None


def get_all_sections() -> list[dict[str, Any]]:
    """Load and cache verified statutory sections from data/processed/sections.jsonl."""
    global _sections_cache
    if _sections_cache is None:
        p = Path("data/processed/sections.jsonl")
        if not p.exists():
            p = Path("DATA/processed/sections.jsonl")
        sections = []
        if p.exists():
            with open(p, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        sections.append(json.loads(line))
        _sections_cache = sections
    return _sections_cache


def get_all_fines() -> list[dict[str, Any]]:
    """Load and cache fine schedule catalog from data/processed/fine_schedule.json."""
    global _fines_cache
    if _fines_cache is None:
        p = Path("data/processed/fine_schedule.json")
        fines = []
        if p.exists():
            with open(p, encoding="utf-8") as f:
                fines = json.load(f)
        _fines_cache = fines
    return _fines_cache


@app.get("/sections", response_model=list[SectionItem])
def list_sections(
    q: str | None = Query(None, description="Search keyword or section number"),
    category: str | None = Query(None, description="Regulation category"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[SectionItem]:
    """List and search verified corpus sections for the Statute Library data explorer."""
    sections = get_all_sections()
    filtered = sections

    if category and category != "all":
        cat_lower = category.lower()
        filtered = [
            s for s in filtered
            if (s.get("regulation_category") or "").lower() == cat_lower
        ]

    if q:
        query_lower = q.lower().strip()
        filtered = [
            s for s in filtered
            if query_lower in (s.get("id") or "").lower()
            or query_lower in (s.get("citation") or "").lower()
            or query_lower in (s.get("heading") or "").lower()
            or query_lower in (s.get("text") or "").lower()
            or query_lower in (s.get("part") or "").lower()
        ]

    paginated = filtered[offset : offset + limit]
    return [
        SectionItem(
            id=s.get("id", ""),
            act=s.get("act", ""),
            instrument_type=s.get("instrument_type", ""),
            part=s.get("part"),
            section=s.get("section"),
            citation=s.get("citation", ""),
            heading=s.get("heading", ""),
            text=s.get("text", ""),
            parent_context=s.get("parent_context"),
            regulation_category=s.get("regulation_category"),
            amendment_date=s.get("amendment_date"),
            gazette_no=s.get("gazette_no"),
            source_file=s.get("source_file"),
        )
        for s in paginated
    ]


@app.get("/fines", response_model=list[FineItem])
def list_fines(
    category: str | None = Query(None, description="Filter by fine category"),
) -> list[FineItem]:
    """List traffic fine catalogue for deterministic calculator."""
    fines = get_all_fines()
    if category and category != "all":
        cat_lower = category.lower()
        fines = [f for f in fines if f.get("category", "").lower() == cat_lower]
    return [FineItem(**f) for f in fines]

