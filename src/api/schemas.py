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
        max_length=500,
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
