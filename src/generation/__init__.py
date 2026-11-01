"""Generation module for citation-grounded answer generation, verification, and confidence gating."""

from src.generation.gate import ConfidenceGate
from src.generation.generator import LEGAL_DISCLAIMER, GroundedGenerator
from src.generation.prompts import (
    GROUNDED_SYSTEM_PROMPT,
    PROMPT_VERSION,
    build_generation_context,
    render_user_prompt,
)
from src.generation.verifier import CitationVerificationResult, CitationVerifier

__all__ = [
    "GROUNDED_SYSTEM_PROMPT",
    "LEGAL_DISCLAIMER",
    "PROMPT_VERSION",
    "CitationVerificationResult",
    "CitationVerifier",
    "ConfidenceGate",
    "GroundedGenerator",
    "build_generation_context",
    "render_user_prompt",
]
