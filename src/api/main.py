"""FastAPI application for the Sri Lankan Motor Traffic Act legal assistant."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

from src.api.schemas import (
    AskRequest,
    AskResponse,
    FineItem,
    HealthResponse,
    ResourceDetail,
    ResourceItem,
    SectionItem,
    TranslateRequest,
    TranslateResponse,
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


_openai_client: OpenAI | None = None
_translation_cache: dict[tuple[str, str], str] = {}


def get_openai_client() -> OpenAI:
    """Initialize or return cached OpenAI client."""
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _openai_client


@app.post("/translate", response_model=TranslateResponse)
def translate(request: TranslateRequest) -> TranslateResponse:
    """Translate verified English legal explanation to Sinhala or Tamil on demand."""
    clean_text = request.text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Text cannot be empty or whitespace.",
        )

    cache_key = (clean_text, request.target_language)
    if cache_key in _translation_cache:
        return TranslateResponse(
            translated_text=_translation_cache[cache_key],
            target_language=request.target_language,
        )

    target_lang = "Sinhala (සිංහල)" if request.target_language == "si" else "Tamil (தமிழ்)"
    sys_prompt = (
        f"You are a specialized legal translator for Sri Lanka's Motor Traffic Law.\n"
        f"Translate the following plain-language legal explanation accurately into natural {target_lang} for Sri Lankan citizens.\n\n"
        "RULES:\n"
        "1. Preserve section numbers, gazette references, and statutory names with natural terminology.\n"
        "2. Preserve all fine amounts and currency figures exactly (e.g. 'Rs. 1,000' -> 'රු. 1,000' in Sinhala, 'ரூ. 1,000' in Tamil).\n"
        "3. Do not add outside commentary, disclaimers, or altered legal advice.\n"
        "4. Output ONLY the translated text without code fences or conversational filler."
    )

    try:
        client = get_openai_client()
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.0,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": clean_text},
            ],
        )
        translated = (resp.choices[0].message.content or "").strip()
        if not translated:
            translated = clean_text
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {exc}",
        ) from exc

    _translation_cache[cache_key] = translated
    return TranslateResponse(
        translated_text=translated,
        target_language=request.target_language,
    )


_sections_cache: list[dict[str, Any]] | None = None
_fines_cache: list[dict[str, Any]] | None = None
_resources_cache: list[dict[str, Any]] | None = None


def get_all_resources() -> list[dict[str, Any]]:
    """Load and cache curated legal resources from data/processed/resources.json."""
    global _resources_cache
    if _resources_cache is None:
        p = Path("data/processed/resources.json")
        resources = []
        if p.exists():
            with open(p, encoding="utf-8") as f:
                resources = json.load(f)
        _resources_cache = resources
    return _resources_cache


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


@app.get("/resources", response_model=list[ResourceItem])
def list_resources(
    q: str | None = Query(None, description="Search keyword, title, or gazette number"),
    instrument_type: str | None = Query(None, description="Filter by instrument type"),
    category: str | None = Query(None, description="Filter by subject category"),
    sort_by: str | None = Query("newest", description="Sorting: newest, oldest, title, sections"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[ResourceItem]:
    """List and filter curated primary legal instruments for visual catalog."""
    resources = get_all_resources()
    filtered = resources

    if instrument_type and instrument_type != "all":
        t_lower = instrument_type.lower()
        filtered = [r for r in filtered if r.get("instrument_type", "").lower() == t_lower]

    if category and category != "all":
        cat_lower = category.lower()
        filtered = [r for r in filtered if r.get("category", "").lower() == cat_lower]

    if q:
        query_lower = q.lower().strip()
        filtered = [
            r for r in filtered
            if query_lower in r.get("title", "").lower()
            or query_lower in r.get("short_title", "").lower()
            or query_lower in (r.get("gazette_no") or "").lower()
            or query_lower in (r.get("act_no") or "").lower()
            or query_lower in r.get("description", "").lower()
            or any(query_lower in kp.lower() for kp in r.get("key_provisions", []))
        ]

    # Sorting
    if sort_by == "newest":
        filtered = sorted(filtered, key=lambda x: str(x.get("date_promulgated") or "0000"), reverse=True)
    elif sort_by == "oldest":
        filtered = sorted(filtered, key=lambda x: str(x.get("date_promulgated") or "9999"))
    elif sort_by == "title":
        filtered = sorted(filtered, key=lambda x: x.get("short_title", x.get("title", "")).lower())
    elif sort_by == "sections":
        filtered = sorted(filtered, key=lambda x: x.get("sections_count", 0), reverse=True)

    paginated = filtered[offset : offset + limit]
    return [ResourceItem(**r) for r in paginated]


@app.get("/resources/{resource_id}", response_model=ResourceDetail)
def get_resource(resource_id: str) -> ResourceDetail:
    """Retrieve full details for a legal resource including all associated sections."""
    resources = get_all_resources()
    match = next((r for r in resources if r.get("id") == resource_id), None)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Legal resource '{resource_id}' not found.",
        )

    # Find associated sections
    source_file = match.get("source_file", "")
    all_sections = get_all_sections()
    matching_sections = [
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
        for s in all_sections
        if s.get("source_file") == source_file
    ]

    return ResourceDetail(
        **match,
        sections=matching_sections,
    )


