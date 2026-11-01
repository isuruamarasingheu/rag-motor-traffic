"""Grounded generator orchestrator.

Calls the LLM with strict grounded prompt, parses the structured output,
verifies citations and numeric values, and produces the final API response.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI, OpenAIError

from src.generation.prompts import (
    GROUNDED_SYSTEM_PROMPT,
    render_user_prompt,
)
from src.generation.verifier import CitationVerifier

load_dotenv()

LEGAL_DISCLAIMER = (
    "This is legal information, not legal advice. For formal legal proceedings, "
    "consult a qualified attorney-at-law or relevant statutory authority."
)


def extract_json_from_response(raw_text: str) -> dict[str, Any]:
    """Extract and parse JSON object from LLM response text."""
    clean_text = raw_text.strip()
    # Strip markdown fences if present
    if clean_text.startswith("```"):
        clean_text = re.sub(r"^```(?:json)?\s*", "", clean_text)
        clean_text = re.sub(r"\s*```$", "", clean_text)
        clean_text = clean_text.strip()

    try:
        return json.loads(clean_text)
    except json.JSONDecodeError:
        # Search for first { ... } block
        match = re.search(r"\{.*\}", clean_text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


class GroundedGenerator:
    """Generates strictly grounded legal answers with citation verification."""

    def __init__(
        self,
        model: str = "gpt-4o-mini",
        temperature: float = 0.0,
        client: Any | None = None,
        verifier: CitationVerifier | None = None,
    ) -> None:
        self.model = model
        self.temperature = temperature
        self._client = client
        self.verifier = verifier or CitationVerifier()

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            api_key = os.getenv("OPENAI_API_KEY")
            self._client = OpenAI(api_key=api_key)
        return self._client

    def _call_llm(self, messages: list[dict[str, str]]) -> str:
        """Execute chat completion with configured model."""
        response = self.client.chat.completions.create(
            model=self.model,
            temperature=self.temperature,
            messages=messages,
        )
        return response.choices[0].message.content or ""

    def generate(
        self,
        question: str,
        retrieved_hits: list[dict[str, Any]],
        max_retries: int = 1,
    ) -> dict[str, Any]:
        """Generate a grounded, cited answer from retrieved statutory sections.

        Returns API contract matching AGENTS.md §6.3:
        {
            "status": "answered" | "not_found",
            "answer": str | None,
            "citations": list[dict],
            "disclaimer": str
        }
        """
        if not retrieved_hits:
            return {
                "status": "not_found",
                "answer": "No relevant legal provisions were retrieved to answer your question.",
                "citations": [],
                "disclaimer": LEGAL_DISCLAIMER,
            }

        user_prompt = render_user_prompt(question, retrieved_hits)
        messages = [
            {"role": "system", "content": GROUNDED_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]

        attempt = 0
        while attempt <= max_retries:
            attempt += 1
            try:
                raw_output = self._call_llm(messages)
                parsed = extract_json_from_response(raw_output)
            except (
                OpenAIError,
                json.JSONDecodeError,
                ValueError,
                KeyError,
                TypeError,
                RuntimeError,
            ) as e:
                if attempt > max_retries:
                    return {
                        "status": "not_found",
                        "answer": f"Could not parse valid response from generator ({e}).",
                        "citations": [],
                        "disclaimer": LEGAL_DISCLAIMER,
                    }
                continue

            status = parsed.get("status", "not_found")
            answer = parsed.get("answer")
            cited_ids = parsed.get("cited_section_ids", [])

            if status != "answered" or not answer:
                return {
                    "status": "not_found",
                    "answer": answer
                    or "The retrieved statutory provisions do not contain this information.",
                    "citations": [],
                    "disclaimer": LEGAL_DISCLAIMER,
                }

            # Verify citations & numbers
            verification = self.verifier.verify(
                answer_text=answer,
                cited_ids=cited_ids,
                retrieved_hits=retrieved_hits,
            )

            if verification.is_valid:
                return {
                    "status": "answered",
                    "answer": answer,
                    "citations": verification.valid_citations,
                    "disclaimer": LEGAL_DISCLAIMER,
                }

            # Verification failed: prepare retry feedback if retries remain
            if attempt <= max_retries:
                valid_retrieved_ids = [
                    hit["id"] for hit in retrieved_hits if "id" in hit
                ]
                retry_feedback = (
                    f"Previous output failed verification: {verification.error_message}. "
                    f"You may ONLY cite valid IDs from the retrieved set: {valid_retrieved_ids}. "
                    "Ensure all numeric facts are directly quoted from the text."
                )
                messages.append({"role": "assistant", "content": raw_output})
                messages.append({"role": "user", "content": retry_feedback})

        # Fallback if retry verification fails
        return {
            "status": "not_found",
            "answer": "Could not verify citations against the official statutory corpus.",
            "citations": [],
            "disclaimer": LEGAL_DISCLAIMER,
        }
