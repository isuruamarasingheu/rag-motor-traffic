# PROMPTS.md - Copy-paste prompts

Everything runs in **Antigravity 2.0**. Switch the model with the **model selector under the prompt box**.
Conventions: **C** = planner/reviewer prompts (select a **Claude** model, e.g. Sonnet 5.5; Opus 5.5 for hard problems), **G** = builder prompts (select a **Gemini** model), **H** = handoff/recovery prompts (any model).
Antigravity 2.0 has no code editor: read diffs in VS Code (or another editor) opened on the same folder.
Start a **new conversation** when you switch modes, so the model begins with a clean context.
Replace `<...>` placeholders. Always start a fresh session when a conversation gets long or confused.

---

## 0. First-time setup

### C0 - Planner mode: understand the project (select a Claude model)
```
Read AGENTS.md and PLAN.md fully. Then, without editing any files, tell me in your own words:
1) what this project is and what the three research questions are,
2) the rules you must never break,
3) the pipeline steps,
4) which skills are available and when you would use each,
5) anything in AGENTS.md or PLAN.md that is unclear, contradictory or risky.
Keep it under 300 words.
```

### G0 - Antigravity 2.0: understand the project and check skills
```
You are working in the Antigravity 2.0 desktop app on this project folder. Do not change any files yet.
1) Read AGENTS.md, GEMINI.md and PLAN.md. Tell me which model you are. Summarise the project, the non-negotiable rules, and your role in 150 words.
2) Tell me which instruction files you actually loaded automatically.
3) List the skills you can see (I expect statute-chunking, ocr-number-check, rag-eval from .agents/skills/). If you cannot see them, check the documentation or settings of THIS version, tell me exactly where skills are expected, and propose how to make them available. Wait for my approval before copying anything.
4) Tell me whether any MCP servers are connected, and what a docs-lookup server would add.
```

---

## 1. Planning and review prompts (Claude model, planning only - no code edits)

### C1 - Plan the next task
```
Work in planning mode: do not edit code or data. Read AGENTS.md and PLAN.md. Find the first unchecked task.
Do not edit code. Propose a concrete implementation plan for that task only:
files to create or change, function names, tests to write, risks, and the exact "done when" check.
If the task is too big, split it into smaller steps and update PLAN.md with the split.
Wait for my approval.
```

### C2 - Turn a plan into a handoff for builder mode
```
Write the handoff for task <task number> as a short message I can paste into a new builder conversation (Gemini model):
goal, files to touch, constraints from AGENTS.md that matter here, tests required, and what to report back.
Keep it under 200 words. Also add a NOTES line to PLAN.md saying the task is handed off.
```

### C3 - Review the builder's work
```
Review the changes for task <task number>. Run git diff (and git status). Check:
- Does it match the plan and the data contracts in AGENTS.md section 6?
- Any legal text, numbers or section references written from memory?
- Any edits to data/raw/ or data/eval/frozen/?
- Any citation or scope-refusal logic that can be bypassed?
- Are tests meaningful (not just passing trivially)? Run pytest -q and ruff check .
Give me: must-fix issues, should-fix issues, and a yes/no on whether the "done when" check is genuinely satisfied.
```

### C4 - Critique my evaluation questions
```
Read data/eval/dev/questions.jsonl and data/eval/RUBRIC.md. Without inventing law, critique the question set:
- balance of in_scope / edge / out_of_scope,
- phrasing diversity (plain language, wrong terminology, vague, multi-part),
- questions that are ambiguous or have more than one valid gold section,
- out_of_scope questions that are too easy,
- gaps in topic coverage compared to the sources listed in data/raw/SOURCES.md.
Suggest types of questions to add (not the legal answers).
```

### C5 - Check data and chunking quality
```
Use the statute-chunking skill's validation list. Sample 10 random records from data/processed/sections.jsonl and compare each to its source in data/raw/. Report: text mismatches, wrong citation paths, units that start or end mid-sentence, missing parent_context, missing definitions links. Do not fix anything; list issues with record ids.
```

### C6 - Design the confidence threshold and refusal behaviour
```
Look at the dev-set retrieval results in reports/. Propose how to choose the confidence-gate threshold using only the dev set: what to plot, what trade-off to look at (false refusals vs wrong answers), and what rule to use. Then list the edge cases where the scope classifier and the gate could disagree and how the graph should resolve them.
```

### C7 - Error analysis
```
Read reports/<run folder>/per_question.csv. Categorise every failure using the categories in the rag-eval skill. Give counts per category, 3 representative examples each, and the most valuable fix for each category. Do not suggest changing gold labels.
```

### C8 - Methods-writing support (you write, the model reviews)
```
Here is my draft of the <section name> section. Review it as a critical examiner: unclear claims, claims not supported by my results, missing details a reader would need to reproduce this, and wording that overstates findings. Do not rewrite it; give comments I can act on.
```

---

## 2. Implementation prompts (Gemini model, builder mode)

> Start each task with the standard opener, then the task prompt.

### G-OPEN - standard opener
```
Read AGENTS.md and PLAN.md (follow section 11, builder mode). You are working on task <number> only. First create an implementation plan and wait for my approval. Before coding, tell me in 2-4 lines what files you will create or change. After coding, run pytest -q and ruff check ., and report: the full list of file paths you created or changed, what changed, test results (including failures), what you did NOT verify, and what is next. Do not mark the task done unless its "done when" check passes.
```

### G1 - Scaffold (task 0.1)
```
Create the repository scaffold described in AGENTS.md section 4: folders, requirements.txt (python-dotenv, pydantic, pyyaml, chromadb, openai, rank_bm25, langgraph, langchain-core, langchain-openai or equivalents, fastapi, uvicorn, pytest, ruff), .gitignore (.env, data/interim/, chroma db folder, __pycache__, node_modules), .env.example, configs/base.yaml (model names, k values, thresholds as placeholders, paths) and one placeholder test. Check current package names and versions before pinning; do not guess.
```

### G2 - Eval question tooling (tasks 1.2-1.3)
```
Create a script that validates data/eval/*/questions.jsonl against the schema in AGENTS.md section 6.2 (pydantic model), reports errors with line numbers, and a deterministic split script (fixed seed, stratified by type) that writes dev and frozen files but refuses to overwrite data/eval/frozen/ if it already exists. Add tests. Do not write any questions or gold labels yourself.
```

### G3 - Text extraction and OCR (task 3.1)
```
Build src/ingest/extract.py: for each file in data/raw/, extract text directly if the PDF has a text layer, otherwise run OCR (check current docs and propose a free OCR option, e.g. Tesseract; explain the trade-offs before installing). Save page images at 250 dpi to data/interim/<doc>/pages/ and text to data/interim/<doc>/text.txt, plus a log with page counts and per-page OCR confidence if available. Never write to data/raw/. Do not correct any text.
```

### G4 - Number report (task 3.2)
```
Use the ocr-number-check skill. Implement src/ingest/number_report.py that produces number_report.csv and number_report.md for a given document as specified in the skill, with suspicion flags. Add unit tests with small synthetic text samples containing confusable characters. Do not correct any value.
```

### G5 - Parser and section records (tasks 4.1-4.2)
```
Use the statute-chunking skill. Implement src/chunking/parser.py and build.py to turn verified text into data/processed/sections.jsonl following the schema in AGENTS.md section 6.1. Start with the Motor Traffic Act text only. Write the hierarchy-detection rules as tested functions. After running, report the count of units per Part and 3 random records with their source lines so I can verify them. Do not alter legal wording.
```

### G6 - Definitions and cross-references (task 4.3)
```
Extend the chunker: detect the interpretation/definitions section, extract defined terms, and fill definitions_used for each unit; detect explicit cross-references ("section 20", "regulation 4") into refers_to without resolving ambiguous ones. Add tests, including a unit that uses a defined term and one with an ambiguous reference.
```

### G7 - Embeddings and Chroma (tasks 5.1-5.2)
```
Implement src/index/build.py: embed only records with verified true using text-embedding-3-small, cache embeddings on disk keyed by a hash of the text and model name so unchanged records are never re-embedded, and store them in a persistent Chroma collection with metadata (act, section, instrument_type, regulation_category, amendment_date). Check the current Chroma and OpenAI client docs for exact APIs. Add a test using a tiny fake embedding function so tests do not call the API.
```

### G8 - BM25 and hybrid retrieval (tasks 5.3, 6.1-6.2)
```
Implement src/retrieval/: dense search (Chroma), BM25 search (rank_bm25) and hybrid search using reciprocal rank fusion, all returning a list of {id, score, source} with the same interface. Exact queries like "section 112" must rank that section first in hybrid mode. Add tests with a tiny hand-made corpus. Make k and fusion constants configurable in configs/base.yaml.
```

### G9 - Query rewriting (task 6.3)
```
Add an optional query-rewrite step: given a plain-language question, produce a short statutory-style query (keep the original too). Use the generator model with a prompt stored and versioned in src/retrieval/prompts.py. The pipeline must be able to run with rewriting on or off via config so the evaluation can compare them. Log original and rewritten queries.
```

### G10 - Evaluation harness (task 6.4)
```
Use the rag-eval skill. Implement src/eval/run.py with --set dev|frozen, computing precision@k, recall@k and MRR for dense, BM25, hybrid and hybrid+rewrite, saving summary.md and per_question.csv under reports/<date>_<set>/ together with git commit hash, config and question-set checksum. Refuse to run --set frozen with uncommitted changes unless I pass --force. Add tests for the metric functions with hand-computed examples.
```

### G11 - Grounded generation and citation verifier (tasks 7.1-7.2)
```
Implement src/generation/: a grounded prompt (versioned) that: answers in plain language using ONLY the provided sections, cites ids in a structured format, quotes the key clause, and says it cannot find an answer if the sections do not contain one. Then a citation verifier that checks every cited id exists in the corpus and in the retrieved set, and flags numbers in the answer that do not appear in the retrieved text. Write tests for valid, invented, and not-retrieved citations and for an invented number. Do not call the real LLM in tests.
```

### G12 - LangGraph pipeline (tasks 8.1-8.3)
```
Implement the LangGraph graph in src/graph/ with nodes scope_check -> retrieve -> confidence_gate -> generate -> verify_citations -> respond, plus refusal and not_found branches, exactly as in AGENTS.md section 7. Check the current LangGraph docs for the right API. Return the response contract from AGENTS.md section 6.3. Log query, rewritten query, retrieved ids and scores, and final status. Add an integration test with mocked LLM calls covering: answered, refused_out_of_scope, not_found, and a citation-verification failure.
```

### G13 - FastAPI (task 9.1)
```
Implement src/api/main.py with POST /ask (body: {question}) returning the contract in AGENTS.md section 6.3, input validation (non-empty, max length), clear error responses, CORS for the local frontend, and a GET /health. Add tests with the pipeline mocked.
```

### G14 - React frontend (task 9.2)
```
Create frontend/ with React and Tailwind: a question box, loading state, answer area, a "Sources" panel showing each citation with the verbatim source text, a visibly different style for refusals and "not found", and an always-visible disclaimer that this is legal information, not legal advice. Check current Vite/Tailwind setup docs rather than guessing. Keep it simple and accessible (labels, keyboard use, readable contrast).
```

### G15 - Evaluation extras (tasks 10.1-10.4)
```
Use the rag-eval skill. Implement: (1) a script that generates a blank human scoring sheet CSV for a random sample (question, answer, retrieved text, score columns, notes), (2) an LLM-judge script using a different model family from the generator (ask me which provider key I have; do not assume), temperature 0, JSON output, cached results, (3) Cohen's kappa between two raters and between judge and human, (4) the ungrounded baseline runner (same generator model, no retrieval). Do not run on the frozen set until I say so.
```

---

## 3. Handoff and recovery prompts

### H1 - Report back to planner mode after a build
```
The builder finished task <number>. Here is its report: <paste>. Review git diff and test output as in prompt C3, update PLAN.md checkboxes and NOTES, and propose the next task.
```

### H2 - Fresh-session resume (any tool)
```
Read AGENTS.md, PLAN.md and its NOTES section. Tell me: which tasks are done, which one is in progress, what the last change was, and what you would do next. Do not change anything yet.
```

### H3 - Something broke
```
Do not change code yet. Reproduce the problem and show me the exact error. List 3 plausible causes ranked by likelihood with a quick check for each. Then wait for me to choose which check to run.
```

### H4 - The AI is going off track
```
Stop. Re-read AGENTS.md section 2 (non-negotiable rules) and the current task in PLAN.md. List anything you did in the last steps that conflicts with them, undo it if it is in git (git diff first, ask me before reverting), then continue only with the current task.
```

### H5 - Library API uncertainty
```
Before writing this code, check the current official documentation (or a docs-lookup tool) for <library> and show me the exact function signatures you will use. Do not rely on memory.
```

---

## 4. Prompting habits for this project

- One task per prompt. Name the files. State the "done when".
- Ask the AI to **list assumptions** before it starts.
- Paste real error messages, not summaries.
- For anything involving law, numbers or gold labels: **you** decide; the AI proposes structure, code and checks.
- After each task: `git diff`, read it, run tests, commit.
