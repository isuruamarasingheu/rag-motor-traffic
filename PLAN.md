# PLAN.md - Build plan (phases in order, no dates)

Rules for using this file:
- Work **one task at a time**, in order. Tick a box only when its **Done when** check passes.
- Whoever changes something adds a line to **NOTES** at the bottom (what, who, date).
- Planner/reviewer mode (Claude model in Antigravity) edits the plan; builder mode (Gemini model) ticks tasks after the checks pass.

---

## Phase 0 - Project setup
- [x] **0.1 Repo scaffold** per `AGENTS.md` section 4; `requirements.txt`, `.gitignore` (include `.env`, `data/interim/`, Chroma folder), `.env.example`, `configs/base.yaml`.
  *Done when:* `pytest -q` runs (even with one placeholder test) and `ruff check .` is clean.
- [x] **0.2 Git initialised** with a first commit.
  *Done when:* `git log` shows the commit; `.env` is not tracked.
- [x] **0.3 Skills installed** for both tools (see `README.md`).
  *Done when:* each tool can list or describe the three skills.

## Phase 1 - Evaluation set FIRST (before building the system)
- [ ] **1.1 Define question types and a labelling rubric** (in-scope, edge, out-of-scope; what counts as a correct gold section).
  *Done when:* `data/eval/RUBRIC.md` exists and the user approved it.
- [ ] **1.2 Draft 50-80 realistic citizen questions** (user writes/approves; AI may suggest phrasing styles only). Include: plain-language phrasing, wrong-terminology phrasing, multi-section questions, deliberately out-of-scope questions (other laws, general knowledge), and questions whose answer is not in the corpus.
  *Done when:* `data/eval/dev/questions.jsonl` validates against the schema (6.2) with `gold_sections` left as `TODO` where the corpus does not yet exist.
- [ ] **1.3 Split into dev and frozen** (suggest ~30% dev / ~70% frozen, stratified by type). Freeze after gold labels are filled in Phase 3.
  *Done when:* split script exists and is deterministic (fixed seed).

## Phase 2 - Data collection
- [ ] **2.1 Collect Act text** (consolidated Motor Traffic Act + amendments) from official sources; cross-check two sources; record in `data/raw/SOURCES.md` (url, date accessed, notes).
  *Done when:* raw files exist and `SOURCES.md` lists each one.
- [ ] **2.2 Collect relevant gazette regulations** (noise emission, fitness, registration, fine/appeal procedures).
  *Done when:* PDFs in `data/raw/` and listed in `SOURCES.md` with gazette numbers.
- [ ] **2.3 Collect procedural info** (fine payment, appeals) from the Department of Motor Traffic / Police public resources.
  *Done when:* listed in `SOURCES.md`.

## Phase 3 - OCR, cleaning, verification
- [ ] **3.1 Text extraction pipeline** for machine-readable files; OCR for scanned gazettes (output goes to `data/interim/`).
  *Done when:* each raw file has an interim text output and a log.
- [ ] **3.2 Number extraction report** using skill `ocr-number-check`: every number, unit, date and section reference listed with page and image crop reference.
  *Done when:* report generated for each OCR'd document.
- [ ] **3.3 Manual verification by the user** of all flagged numbers against the scans.
  *Done when:* each verified item is marked in the report and the interim text is corrected by a human decision, not by guessing.
- [ ] **3.4 Gold labels for the eval set** filled using verified corpus ids; **freeze** `data/eval/frozen/` (make files read-only; record checksum in `NOTES`).
  *Done when:* no `TODO` remains in frozen gold labels and checksum is recorded.

## Phase 4 - Structure-aware chunking
- [ ] **4.1 Parser** from verified text to hierarchy (Act -> Part -> Chapter -> Section -> Subsection) using skill `statute-chunking`.
  *Done when:* section count matches a manual count of the source for at least 3 sampled parts.
- [ ] **4.2 Section records** per the schema (6.1) with `parent_context`, `citation`, `definitions_used`, and metadata.
  *Done when:* `data/processed/sections.jsonl` validates; every record has `citation` and `source_file`.
- [ ] **4.3 Definitions handling** (interpretation section): link terms to definitions so a retrieved unit can include the definitions it relies on.
  *Done when:* a test shows a unit using a defined term gets its definition attached.
- [ ] **4.4 Chunking tests**: no subsection separated from its parent context; no empty `text`; ids unique.
  *Done when:* tests pass.

## Phase 5 - Indexing
- [ ] **5.1 Embedding script** (`text-embedding-3-small`) with caching so re-runs do not re-pay for unchanged sections.
  *Done when:* second run makes zero API calls for unchanged records.
- [ ] **5.2 Chroma collection** with metadata (act, section, instrument_type, regulation_category, amendment_date).
  *Done when:* a query by id returns the right record and metadata filters work.
- [ ] **5.3 BM25 index** over the same units.
  *Done when:* an exact section-number query ranks that section first.

## Phase 6 - Retrieval + evaluation harness (together)
- [ ] **6.1 Dense retrieval** returning top-k with scores.
- [ ] **6.2 Hybrid retrieval** (dense + BM25 fusion, e.g. reciprocal rank fusion).
- [ ] **6.3 Query rewriting/expansion** for lay-to-statute vocabulary (keep original query too).
- [ ] **6.4 Eval harness** using skill `rag-eval`: precision@k, recall@k, MRR on the **dev** set; results saved to `reports/`.
  *Done when (6.1-6.4):* one command prints metrics for dense / BM25 / hybrid / hybrid+rewrite on dev, and results are saved.
- [ ] **6.5 Small index-type comparison** (brute-force exact search vs Chroma's approximate index) for exactness and latency. Keep it small; this is a minor contribution at this corpus size.
  *Done when:* a short table exists in `reports/`.

## Phase 7 - Grounded generation
- [ ] **7.1 Grounded prompt** (answer only from provided text, plain language, cite section ids, quote key clause, say not found otherwise).
  *Done when:* prompt is in `src/generation/prompts.py` with a version number.
- [ ] **7.2 Citation verifier**: every citation id exists in the corpus and in the retrieved set.
  *Done when:* unit tests cover valid, invented, and not-retrieved citations.
- [ ] **7.3 Confidence gate** with threshold tuned on **dev** set only.
  *Done when:* threshold is in `configs/base.yaml` with a note on how it was chosen.

## Phase 8 - LangGraph pipeline and refusal
- [ ] **8.1 Scope classifier node** and refusal path.
- [ ] **8.2 Full graph**: scope -> retrieve -> gate -> generate -> verify -> respond.
  *Done when:* an integration test runs one in-scope, one out-of-scope, one not-in-corpus question and produces the three expected `status` values.
- [ ] **8.3 Logging** of query, rewritten query, retrieved ids/scores, status (for error analysis).

## Phase 9 - API and frontend
- [ ] **9.1 FastAPI endpoint** returning the contract in 6.3, with input validation and error handling.
- [ ] **9.2 React + Tailwind UI**: question box, answer, citations with the verbatim source text, visible disclaimer, clear refusal message.
  *Done when:* a user can ask a question in the browser and see answer + cited text; refusal looks different from an answer.

## Phase 10 - Full evaluation and benchmark
- [ ] **10.1 Faithfulness rubric** written; human scoring sheet generated for a sample.
- [ ] **10.2 LLM-as-judge** using a **different model family** from the generator; compare to human scores on the same sample.
- [ ] **10.3 Peer rating** of a subset (second rater) and agreement statistic (e.g. Cohen's kappa).
- [ ] **10.4 Final run on the frozen set** for: proposed system, ungrounded baseline (same LLM, no retrieval).
- [ ] **10.5 Existing tools** (LankaLAW AI Assistant, Aythiya) tested manually on the same questions, outputs saved as evidence. Compare on faithfulness and scope-refusal only; retrieval metrics are not measurable for black-box tools.
- [ ] **10.6 Error analysis**: categorise failures (retrieval miss, bad chunking, OCR error, generation distortion, gate threshold, scope misclassification).
  *Done when (10.x):* `reports/` has final tables and an error-analysis file.

---

## Decisions log
| Decision | Choice | Reason |
|---|---|---|
| Language | English only | Scope boundary from the proposal |
| Chunking | Structure-aware, not fixed-size | Preserve citation accuracy |
| Judge model | Different family from generator | Avoid self-grading bias |

## NOTES (append-only: who, what, when)
- 2026-10-31: Task 0.1 completed by Builder mode. Scaffolded repo directories, requirements.txt, .gitignore, .env.example, configs/base.yaml, placeholder test. pytest -q passed, ruff check clean.
- 2026-10-31: Tasks 0.2 and 0.3 completed by Builder mode. Git initialized and root commit created with .env untracked; skills (statute-chunking, ocr-number-check, rag-eval) confirmed available. Phase 0 complete.
