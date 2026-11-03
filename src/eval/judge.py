"""LLM-as-a-Judge for legal RAG faithfulness evaluation.

Evaluates generated legal answers against retrieved statutory text snippets
per data/eval/FAITHFULNESS_RUBRIC.md and AGENTS.md §3 (using an independent model family).
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("eval.judge")

JUDGE_SYSTEM_PROMPT = """You are an impartial, highly rigorous legal auditor evaluating the faithfulness and citation grounding of an AI legal assistant specialized in Sri Lanka's Motor Traffic Act.

Your task is to audit the provided [GENERATED_ANSWER] against the provided [RETRIEVED_PASSAGES] for the citizen's [QUESTION].

### EVALUATION RULES:
1. FAITHFULNESS SCORE (0 - 2):
   - Score 2 (Fully Grounded): Every factual and legal claim in the answer is explicitly supported by the retrieved passages. The cited sections match the supporting text.
   - Score 1 (Partially Grounded): The core legal rule is supported, but there are minor peripheral remarks or lay generalities not directly in the text, or an imprecise parent section citation (e.g. citing Section 123 instead of Section 123(1)(a)).
   - Score 0 (Ungrounded / Hallucinated): The answer makes legal claims contradicting the text, invents non-existent statutory rules, cites completely irrelevant sections, or invents any numerical figure.

2. INVENTED NUMBER ZERO-TOLERANCE RULE:
   - Check EVERY numerical figure in the answer (rupee fines, speed limits in km/h, noise decibels dB(A), days to appeal, age requirements).
   - If ANY number appears in the answer that is NOT present in the retrieved passages (either verbatim or through direct statutory arithmetic), you MUST:
     a) Set "invented_number": true
     b) Set "faithfulness_score": 0

3. CITATION ACCURACY:
   - "EXACT": Citations reference the exact section/subsection supporting the statement.
   - "PARENT": Citation references the parent section instead of specific subsection.
   - "WRONG": Citation does not contain or support the claim.
   - "N/A": The question was refused (out-of-scope) or no citation was expected.

4. REFUSAL LOGIC:
   - If the system refused with status 'refused_out_of_scope' for an out-of-scope question, or 'not_found' for an unanswerable question, this is faithful if it does not fabricate legal advice. Score 2 if the refusal is polite and makes no false claims.

OUTPUT FORMAT:
You must output a single valid JSON object with NO extra markdown formatting or conversational wrapper:
{
  "faithfulness_score": 0 | 1 | 2,
  "invented_number": true | false,
  "citation_accuracy": "EXACT" | "PARENT" | "WRONG" | "N/A",
  "unsupported_claims": ["list of any unsupported claims or empty list if fully supported"],
  "reasoning": "Concise step-by-step audit comparing claims against the retrieved passages."
}
"""


class FaithfulnessJudge:
    """Evaluates RAG answer faithfulness using an independent LLM judge with disk caching."""

    def __init__(
        self,
        model: str | None = None,
        cache_path: Path | str = "data/eval/judge_cache.json",
    ) -> None:
        self.model = model or os.getenv("JUDGE_MODEL", "gpt-4o")
        self.cache_path = Path(cache_path)
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        self._cache: dict[str, dict[str, Any]] = self._load_cache()

    def _load_cache(self) -> dict[str, dict[str, Any]]:
        if self.cache_path.exists():
            try:
                with open(self.cache_path, encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, OSError) as e:
                logger.warning("Could not read judge cache (%s), starting fresh.", e)
        return {}

    def _save_cache(self) -> None:
        try:
            with open(self.cache_path, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, indent=2, ensure_ascii=False)
        except OSError as e:
            logger.warning("Could not save judge cache: %s", e)

    def _compute_hash(self, question: str, retrieved: str, answer: str, citations: str) -> str:
        content = f"{self.model}||{question.strip()}||{retrieved.strip()}||{answer.strip()}||{citations.strip()}"
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def evaluate(
        self,
        question: str,
        retrieved_passages: str,
        answer: str,
        citations: str = "",
        status: str = "answered",
    ) -> dict[str, Any]:
        """Audit an answer and return faithfulness score and details."""
        cache_key = self._compute_hash(question, retrieved_passages, answer, citations)
        if cache_key in self._cache:
            logger.debug("Cache hit for judge evaluation: %s", cache_key[:10])
            return self._cache[cache_key]

        user_content = (
            f"[QUESTION]:\n{question}\n\n"
            f"[PIPELINE_STATUS]:\n{status}\n\n"
            f"[CITATIONS]:\n{citations or 'None'}\n\n"
            f"[RETRIEVED_PASSAGES]:\n{retrieved_passages}\n\n"
            f"[GENERATED_ANSWER]:\n{answer}\n"
        )

        raw_response = self._call_llm(user_content)
        parsed = self._parse_judge_response(raw_response)

        # Enforce zero tolerance: if invented_number is True, score must be 0
        if parsed.get("invented_number"):
            parsed["faithfulness_score"] = 0

        self._cache[cache_key] = parsed
        self._save_cache()
        return parsed

    def _call_llm(self, prompt: str) -> str:
        """Call the appropriate LLM provider depending on model configuration."""
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        # 1. Anthropic Claude provider
        if "claude" in self.model.lower() and anthropic_key:
            import httpx
            headers = {
                "x-api-key": anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }
            payload = {
                "model": self.model,
                "max_tokens": 1000,
                "temperature": 0.0,
                "system": JUDGE_SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": prompt}],
            }
            res = httpx.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload, timeout=60.0)
            res.raise_for_status()
            data = res.json()
            return data["content"][0]["text"]

        # 2. Google Gemini provider
        if "gemini" in self.model.lower() and gemini_key:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": f"{JUDGE_SYSTEM_PROMPT}\n\n{prompt}"}]}],
                "generationConfig": {
                    "temperature": 0.0,
                    "responseMimeType": "application/json",
                },
            }
            res = httpx.post(url, json=payload, timeout=60.0)
            res.raise_for_status()
            data = res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

        # 3. OpenAI provider (default fallback, e.g. gpt-4o independent from generator gpt-4o-mini)
        if openai_key:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": JUDGE_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
                response_format={"type": "json_object"},
            )
            return response.choices[0].message.content or "{}"

        raise RuntimeError(
            "No valid API key found for judge model. Please set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY."
        )

    @staticmethod
    def _parse_judge_response(raw_text: str) -> dict[str, Any]:
        """Extract and validate JSON from model output."""
        cleaned = raw_text.strip()
        cleaned = cleaned.removeprefix("```json")
        cleaned = cleaned.removeprefix("```")
        cleaned = cleaned.removesuffix("```")
        cleaned = cleaned.strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error("Failed to parse judge JSON: %s\nRaw output: %s", e, raw_text)
            return {
                "faithfulness_score": 0,
                "invented_number": False,
                "citation_accuracy": "WRONG",
                "unsupported_claims": ["Judge JSON parse failure"],
                "reasoning": f"Parsing error: {e}",
            }

        score = data.get("faithfulness_score", 0)
        if score not in (0, 1, 2):
            try:
                score = int(score)
                score = max(0, min(2, score))
            except (ValueError, TypeError):
                score = 0

        return {
            "faithfulness_score": score,
            "invented_number": bool(data.get("invented_number", False)),
            "citation_accuracy": str(data.get("citation_accuracy", "WRONG")),
            "unsupported_claims": list(data.get("unsupported_claims", [])),
            "reasoning": str(data.get("reasoning", "")),
        }
