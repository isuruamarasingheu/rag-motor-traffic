"""Pydantic schema for processed section records per AGENTS.md section 6.1."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SectionRecord(BaseModel):
    """Schema for a legally coherent, individually citable retrieval unit."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(
        ..., description="Unique section unit identifier (e.g., MTA-1951-s112-1)"
    )
    act: str = Field(..., description="Title of the statute or regulatory instrument")
    instrument_type: Literal["act", "amendment", "gazette_regulation", "procedure"] = (
        Field(..., description="Type of legal instrument")
    )
    part: str | None = Field(
        default=None, description="Part identifier (e.g. 'Part VI')"
    )
    chapter: str | None = Field(
        default=None, description="Chapter identifier if applicable"
    )
    section: str = Field(
        ..., description="Section or regulation number string (e.g., '112', '2')"
    )
    subsection_path: str | None = Field(
        default=None, description="Subsection path (e.g., '(1)', '(1)(a)')"
    )
    citation: str = Field(
        ...,
        description="Exact legal citation string (e.g., 'Motor Traffic Act, Section 112(1)(a)')",
    )
    heading: str = Field(..., description="Short heading of the section or regulation")
    text: str = Field(
        ..., min_length=10, description="Full verbatim text of this retrieval unit"
    )
    parent_context: str = Field(
        ...,
        description="Heading and lead-in text giving standalone legal coherence to the unit",
    )
    definitions_used: list[str] = Field(
        default_factory=list,
        description="Defined statutory terms relied upon in this unit",
    )
    regulation_category: Literal[
        "noise",
        "fitness",
        "registration",
        "licensing",
        "offences",
        "procedure",
        "other",
    ] = Field(..., description="Domain category for metadata filtering")
    amendment_date: str | None = Field(
        default=None, description="YYYY-MM-DD amendment date or null"
    )
    gazette_no: str | None = Field(
        default=None, description="Gazette number (e.g., '1738/37')"
    )
    source_file: str = Field(
        ..., description="Relative path to raw source file in data/raw/"
    )
    source_url: str | None = Field(
        default=None, description="Source URL or authority database"
    )
    verified: bool = Field(
        default=True,
        description="Whether this record is verified against primary source",
    )
    verified_by_note: str | None = Field(
        default=None, description="Audit note recording verification method and date"
    )
    refers_to: list[str] = Field(
        default_factory=list, description="Cross-referenced section or regulation IDs"
    )

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("Record ID cannot be empty")
        return v_stripped

    @field_validator("citation")
    @classmethod
    def validate_citation(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("Citation cannot be empty")
        return v_stripped
