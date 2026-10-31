# Evaluation Rubric: Sri Lanka Motor Traffic Law RAG

This document defines the evaluation framework for the citation-grounded legal assistant for Sri Lanka's **Motor Traffic Act No. 14 of 1951**, its amendments, and subsidiary gazette regulations.

---

## 1. Research Objectives Alignment

The evaluation directly measures the three central Research Questions (RQ):
- **RQ1 (Retrieval Accuracy)**: Can RAG retrieve the correct section(s) for lay citizen queries?
  - Metrics: Precision@k, Recall@k ($k \in \{1, 3, 5\}$), Mean Reciprocal Rank (MRR).
- **RQ2 (Faithfulness & Hallucination Reduction)**: Does strict grounding eliminate hallucination compared to ungrounded LLMs?
  - Metrics: Faithfulness score ($0, 1, 2$), presence of invented numbers/penalties/dates.
- **RQ3 (Scope Restriction & Refusal)**: Can the system accurately distinguish in-scope from out-of-scope questions and refuse appropriately?
  - Metrics: Scope-restriction rate (correct refusal rate on out-of-scope) and false-refusal rate on in-scope queries.

---

## 2. Question Types (`type`)

Each evaluation question in `data/eval/*/questions.jsonl` must be classified into one of three mutually exclusive categories:

| Type | Definition | Inclusion Criteria | Examples |
|---|---|---|---|
| **`in_scope`** | Clear citizen queries strictly governed by Sri Lanka's Motor Traffic Act (MTA), amendments, or subsidiary gazettes. | Questions on vehicle registration, licensing, fitness certificates, noise/emission limits, speed limits, helmet/seat-belt rules, traffic signs, spot fines, and appeal procedures. | "What is the legal decibel limit for a motorcycle silencer?", "Can I drive on a learner permit without an instructor?" |
| **`edge`** | Questions that border motor traffic law or involve legal intersections, ambiguous phrasing, or multi-section provisions. | Accident liability questions that cross into Penal Code vs MTA reckless driving; questions where statutory terms and popular terminology conflict; multi-part questions requiring provisions from both the Act and a gazette. | "If a drunk driver damages my garden wall, what does traffic law say about reporting the accident?", "Is a three-wheeler allowed on the Southern Expressway?" |
| **`out_of_scope`** | Questions completely outside the statutory domain of Sri Lanka's Motor Traffic Law. | Other legal domains (Penal Code theft, contract law, family law), general knowledge, non-Sri Lankan law, or unrelated technical questions. | "How do I register a deed for land?", "What is the penalty for theft under Sri Lankan law?", "How do I fix a flat tyre?" |

---

## 3. Expected System Behaviors (`expected_behavior`)

| Expected Behavior | Applicable To | Target System Action | Success Criterion |
|---|---|---|---|
| **`answer_with_citation`** | `in_scope`, `edge` (where provisions exist) | Retrieve relevant section(s), generate a plain-English explanation derived solely from the retrieved text, cite the exact section ID(s). | Answer is 100% grounded in retrieved text, cites at least one valid section ID from `gold_sections`, includes mandatory legal disclaimer. |
| **`refuse`** | `out_of_scope` | Detect out-of-scope query at the `scope_check` node, refuse politely, and state the boundary of the assistant. | System does not retrieve from the legal corpus, outputs status `refused_out_of_scope`, returns no fabricated legal advice. |
| **`say_not_found`** | `in_scope`, `edge` (absent from corpus) | Triggered when query is legally in-domain, but the specific answer is not contained in the indexed Act or gazette provisions. | System confidence gate fails or LLM identifies retrieval insufficiency; status `not_found`, no hallucinated rules or numbers. |

---

## 4. Ground Truth Labeling (`gold_sections`)

1. **Section ID Format**:
   - Primary Act: `MTA-1951-s{section}` (e.g., `MTA-1951-s112`, `MTA-1951-s151-1`)
   - Gazette Regulations: `GAZ-{gazette_no}-reg-{regulation_no}` (e.g., `GAZ-1738-37-reg-2`)
   - Procedural Guidelines: `PROC-{code}-{step}` (e.g., `PROC-FINE-PAY-s3`)

2. **Multi-Section Gold Sets**:
   - When a complete answer strictly requires both a principal Act section and a gazette regulation (e.g., Act establishes power/offence, gazette specifies the numerical threshold), both IDs are listed in `gold_sections`.
   - Recall@k checks what fraction of `gold_sections` are retrieved in top-$k$.

3. **Status During Phase 1**:
   - While questions are drafted in Phase 1 before the parsed corpus is indexed, `gold_sections` may be marked as `["TODO"]` or with provisional section numbers, to be frozen with exact corpus IDs in Phase 3.4.

---

## 5. Answer Faithfulness Scoring Rubric (0 – 2 Scale)

For assessing generated answers (RQ2):

| Score | Meaning | Operational Definition |
|---|---|---|
| **2 (Fully Grounded)** | Complete Faithfulness | Every factual claim in the answer is directly supported by the retrieved text snippet. Every cited section corresponds to the snippet supporting it. No extraneous numbers or conditions. |
| **1 (Partially Grounded)** | Minor Hallucination or Imprecision | The main answer is accurate and supported, but contains minor ungrounded elaboration (e.g., common knowledge phrasing not in text) or cites a parent section rather than the exact subsection. |
| **0 (Ungrounded / Hallucinated)** | Severe Distortion or Hallucination | The answer contradicts the retrieved text, states a fine amount/decibel limit/speed limit not present in the retrieved text, cites an unrelated section, or invents a non-existent legal rule. |

### Critical Flag: `invented_number`
- If **any** number (fine amount in Rs., decibel limit in dB(A), speed in km/h, days to appeal, age requirement) appears in the generated answer that is **not present verbatim** in the retrieved text, the answer receives an immediate score of **0** and is flagged `invented_number: true`.

---

## 6. Phrasing Diversity Requirements for Dataset Construction

To ensure the benchmark tests real citizen interaction, the question set must include:
1. **Plain Language**: Everyday terms (e.g., "exhaust is too loud", "renew my vehicle revenue licence").
2. **Incorrect / Confused Legal Terminology**: Lay misconceptions (e.g., calling registration "ownership book" or "CR book", confusing suspension with cancellation).
3. **Multi-hop / Compound Queries**: Requiring two distinct sections (e.g., fine amount + time period to pay without court summons).
4. **Distractor Queries**: Out-of-scope questions that mention vehicles or roads but are governed by different laws (e.g., "Can the police search my car trunk for stolen goods?", governed by Criminal Procedure Code, not MTA).

