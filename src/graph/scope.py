"""Scope classifier and refusal logic for the legal RAG assistant.

Enforces RQ3 boundaries: accepts questions regarding Sri Lanka's Motor Traffic
Act and subsidiary regulations, and cleanly refuses out-of-scope queries
(e.g., tenancy, labor, family, criminal penal code, taxation).
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI, OpenAIError

load_dotenv()

REFUSAL_MESSAGE = (
    "I am specialized exclusively in Sri Lanka's Motor Traffic Act No. 14 of 1951 "
    "and its subsidiary traffic regulations (including vehicle registration, driving "
    "licences, traffic police fines, speed limits, noise limits, and road safety). "
    "Your question falls outside this domain. I cannot answer queries concerning general civil, "
    "criminal, labor, property, or tenancy law."
)

SCOPE_SYSTEM_PROMPT = """You are a domain classifier for a legal information assistant specialized EXCLUSIVELY in Sri Lanka's Motor Traffic Act No. 14 of 1951 and its subsidiary traffic regulations.
Questions may be submitted in English, Sri Lankan Singlish, Sinhala script (සිංහල), or Tamil script (தமிழ்).

IN-SCOPE TOPICS:
- Sri Lankan motor traffic law, vehicle registration, and ownership transfers
- Driving licences, learner permits, driving schools, and medical certificates
- Road rules, traffic signs, police signals, highway conduct, and priority rules
- Traffic offences, spot fines, police summons, and court prosecution for driving offences
- Vehicle standards: noise/horns, emission tests, tinted glass, helmets, seat belts
- Accidents, duty of driver to stop and report, breathalyzer / drunk driving tests
- Vehicle seizure, impounding, or detention under motor traffic provisions

OUT-OF-SCOPE TOPICS:
- Rent, landlord/tenant disputes, property leases, eviction
- Employment, labor law, workplace disputes, wages, wrongful termination
- Divorce, child custody, inheritance, family law
- Criminal law unrelated to driving (theft, assault, homicide, penal code offences)
- Taxes, customs duty, general business or company law, contracts

Respond ONLY with a JSON object:
{
  "in_scope": true | false,
  "reason": "Brief explanation of why the question is or is not within motor traffic law"
}
"""

OUT_OF_SCOPE_KEYWORDS = [
    "tenant",
    "landlord",
    "rent",
    "eviction",
    "lease agreement",
    "employer",
    "employee",
    "resignation",
    "termination",
    "salary",
    "divorce",
    "custody",
    "alimony",
    "inheritance",
    "last will",
    "promissory note",
    "income tax",
    "vat",
    "customs clearance",
    "murder",
    "theft",
    "burglary",
]

IN_SCOPE_KEYWORDS = [
    "traffic",
    "motor",
    "vehicle",
    "car",
    "bike",
    "motorcycle",
    "van",
    "lorry",
    "bus",
    "driving",
    "driver",
    "licence",
    "license",
    "fine",
    "spot fine",
    "police",
    "speed",
    "horn",
    "silencer",
    "noise",
    "tinted",
    "windshield",
    "windscreen",
    "seat belt",
    "helmet",
    "breathalyser",
    "breathalyzer",
    "drunk driving",
    "accident",
    "registration",
    "revenue licence",
    "emission",
    "l plate",
    "oic",
    "impound",
]


@dataclass
class ScopeClassificationResult:
    """Result of domain scope classification."""

    in_scope: bool
    reason: str


class ScopeClassifier:
    """Classifies user queries as in-scope (Motor Traffic law) or out-of-scope."""

    def __init__(
        self,
        model: str = "gpt-4o-mini",
        client: Any | None = None,
        use_llm: bool = True,
    ) -> None:
        self.model = model
        self._client = client
        self.use_llm = use_llm

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            api_key = os.getenv("OPENAI_API_KEY")
            self._client = OpenAI(api_key=api_key)
        return self._client

    def _rule_based_check(self, query: str) -> ScopeClassificationResult:
        """Fast keyword-based domain heuristic."""
        q_lower = query.lower()

        # Check explicit out-of-scope terms first
        for kw in OUT_OF_SCOPE_KEYWORDS:
            if re.search(r"\b" + re.escape(kw) + r"\b", q_lower):
                return ScopeClassificationResult(
                    in_scope=False,
                    reason=f"Query matched out-of-scope domain keyword '{kw}'.",
                )

        # Check in-scope terms
        for kw in IN_SCOPE_KEYWORDS:
            if re.search(r"\b" + re.escape(kw) + r"\b", q_lower):
                return ScopeClassificationResult(
                    in_scope=True,
                    reason=f"Query matched motor traffic domain keyword '{kw}'.",
                )

        # Default to in-scope so ambiguity goes to retrieval & confidence gate
        return ScopeClassificationResult(
            in_scope=True,
            reason="Ambiguous query; defaulting to in-scope for retrieval confidence gating.",
        )

    def classify(self, query: str) -> ScopeClassificationResult:
        """Classify query into in-scope vs out-of-scope."""
        clean_query = query.strip()
        if not clean_query:
            return ScopeClassificationResult(
                in_scope=False,
                reason="Empty query.",
            )

        if not self.use_llm:
            return self._rule_based_check(clean_query)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                temperature=0.0,
                messages=[
                    {"role": "system", "content": SCOPE_SYSTEM_PROMPT},
                    {"role": "user", "content": clean_query},
                ],
            )
            raw_text = response.choices[0].message.content or ""
            # Strip markdown fences if present
            clean_text = re.sub(r"^```(?:json)?\s*", "", raw_text.strip())
            clean_text = re.sub(r"\s*```$", "", clean_text).strip()
            parsed = json.loads(clean_text)
            in_scope = bool(parsed.get("in_scope", True))
            reason = parsed.get("reason", "Classified via LLM.")
            return ScopeClassificationResult(in_scope=in_scope, reason=reason)
        except (OpenAIError, json.JSONDecodeError, KeyError, TypeError):
            # Fall back safely to rule-based classification if API fails
            return self._rule_based_check(clean_query)
