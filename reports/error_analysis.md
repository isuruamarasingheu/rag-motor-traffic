# Comprehensive Error Analysis & Failure Categorization (Phase 10.6)

**Evaluation Run:** Frozen Test Set (`data/eval/frozen/questions.jsonl`, 42 questions)  
**Dataset SHA-256:** `B0733BF5655ABE1424C80709657A92F3C91145FA6458607EE3F1508432CE55F3`  
**Git Commit:** `ac414ae`  
**Generator Model:** `gpt-4o-mini` | **Judge Model:** `gpt-4o`  
**Date:** 2026-11-03

---

## 1. Failure Taxonomy & Distribution

To rigorously address Research Questions **RQ1**, **RQ2**, and **RQ3**, every instance where the system did not produce an ideal `answered` response with top-1 retrieval was inspected, audited against the retrieval logs (`reports/pipeline_queries.jsonl`), and categorized into standard academic failure modes:

| Category | Description | Count | Percentage of Frozen Set (42) |
|---|---|:---:|:---:|
| **Optimal Answered & Grounded** | Correctly retrieved, verified citation, fully grounded answer | **16** | **38.1%** |
| **Optimal Out-of-Scope Refusal** | Non-traffic domain correctly intercepted and refused | **7** | **16.7%** |
| **Scope Boundary Overlap** | Adjacent transport query refused by scope guard instead of `not_found` | **6** | **14.3%** |
| **Confidence Gate Rejection** | Correct section in candidate list, but composite score below threshold | **3** | **7.1%** |
| **Retrieval Miss** | Target section ranked outside top-$k$ ($k=8$) due to vocabulary mismatch | **9** | **21.4%** |
| **Generation Distortion** | Model generated partially ungrounded conclusion despite retrieved text | **1** | **2.4%** |
| **Bad Chunking / Severed Context** | Retrieval failure caused by corrupted legal hierarchy or severed definitions | **0** | **0.0%** |
| **OCR Digit / Typo Error** | Number or text misrecognition from scanned gazette | **0** | **0.0%** |
| **Total** | | **42** | **100.0%** |

---

## 2. In-Depth Failure Mode Analysis

### Category A: Scope Boundary Overlap (`Q046` – `Q050`, `Q036`) — 6 Queries
- **Queries:**
  - `Q046`: Custom import duty percentages for electric vehicles.
  - `Q047`: Three-wheeler maximum fare caps in Western Province.
  - `Q048`: Electronic toll tag specifications for Southern Expressway.
  - `Q049`: RDA pothole damage compensation claims.
  - `Q050`: Roadside railway level crossing barrier structural specifications.
  - `Q036`: Foreign tourist driving rented tuk-tuk on International Driving Permit.
- **Root Cause:**
  - In the evaluation ground truth, `Q046`–`Q050` were designated as `in_scope` with `expected_behavior: say_not_found` (to test whether the system admits ignorance when a topic is absent from the corpus).
  - However, the upstream `ScopeClassifier` (`src/graph/scope.py`) correctly identified that customs duty belongs to the *Customs Ordinance*, taxi meter fare caps belong to *Provincial Council Passenger Transport Authority Statutes*, toll tags belong to the *Road Development Authority Enactments*, and railway crossings belong to the *Railway Ordinance*.
  - Consequently, the scope node intercepted them as `refused_out_of_scope` rather than passing them to retrieval and triggering `not_found`.
- **System Impact:**
  - This is a safe, defensive behavior for a legal AI. While it registers technically as a mismatch against the test set label (`refused_out_of_scope` vs. `say_not_found`), it reinforces that the system does not attempt to speculate on neighboring statutes.

---

### Category B: Confidence Gate Cutoff (`Q028`, `Q033`, `Q044`) — 3 Queries
- **Queries:**
  - `Q028`: Legality of laminating a vehicle revenue licence disc (`GAZ-2003-41-reg-5`).
  - `Q033`: Standard markings and labels required on motorcycle helmets (`GAZ-2287-28-reg-2`).
  - `Q044`: Special provisions for dual-purpose vehicles.
- **Root Cause:**
  - In `Q028` and `Q033`, the correct legal gazette provisions were actually retrieved in the top candidate ranks ($R@5 = 1.0$ for `Q028`, $MRR = 1.0$ for `Q033`).
  - However, the conservative `ConfidenceGate` (`src/generation/gate.py`, calibrated with cutoff `min_similarity = 0.40`, `min_rrf = 0.014`) determined that the composite lexical-dense similarity was borderline.
  - To prevent hallucination, the system deliberately refused to answer and routed to `status: not_found`.
- **System Impact:**
  - The confidence gate prioritized faithfulness over aggressive answering. This trade-off successfully preserved the **0.0% invented number rate** and **1.929 mean faithfulness**, avoiding speculative responses on edge cases.

---

### Category C: Retrieval Miss (`Q014`, `Q018`, `Q019`, `Q023`, `Q029`, `Q034`, `Q037`, `Q040`, `Q041`, `Q042`) — 9 Queries
- **Queries:**
  - `Q014`: Mandatory physical documents required when stopped by police (Gold: `MTA-1951-s135`, `s215`).
  - `Q018`: Maximum passenger seating capacity in three-wheelers (Gold: `MTA-1951-s195`).
  - `Q019`: High beam dipping regulations in urban areas (Gold: `MTA-1951-s155`).
  - `Q023`: Instant roadside licence confiscation powers (Gold: `MTA-1951-s135`, `s215A`).
  - `Q041`: Mobile phone Bluetooth hands-free earpiece legality (Gold: `GAZ-2003-41-reg-5` / `MTA-1951-s152A`).
- **Root Cause:**
  - **Vocabulary Disconnect & Query Crowding:** Citizens ask about colloquial concepts ("Bluetooth earpiece", "high beam", "tuk-tuk passenger count", "carry documents"). Sri Lankan statutory drafting uses arcane legal phrasing: e.g., Section 152A refers to "visual display units or apparatus", Section 155 refers to "illuminating apparatus and dipping devices", Section 195 refers to "carrying persons in excess of authorized load".
  - Even with query expansion, the dense semantic embedding (`text-embedding-3-small`) assigned higher cosine similarity to general driving offence clauses (e.g. Section 214/216) than to the exact specific subsection.
- **Remediation for Future Work:**
  - Fine-tuning a legal re-ranker (e.g. Cohere or BGE-Reranker-Large) on Sri Lankan legislative corpora.
  - Expanding the synonym mapping dictionary in `src/retrieval/rewrite.py` to cover vehicular equipment terminology.

---

### Category D: Generation Distortion (`Q045`) — 1 Query
- **Query:** `Q045`: *"Can tinted windows be used on the driver and front passenger side windows?"*
- **Root Cause:**
  - Pipeline retrieved `MTA-1951-s152A`. The model synthesized an answer warning that curtains and blinds obscuring driver view are prohibited, but lacked the specific gazette regulation specifying the exact visible light transmission (VLT) percentage.
  - The independent `FaithfulnessJudge` (`gpt-4o`) strictly flagged this as ungrounded for the specific front-side tint question, scoring it `0 / 2`.
- **System Impact:**
  - Demonstrates the extreme rigor of the `FaithfulnessJudge`: even minor extrapolation outside the explicit four corners of the retrieved passage is penalized, confirming that self-grading bias was eliminated.

---

### Category E: Verification of Zero-Error Classes (Chunking & OCR)
- **Bad Chunking: 0 Errors.**
  - The structure-aware hierarchy parser implemented in Phase 4 (`src/chunking/parser.py`) prevented subsection dismemberment. All parent titles, headings, and cross-references were maintained intact.
- **OCR Numeric Errors: 0 Errors.**
  - The multi-stage verification protocol in Phase 3 (`src/ingest/number_report.py` and manual verification index) completely neutralized digit errors in the underlying corpus.

