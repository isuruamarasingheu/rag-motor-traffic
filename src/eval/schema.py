"""Pydantic schema for evaluation questions per AGENTS.md section 6.2."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EvalQuestion(BaseModel):
    """Schema for a single evaluation question record."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Unique question identifier (e.g., Q001)")
    question: str = Field(..., min_length=5, description="Citizen natural language query")
    type: Literal["in_scope", "edge", "out_of_scope"] = Field(
        ..., description="Question domain category"
    )
    gold_sections: list[str] = Field(
        default_factory=list,
        description="Target legal section IDs; can contain 'TODO' prior to freezing",
    )
    expected_behavior: Literal[
        "answer_with_citation", "refuse", "say_not_found"
    ] = Field(..., description="Target system behavior")
    notes: str | None = Field(
        default="", description="Rationale, phrasing category, or test intent"
    )

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("Question ID cannot be empty")
        return v_stripped

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        v_stripped = v.strip()
        if len(v_stripped) < 5:
            raise ValueError("Question text must be at least 5 characters")
        return v_stripped
