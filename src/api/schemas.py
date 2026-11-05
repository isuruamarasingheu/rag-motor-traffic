"""Pydantic schemas for the FastAPI backend conforming to AGENTS.md §6.3."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class CitationItem(BaseModel):
    """Citation object detailing a specific statutory source."""

    id: str = Field(..., description="Unique section record ID")
    citation: str = Field(..., description="Formal legal citation title")
    text: str = Field(..., description="Verbatim statutory text of this section")


class AskRequest(BaseModel):
    """Request payload for citizen queries."""

    question: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="Plain-language question regarding Sri Lankan motor traffic law",
    )
    query_id: str | None = Field(
        None,
        description="Optional tracking identifier for benchmarks and logging",
    )


class AskResponse(BaseModel):
    """Standardized API response matching AGENTS.md §6.3."""

    status: Literal["answered", "refused_out_of_scope", "not_found"] = Field(
        ...,
        description="Resolution status of the request",
    )
    answer: str | None = Field(
        None,
        description="Plain-language explanation grounded strictly in retrieved text",
    )
    citations: list[CitationItem] = Field(
        default_factory=list,
        description="List of verified legal citations",
    )
    disclaimer: str = Field(
        ...,
        description="Mandatory legal disclaimer",
    )


class HealthResponse(BaseModel):
    """Service health response."""

    status: str
    app: str
    version: str


class SectionItem(BaseModel):
    """Section record exposed for Statute Library data provenance."""

    id: str
    act: str
    instrument_type: str
    part: str | None = None
    section: str | None = None
    citation: str
    heading: str
    text: str
    parent_context: str | None = None
    regulation_category: str | None = None
    amendment_date: str | None = None
    gazette_no: str | None = None
    source_file: str | None = None


class FineItem(BaseModel):
    """Offence fine item for deterministic calculator."""

    id: str
    name: str
    sinhala_name: str | None = None
    section: str
    act: str
    category: str
    group: str | None = None
    fine_type: Literal["spot", "court"]
    min_amount: int
    max_amount: int
    spot_fine: bool
    is_court_only: bool = False
    amount_display: str | None = None
    vehicle_classes: list[str] = Field(default_factory=list)
    points: int = 0
    description: str


class TranslateRequest(BaseModel):
    """Request payload to translate verified answer into Sinhala or Tamil."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Plain-language explanation to translate",
    )
    target_language: Literal["si", "ta"] = Field(
        ...,
        description="Target language: 'si' for Sinhala, 'ta' for Tamil",
    )


class TranslateResponse(BaseModel):
    """Response payload containing translated plain-language text."""

    translated_text: str = Field(..., description="Translated plain-language explanation")
    target_language: str = Field(..., description="Target language code ('si' or 'ta')")


class ResourceItem(BaseModel):
    """Curated primary legal instrument or gazette regulation for visual library."""

    id: str
    title: str
    short_title: str
    instrument_type: str
    category: str
    act_no: str | None = None
    gazette_no: str | None = None
    date_promulgated: str | None = None
    year: int | None = None
    issuing_authority: str
    source_file: str
    badge_label: str
    theme_color: str
    description: str
    sections_count: int = 0
    key_provisions: list[str] = Field(default_factory=list)


class ResourceDetail(ResourceItem):
    """Detailed resource view containing its full list of verified sections."""

    sections: list[SectionItem] = Field(default_factory=list)

