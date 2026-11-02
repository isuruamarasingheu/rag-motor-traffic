"""Query rewriting and expansion module bridging citizen language to Sri Lankan statutory phrasing."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

COLLOQUIAL_LEGAL_MAPPINGS: dict[str, str] = {
    "car book": "certificate of registration vehicle ownership",
    "driving book": "driving licence",
    "license book": "driving licence",
    "musical horn": "horn emitting harsh shrill or musical sound multi-tone horn noise",
    "dual-tone air horn": "multi-tone air horn noise level decibel sound pressure",
    "air horn": "multi-tone horn sound pressure level",
    "tinted glass": "tinted windshield windscreen light transmission safety glass",
    "tinted windshield": "tinted windscreen glass light transmission percentage",
    "breathalyser": "breath test blood alcohol concentration intoxicating liquor driving under influence",
    "drunk driving": "driving under the influence of intoxicating liquor alcohol breath analysis",
    "impound": "detention seizure of motor vehicle police powers",
    "spot fine": "traffic spot fine payment at post office penalty notice",
    "l plates": "learner driver driving instructor instruction permit",
    "learner driver": "holder of learner permit accompanied by licensed instructor",
    "emission test": "vehicular exhaust emission certificate fitness",
    "child safety": "safety belts child passenger restraints restraint system",
    "child passengers": "child safety restraints seat belts private passenger car",
    "child passenger": "child safety restraints seat belts private passenger car",
    "tinted front windshields": "tinted windscreen safety glass light transmission percentage",
    "tinted front windshield": "tinted windscreen safety glass light transmission percentage",
    "traffic light": "light signals traffic light police officer signal priority precedence",
    "accident": "accident driver duty to stop vehicle report to police",
    "unregistered": "unregistered motor vehicle possession use highway section 2",
    "unlicensed": "driving without driving licence owner liability permitting unlicensed person",
    "wrong traffic fine": "spot fine dispute contest police OIC court prosecution",
    "auto gear": "automatic transmission vehicle class endorsement driving licence",
    "take my car": "detention seizure of motor vehicle police powers section 232F",
    "take car": "detention of motor vehicle police powers section 232F",
    "taking my car": "detain motor vehicle police powers section 232F",
    "seize car": "detain motor vehicle police powers section 232F",
    "seize my car": "detention seizure of motor vehicle police powers section 232F",
    "seize vehicle": "power of police officer or examiner to detain vehicle section 232F",
    "impound car": "detention of motor vehicle police station section 232F",
    "impounding": "detention of motor vehicle police powers section 232F",
    "unpaid fine": "spot fine non payment court proceedings section 215A liability of offender driver",
    "unpaid spot fine": "fine penalty notice non payment court proceedings section 215A",
    "bought a second-hand car": "transfer of motor vehicle change of possession section 12",
    "second-hand car": "transfer of ownership change of possession section 12",
}

REWRITE_SYSTEM_PROMPT = """You are a legal query rewriter for Sri Lanka's Motor Traffic Act and traffic regulations.
A citizen has asked a plain-language question using colloquial or everyday terms.
Your job is to reformulate and expand the query into statutory legal phrasing used in Sri Lankan legislation, while keeping the user's core intent.

Rules:
1. Translate colloquial terms (e.g., 'car book' -> 'certificate of registration', 'driving book' -> 'driving licence', 'musical horn' -> 'harsh or musical sound horn', 'spot fine' -> 'fine penalty notice', 'drunk driving' -> 'driving under influence of intoxicating liquor').
2. When a citizen asks about police seizing, taking, or detaining a vehicle, include statutory terms for Section 232F (powers of police officer or examiner to detain vehicle) and the lawful grounds for detention.
3. When a query involves unpaid fines from a prior owner or seller, include terms for spot fine liability of the offender under Section 215A and ownership transfer under Section 12.
4. Keep the output concise: 1 to 2 sentences containing the essential statutory legal terms.
5. Output ONLY the rewritten search query, nothing else."""


@dataclass
class QueryRewriteResult:
    original_query: str
    rewritten_query: str
    expanded_terms: list[str]


class QueryRewriter:
    """Expands lay citizen queries with statutory legal terminology."""

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

    def _rule_based_expand(self, query: str) -> tuple[str, list[str]]:
        """Apply deterministic legal synonym expansions."""
        query_lower = query.lower()
        expanded_terms = []
        additions = []

        for colloquial, legal_terms in COLLOQUIAL_LEGAL_MAPPINGS.items():
            if colloquial in query_lower:
                expanded_terms.append(colloquial)
                additions.append(legal_terms)

        if additions:
            augmented = f"{query} {' '.join(additions)}"
            return augmented, expanded_terms
        return query, []

    def rewrite(self, query: str) -> QueryRewriteResult:
        """Rewrite and expand query using LLM with rule-based fallback."""
        clean_query = query.strip()
        if not clean_query:
            return QueryRewriteResult(
                original_query="", rewritten_query="", expanded_terms=[]
            )

        rule_expanded, matched_terms = self._rule_based_expand(clean_query)

        if not self.use_llm:
            return QueryRewriteResult(
                original_query=clean_query,
                rewritten_query=rule_expanded,
                expanded_terms=matched_terms,
            )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": REWRITE_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Citizen query: {clean_query}"},
                ],
                temperature=0.0,
                max_tokens=150,
            )
            llm_rewritten = response.choices[0].message.content.strip()
            # Combine LLM rewrite with original query keywords for high recall
            final_rewritten = f"{clean_query} {llm_rewritten}"
            return QueryRewriteResult(
                original_query=clean_query,
                rewritten_query=final_rewritten,
                expanded_terms=matched_terms,
            )
        except Exception:  # noqa: BLE001
            # Fall back safely to rule-based expansion
            return QueryRewriteResult(
                original_query=clean_query,
                rewritten_query=rule_expanded,
                expanded_terms=matched_terms,
            )
