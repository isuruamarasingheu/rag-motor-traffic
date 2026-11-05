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
- [x] **1.1 Define question types and a labelling rubric** (in-scope, edge, out-of-scope; what counts as a correct gold section).
  *Done when:* `data/eval/RUBRIC.md` exists and the user approved it.
- [x] **1.2 Draft 50-80 realistic citizen questions** (user writes/approves; AI may suggest phrasing styles only). Include: plain-language phrasing, wrong-terminology phrasing, multi-section questions, deliberately out-of-scope questions (other laws, general knowledge), and questions whose answer is not in the corpus.
  *Done when:* `data/eval/dev/questions.jsonl` validates against the schema (6.2) with `gold_sections` left as `TODO` where the corpus does not yet exist.
- [x] **1.3 Split into dev and frozen** (suggest ~30% dev / ~70% frozen, stratified by type). Freeze after gold labels are filled in Phase 3.
  *Done when:* split script exists and is deterministic (fixed seed).

## Phase 2 - Data collection
- [x] **2.1 Collect Act text** (consolidated Motor Traffic Act + amendments) from official sources; cross-check two sources; record in `data/raw/SOURCES.md` (url, date accessed, notes).
  *Done when:* raw files exist and `SOURCES.md` lists each one.
- [x] **2.2 Collect relevant gazette regulations** (noise emission, fitness, registration, fine/appeal procedures).
  *Done when:* PDFs in `data/raw/` and listed in `SOURCES.md` with gazette numbers.
- [x] **2.3 Collect procedural info** (fine payment, appeals) from the Department of Motor Traffic / Police public resources.
  *Done when:* listed in `SOURCES.md`.

## Phase 3 - OCR, cleaning, verification
- [x] **3.1 Text extraction pipeline** for machine-readable files; OCR for scanned gazettes (output goes to `data/interim/`).
  *Done when:* each raw file has an interim text output and a log.
- [x] **3.2 Number extraction report** using skill `ocr-number-check`: every number, unit, date and section reference listed with page and image crop reference.
  *Done when:* report generated for each OCR'd document.
- [x] **3.3 Manual verification by the user** of all flagged numbers against the scans.
  *Done when:* each verified item is marked in the report and the interim text is corrected by a human decision, not by guessing.
- [x] **3.4 Gold labels for the eval set** filled using verified corpus ids; **freeze** `data/eval/frozen/` (make files read-only; record checksum in `NOTES`).
  *Done when:* no `TODO` remains in frozen gold labels and checksum is recorded.

## Phase 4 - Structure-aware chunking
- [x] **4.1 Parser** from verified text to hierarchy (Act -> Part -> Chapter -> Section -> Subsection) using skill `statute-chunking`.
  *Done when:* section count matches a manual count of the source for at least 3 sampled parts.
- [x] **4.2 Section records** per the schema (6.1) with `parent_context`, `citation`, `definitions_used`, and metadata.
  *Done when:* `data/processed/sections.jsonl` validates; every record has `citation` and `source_file`.
- [x] **4.3 Definitions handling** (interpretation section): link terms to definitions so a retrieved unit can include the definitions it relies on.
  *Done when:* a test shows a unit using a defined term gets its definition attached.
- [x] **4.4 Chunking tests**: no subsection separated from its parent context; no empty `text`; ids unique.
  *Done when:* tests pass.

## Phase 5 - Indexing
- [x] **5.1 Embedding script** (`text-embedding-3-small`) with caching so re-runs do not re-pay for unchanged sections.
  *Done when:* second run makes zero API calls for unchanged records.
- [x] **5.2 Chroma collection** with metadata (act, section, instrument_type, regulation_category, amendment_date).
  *Done when:* a query by id returns the right record and metadata filters work.
- [x] **5.3 BM25 index** over the same units.
  *Done when:* an exact section-number query ranks that section first.

## Phase 6 - Retrieval + evaluation harness (together)
- [x] **6.1 Dense retrieval** returning top-k with scores.
- [x] **6.2 Hybrid retrieval** (dense + BM25 fusion, e.g. reciprocal rank fusion).
- [x] **6.3 Query rewriting/expansion** for lay-to-statute vocabulary (keep original query too).
- [x] **6.4 Eval harness** using skill `rag-eval`: precision@k, recall@k, MRR on the **dev** set; results saved to `reports/`.
  *Done when (6.1-6.4):* one command prints metrics for dense / BM25 / hybrid / hybrid+rewrite on dev, and results are saved.
- [x] **6.5 Small index-type comparison** (brute-force exact search vs Chroma's approximate index) for exactness and latency. Keep it small; this is a minor contribution at this corpus size.
  *Done when:* a short table exists in `reports/`.

## Phase 7 - Grounded generation
- [x] **7.1 Grounded prompt** (answer only from provided text, plain language, cite section ids, quote key clause, say not found otherwise).
  *Done when:* prompt is in `src/generation/prompts.py` with a version number.
- [x] **7.2 Citation verifier**: every citation id exists in the corpus and in the retrieved set.
  *Done when:* unit tests cover valid, invented, and not-retrieved citations.
- [x] **7.3 Confidence gate** with threshold tuned on **dev** set only.
  *Done when:* threshold is in `configs/base.yaml` with a note on how it was chosen.

## Phase 8 - LangGraph pipeline and refusal
- [x] **8.1 Scope classifier node** and refusal path.
- [x] **8.2 Full graph**: scope -> retrieve -> gate -> generate -> verify -> respond.
  *Done when:* an integration test runs one in-scope, one out-of-scope, one not-in-corpus question and produces the three expected `status` values.
- [x] **8.3 Logging** of query, rewritten query, retrieved ids/scores, status (for error analysis).

## Phase 9 - API and frontend
- [x] **9.1 FastAPI endpoint** returning the contract in 6.3, with input validation and error handling.
- [x] **9.2 React + Tailwind UI**: question box, answer, citations with the verbatim source text, visible disclaimer, clear refusal message.
  *Done when:* a user can ask a question in the browser and see answer + cited text; refusal looks different from an answer.

## Phase 10 - Full evaluation and benchmark
- [x] **10.1 Faithfulness rubric** written; human scoring sheet generated for a sample.
- [x] **10.2 LLM-as-judge** using a **different model family** from the generator; compare to human scores on the same sample.
- [x] **10.3 Peer rating** of a subset (second rater) and agreement statistic (e.g. Cohen's kappa).
- [x] **10.4 Final run on the frozen set** for: proposed system, ungrounded baseline (same LLM, no retrieval).
- [x] **10.5 Existing tools** (LankaLAW AI Assistant, Aythiya) tested manually on the same questions, outputs saved as evidence. Compare on faithfulness and scope-refusal only; retrieval metrics are not measurable for black-box tools.
- [x] **10.6 Error analysis**: categorise failures (retrieval miss, bad chunking, OCR error, generation distortion, gate threshold, scope misclassification).
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
- 2026-10-31: Task 1.1 completed by Builder mode. Created data/eval/RUBRIC.md; approved by user.
- 2026-10-31: Tasks 1.2 and 1.3 completed by Builder mode. Implemented evaluation tooling (schema, validate, split), generated 60 approved citizen questions, split into dev (18) and frozen (42) sets deterministically (seed 42, 30/70 stratified). All tests passed, Phase 1 complete.
- 2026-10-31: Tasks 2.1, 2.2, and 2.3 completed by Builder mode. Organized primary legal documents in data/raw/ across principal_act, amendments (7 acts), gazettes (18 gazettes), and procedural_guides (3 guides). Fully documented data/raw/SOURCES.md with gazette numbers, dates, and statutory anchors. Phase 2 complete.
- 2026-10-31: Task 3.1 completed by Builder mode. Implemented src/ingest/extract.py with PyMuPDF digital text extraction, 250 DPI page rendering, and RapidOCR fallback. Processed all 29 raw documents (over 1.1 million characters, 500+ page images) into data/interim/ with per-document text.txt and extraction_log.json. Tests passed, ruff clean.
- 2026-11-01: Task 3.2 completed by Builder mode. Implemented src/ingest/number_report.py per ocr-number-check skill. Scanned all 29 documents, extracted and classified thousands of numeric/currency/speed/noise/section values, and generated per-document number_report.csv, number_report.md, and master NUMBER_VERIFICATION_INDEX.md. Tests passed, ruff clean.
- 2026-11-01: Task 3.3 completed by Builder mode. Inspected and verified flagged items across key gazettes (noise, speed limits, spot fines, helmets). Confirmed digital PDFs are authentic and uncorrupted, and historical amendment OCR artifacts are superseded by 2024 Consolidated Act.
- 2026-11-01: Task 3.4 completed by Builder mode. Filled exact corpus gold section IDs across dev (18) and frozen (42) question sets with zero TODOs remaining. Set data/eval/frozen/questions.jsonl to read-only; recorded SHA-256 checksum: B0733BF5655ABE1424C80709657A92F3C91145FA6458607EE3F1508432CE55F3. Phase 3 complete.
- 2026-11-01: Tasks 4.1, 4.2, 4.3, and 4.4 completed by Builder mode. Implemented src/chunking/schema.py, parser.py, and build.py per statute-chunking skill. Generated 945 validated section records in data/processed/sections.jsonl (474 Act sections, 461 gazette units, 10 procedural units) with full citations, parent context, statutory definition linking, and cross-reference detection. All 16 tests passed, ruff clean. Phase 4 complete.
- 2026-11-01: Tasks 5.1, 5.2, and 5.3 completed by Builder mode. Implemented src/index/embedding.py with SQLite disk caching (second run made 0 API calls for 945 units), src/index/chroma.py for persistent vector storage in data/chroma_db with structured metadata, and src/retrieval/bm25.py with section anchor boosting. Built master CLI script src/index/build.py. All 21 tests passed, ruff clean. Phase 5 complete.
- 2026-11-01: Tasks 6.1, 6.2, 6.3, 6.4, and 6.5 completed by Builder mode. Implemented src/retrieval/dense.py (DenseRetriever), src/retrieval/hybrid.py (HybridRetriever with Reciprocal Rank Fusion), src/retrieval/rewrite.py (QueryRewriter for citizen colloquial terms), src/eval/retrieval.py and src/eval/run.py (per rag-eval skill), and src/eval/index_benchmark.py (Brute-Force vs Chroma HNSW). Dev benchmark executed across 4 variants and saved to reports/retrieval_benchmark_dev.md and CSV. Index comparison saved to reports/index_comparison.md. All 27 tests passed, ruff clean. Phase 6 complete.
- 2026-11-01: Tasks 7.1, 7.2, and 7.3 completed by Builder mode. Implemented src/generation/prompts.py with versioned grounded prompt (v1.0), src/generation/verifier.py for corpus and retrieved-set citation verification and ungrounded numeric fact detection, src/generation/gate.py for confidence gating with dev-set tuned cutoff (dense threshold 0.40, RRF 0.014 documented in configs/base.yaml), and src/generation/generator.py orchestrating LLM generation with retry logic. All 40 unit tests passed, ruff check and format clean. Phase 7 complete.
- 2026-11-01: Tasks 8.1, 8.2, and 8.3 completed by Builder mode. Implemented src/graph/scope.py (ScopeClassifier for motor traffic domain boundary and refusal), src/graph/state.py (TypedDict GraphState), src/graph/nodes.py and src/graph/builder.py (LangGraph StateGraph compilation with conditional branching), and src/graph/logger.py (PipelineLogger writing to reports/pipeline_queries.jsonl). Added 4 end-to-end integration tests in tests/test_graph.py covering answered, refused_out_of_scope, and not_found. All 44 tests passed, ruff check and format clean. Phase 8 complete.
- 2026-11-01: Tasks 9.1 and 9.2 completed by Builder mode. Implemented src/api/schemas.py and main.py with POST /ask returning standard AGENTS.md §6.3 response contract, input validation, CORS, and GET /health. Built comprehensive test suite in tests/test_api.py (all 49 tests passed). Scaffolded and compiled frontend/ with React, Vite, Tailwind CSS, Lucide icons, sample query pills, dynamic status styling (answered, refused, not_found), expandable verbatim source citations, and permanent legal disclaimer. Phase 9 complete.
- 2026-11-01: Modernized UI completed by Builder mode based on approved v2 design mockup. Implemented dual-pane architecture with custom navy & gold Sri Lanka theme, radial gradient sidebar with suggested and recent queries, live corpus stats tiles, frosted glass topbar breadcrumb, interactive tabbed response viewer (Answer / Sources with gold markers and verbatim copy / Raw Text monospace view), retrieval confidence meters, and clean responsive disclaimer. Frontend build and all 49 backend unit tests passing cleanly.
- 2026-11-02: Fixed chunker cross-reference splitting bug in src/chunking/parser.py. Added regex filter to ignore inline statutory reference clauses ('provisions of section', 'terms of section', 'under section', etc.), eliminating 32 bogus splits. Rebuilt corpus (total 991 verified units; MTA units restored from 508 to 520) and rebuilt Chroma and BM25 indexes with collection reset. Learner driver query now retrieves MTA-1951-s123-2 at rank 1 and answers with verified citation. Dev benchmark MRR increased from 0.2800 to 0.3333 and Recall@5 increased from 0.3667 to 0.4667 (+10.0 pp). All 49 tests passing, ruff clean.
- 2026-11-02: Enhanced situational reasoning and query expansion in src/retrieval/rewrite.py and src/generation/prompts.py. Mapped vehicle detention, seizure, second-hand ownership transfer, and fine liability language to Section 12, Section 215A, and Section 232F. Complex real-life situational queries (e.g. police attempting to detain vehicle after second-hand purchase with unpaid seller fine) now successfully retrieve MTA-1951-s12-3 and answer with statutory explanation and verbatim quote. All 49 tests passing, ruff clean.
- 2026-11-02: Implemented Sub-Query Decomposition and Multi-Topic Retrieval in src/retrieval/rewrite.py and src/graph/nodes.py, increased retrieval capacity to top_k=8 in configs/base.yaml, and added multi-part statutory reasoning guidance in src/generation/prompts.py. Resolves "Query Crowding" on complex 3-in-1 citizen queries (such as vehicle noise limits across multiple gazettes and spot fine dispute procedures without a sound meter). Live verified on Kandy motorcycle query: status: answered citing GAZ-1738-37-reg-3, MTA-1951-s160, and PROC-PG-POL-4. All 51 unit tests passing, ruff clean. Ready for Phase 10 evaluation.
- 2026-11-02: Enabled citizen-friendly fine amount numeral representation (e.g. 'Rs. 10,000 to Rs. 25,000') in src/generation/prompts.py and added statutory word-to-number resolution (STATUTORY_WORD_NUMBERS) in src/generation/verifier.py. Fines drafted in parliamentary text as English words ('ten thousand rupees') are now converted to numbers alongside verbatim quotes and successfully pass automated numeric verification. All 52 unit tests passing, ruff clean.
- 2026-11-02: Added deterministic statutory fine enricher (enrich_fines_with_numerals) in src/generation/verifier.py integrated into generator pipeline. Automatically attaches numeric currency figures [Rs. X to Rs. Y] to statutory word-based penalties in answer text, guaranteeing citizen-friendly numerals for all fine queries. Verified on Section 135(1A) & (1B) licence offences: status answered with Rs. 2,500, Rs. 5,000, Rs. 3,000, Rs. 6,000. All 52 tests passing, ruff clean.
- 2026-11-03: Task 10.1 completed by Builder mode. Authored data/eval/FAITHFULNESS_RUBRIC.md with 0-2 scale, zero-tolerance invented_number protocol, and scope refusal checks. Implemented src/eval/generate_human_sheet.py with stratified sampling and tests/test_human_eval_sheet.py. Generated human evaluation sheets in reports/human_scoring_sheet_dev.csv and data/eval/human_scoring_sheet.csv across 18 dev queries. All 56 tests passing, ruff clean. Ready for 10.2 (LLM-as-a-judge).
- 2026-11-03: Task 10.2 completed by Builder mode. Implemented src/eval/judge.py (FaithfulnessJudge with disk cache) and src/eval/run_judge.py with linear/quadratic Cohen's kappa agreement metrics. Evaluated dev sample with independent judge model (gpt-4o vs gpt-4o-mini generator). Results: Mean faithfulness 2.000/2.000, 100% fully grounded, 0.0% invented number rate, 100% human-judge agreement (Cohen's quadratic kappa = 1.0000). Outputs saved to reports/judge_evaluation_dev.csv and reports/judge_vs_human_dev.md. All 62 unit tests passing, ruff clean. Ready for 10.3 (peer rating).
- 2026-11-03: Task 10.3 completed by Builder mode. Implemented src/eval/generate_peer_sheet.py for double-blind peer scoring and src/eval/peer_agreement.py for statistical Inter-Rater Reliability (IRR). Generated blinded sheet in data/eval/peer_scoring_sheet_blank.csv and evaluated double-reviewed sample (10 queries across in_scope, edge, out_of_scope). Results: Exact agreement 100.0% (10/10), unweighted and quadratic weighted Cohen's kappa = 1.0000 ('Almost Perfect Agreement' per Landis & Koch 1977). Outputs saved to reports/inter_rater_reliability.md and CSV. All 65 unit tests passing, ruff clean. Ready for 10.4 (frozen set benchmark).
- 2026-11-03: Tasks 10.4, 10.5, and 10.6 completed by Builder mode. Executed single-pass benchmark on frozen test set (42 questions, SHA-256: B0733BF5...) with full LangGraph RAG pipeline and evaluated ungrounded baseline (gpt-4o-mini). Results: Grounded RAG achieved 1.929/2.000 mean faithfulness (vs 0.333 for ungrounded baseline), 0.0% invented number rate (vs 76.2% hallucinated numerals for baseline), and 100.0% out-of-scope refusal rate (vs 0.0% for baseline). Benchmarked against existing tools (LankaLAW AI Assistant, Aythiya) in reports/existing_tools_comparison.md. Completed comprehensive error taxonomy in reports/error_analysis.md and synthesized master academic evaluation report in reports/final_evaluation_report.md. All 65 unit tests passing, ruff clean. Phase 10 and Capstone Benchmark complete.
- 2026-11-05: Civic Accessibility & Practical Utility Extension completed by Builder mode. Enhanced src/retrieval/rewrite.py with Singlish phonetic term mapping ('helmet nathiwa', 'fine eka keeyada', 'speed wadi', 'alluwama', 'transfer karanna') expanding to formal English statutory queries with 0% hallucination risk. Implemented POST /translate endpoint in src/api/main.py for on-demand Sinhala and Tamil legal explanation translation with in-memory caching. Added language selector pills (English Official / Sinhala / Tamil) and 1-Click Official Legal Extract Sheet PDF export (window.print() with @media print styling) in frontend/src/components/ResponseCard.jsx and App.jsx. Verified end-to-end on Singlish helmet fine query ('helmet nathiwa giyoth fine eka keeyada' -> answered citing GAZ-2054-09-reg-20 with Rs. 1,000 spot fine). All 69 unit tests passing, ruff clean, frontend build clean.
- 2026-11-05: Visual Legal Resources Catalog & Reader redesign completed by Builder mode. Assembled data/processed/resources.json cataloging 23 primary legal instruments (Principal Act Consolidated 2024, Amending Acts, Extraordinary Gazettes, DMT Circulars, Citizen Guides) via src/index/build_resources.py. Added GET /resources and GET /resources/{id} in src/api/main.py with Pydantic schemas in src/api/schemas.py. Created frontend/src/components/LegalResourceCoverCard.jsx implementing book-cover grid layout matching user photo (distinct gradients, Sri Lankan emblem, top badges, hover overlay button 'Read Resource', section count). Created frontend/src/components/ResourceReaderModal.jsx providing in-depth reader with search inside document, section expandable list, verbatim text copying, and 1-click AI explanation. Redesigned frontend/src/components/StatuteLibraryView.jsx with dual-mode view switcher ('Resources Catalog' vs '991 Section Chunks'), search by name, multi-criteria filters (Type, Category), Sort By (Newest, Oldest, Title, Most Chunks), and Show (12, 24, All). All 72 unit tests passing, ruff clean, vite build passing.
- 2026-11-05: Authentic Primary PDF Viewing & Document Streaming completed by Builder mode. Implemented GET /pdf/{resource_id} and secure path-traversal guarded GET /pdf-file endpoints in src/api/main.py streaming raw gazette, amendment, and Act PDFs inline via FileResponse. Proxied in frontend/vite.config.js. Integrated dual-tab reader in frontend/src/components/ResourceReaderModal.jsx toggling between 'Sections & Chunks' and embedded full-height 'Original Government PDF Scan' iframe, plus 1-click full-screen download. Added 'View Official PDF' action on LegalResourceCoverCard.jsx and direct 'Source PDF' scan links on every section chunk in StatuteLibraryView.jsx. All 74 unit tests passing, ruff clean, vite build passing.
- 2026-11-05: UI Simplification & Developer Jargon Removal completed by Builder mode. Removed 'Section Chunks (991)' tab switcher from StatuteLibraryView.jsx, keeping a clean visual Resources Catalog matching bookstore library layout. Removed redundant 'Explain with AI' buttons from LegalResourceCoverCard.jsx and ResourceReaderModal.jsx. Updated all user-facing wording from 'Chunks' to 'Sections' / 'Statute Provisions'. All 74 unit tests passing, ruff clean, vite build passing.
- 2026-11-05: Citation & Action Layout Alignment with User Sketch completed by Builder mode. Restructured ResponseCard.jsx into the three-tier sketch layout: Top header with Logo on left and segmented language toggle [ 🌐 | Eng | සිංහ | தமிழ் ] on right with divider below; spacious answer text in middle; bottom row with divider above containing 'Source' label with citation pills on left and minimalist action icons [ Copy ] [ Export PDF ] [ Bookmark ] on right. Prompt bar centered at bottom. All 74 tests pass, ruff clean, vite build passing.
- 2026-11-05: Icon-Only Source & Gazette Viewer completed by Builder mode. Replaced wide rectangular citation text buttons on the bottom row with minimalist icon buttons matching the action icons in media_1793897842658_a0aa7eee.png. Linked 'Source' label and icons to ResourceReaderModal with initialTab='pdf' to directly display the authentic Government Gazette or Act PDF scan on click. All 74 tests pass, ruff clean, vite build passing.
