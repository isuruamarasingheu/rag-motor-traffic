# AGENTS.md - Project Instructions (read this first, every session)

> This is the master instruction file for the Antigravity workspace. `GEMINI.md` only points here (compatibility).
> If anything conflicts with a user message, ask before proceeding.

## 1. What this project is

A **citation-grounded legal-information assistant** for Sri Lanka's **Motor Traffic Act No. 14 of 1951**, its amendments, and relevant subsidiary gazette regulations (e.g. vehicle noise-emission limits, vehicle fitness, registration, fine and appeal procedures).

It is an individual undergraduate capstone with a research focus. A citizen types a plain-English question; the system:

1. checks whether the question is **in scope** (Motor Traffic Law),
2. **retrieves** the correct legal section(s),
3. generates a **plain-language answer derived ONLY from the retrieved text**,
4. **cites the exact section** (e.g. "Section 112(1)(a)") and shows the source text,
5. **refuses** out-of-scope questions, and says so when nothing relevant is found.

It provides **legal information, not legal advice**. A disclaimer must always be visible in the UI.

### Research questions (everything we build serves these)
- **RQ1** Can RAG retrieve the correct section for a citizen query with high accuracy? (precision@k, recall@k)
- **RQ2** Does strict grounding reduce hallucination vs an ungrounded LLM? (faithfulness)
- **RQ3** Can the system distinguish in-scope from out-of-scope queries and refuse correctly? (scope-restriction rate)

### Explicit boundaries
- **English only.** Sinhala/Tamil is future work. Do not add translation.
- **One domain only.** Motor traffic law. Do not expand to other Acts.
- Only publicly available legal text. No personal data, no user accounts, no storing user queries beyond local logs for evaluation.

## 2. Non-negotiable rules (read twice)

1. **Never invent legal content.** Do not write, "correct", complete, or paraphrase-into-the-corpus any statute text, section number, fine amount, decibel limit, or date from memory. All legal text must come from a source file in `data/raw/` with a recorded source.
2. **Never guess OCR digits.** If a number in OCR output looks wrong or unclear, flag it for manual verification against the scan. Do not "fix" it by assumption.
3. **Answers must be grounded.** Generation may only use retrieved section text. If retrieval confidence is low, the answer is a refusal / "I could not find a relevant provision", not a best guess.
4. **Every answer cites.** No answer is returned without at least one section citation that exists in the corpus. Citations must be verified against the corpus programmatically, not just trusted from LLM output.
5. **Do not touch `data/raw/` or `data/eval/frozen/`.** Raw sources are read-only. The frozen evaluation set must not be edited after it is frozen (see `PLAN.md`).
6. **Do not tune on the test set.** Development questions live in `data/eval/dev/`. Final evaluation uses `data/eval/frozen/` only.
7. **Never commit secrets.** API keys go in `.env` (git-ignored). Never print keys.
8. **Small steps.** One task at a time. Run tests after every change. Report what changed and what is next.
9. **When unsure about law or requirements, ask the user.** Do not decide silently.

## 3. Tech stack (fixed unless the user changes it)

| Layer | Choice |
|---|---|
| Language | Python 3.11+ |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector store | Chroma (local, persistent) |
| Keyword search | BM25 (`rank_bm25`) for hybrid retrieval |
| Orchestration | LangGraph (branching: scope -> retrieve -> generate -> cite / refuse) |
| LLM (generation) | OpenAI `gpt-4o-mini` |
| LLM (judge) | A **different model family** from the generator (avoid self-grading bias) |
| Backend | FastAPI |
| Frontend | React + Tailwind CSS |
| Tests | pytest |
| Lint/format | ruff |

If a library API is uncertain, **look up the current docs** (use a docs-lookup MCP tool if available) instead of guessing. LangGraph and Chroma APIs change often.

## 4. Repository layout

```
rag-motor-traffic/
├── AGENTS.md  GEMINI.md  PLAN.md  PROMPTS.md
├── .agents/skills/            # skills (statute-chunking, ocr-number-check, rag-eval)
├── .env                       # secrets (git-ignored)
├── configs/
│   └── base.yaml              # model names, k, thresholds, paths
├── data/
│   ├── raw/                   # READ ONLY: original PDFs / HTML / text, with SOURCES.md
│   ├── interim/               # OCR output, awaiting manual verification
│   ├── processed/             # verified, structured sections (JSONL)
│   └── eval/
│       ├── dev/               # questions used while developing
│       └── frozen/            # final test set (do not edit once frozen)
├── src/
│   ├── ingest/                # OCR, cleaning, parsing
│   ├── chunking/              # structure-aware sectioning
│   ├── index/                 # embeddings + Chroma + BM25
│   ├── retrieval/             # dense, BM25, hybrid, reranking
│   ├── graph/                 # LangGraph pipeline
│   ├── generation/            # prompts, grounding, citation check
│   ├── api/                   # FastAPI app
│   └── eval/                  # metrics, judge, benchmark scripts
├── frontend/                  # React + Tailwind
├── tests/
└── reports/                   # evaluation outputs (generated)
```

## 5. Commands (adjust if the repo differs)

- Install: `pip install -r requirements.txt`
- Build corpus: `python -m src.chunking.build`
- Build index: `python -m src.index.build`
- Run API: `uvicorn src.api.main:app --reload`
- Tests: `pytest -q`
- Lint: `ruff check . && ruff format --check .`
- Evaluate: `python -m src.eval.run --set dev`   (use `--set frozen` only for final results)
- Frontend: `cd frontend && npm install && npm run dev`

## 6. Data contracts

### 6.1 Section record (`data/processed/sections.jsonl`, one JSON object per line)

```json
{
  "id": "MTA-1951-s112-1-a",
  "act": "Motor Traffic Act No. 14 of 1951",
  "instrument_type": "act | amendment | gazette_regulation | procedure",
  "part": "Part VI",
  "chapter": null,
  "section": "112",
  "subsection_path": "(1)(a)",
  "citation": "Motor Traffic Act, Section 112(1)(a)",
  "heading": "Short heading of the section",
  "text": "Full verbatim text of this unit.",
  "parent_context": "Heading text / lead-in of parent so the unit makes sense alone",
  "definitions_used": ["motor vehicle"],
  "regulation_category": "noise | fitness | registration | licensing | offences | procedure | other",
  "amendment_date": "YYYY-MM-DD or null",
  "gazette_no": "optional",
  "source_file": "data/raw/...",
  "source_url": "https://...",
  "verified": true,
  "verified_by_note": "manually checked against scan on <date>"
}
```

Only records with `"verified": true` may be indexed for final evaluation.

### 6.2 Evaluation question (`data/eval/*/questions.jsonl`)

```json
{
  "id": "Q017",
  "question": "My motorcycle silencer is too loud, what is the limit and what law is that under?",
  "type": "in_scope | edge | out_of_scope",
  "gold_sections": ["GAZ-xxxx-reg-4"],
  "expected_behavior": "answer_with_citation | refuse | say_not_found",
  "notes": "why this question exists"
}
```

### 6.3 API response

```json
{
  "status": "answered | refused_out_of_scope | not_found",
  "answer": "plain-language text or null",
  "citations": [{"id": "...", "citation": "...", "text": "verbatim source text"}],
  "disclaimer": "This is legal information, not legal advice..."
}
```

## 7. Pipeline behaviour (LangGraph nodes)

1. `scope_check` -> in-scope / out-of-scope (cheap LLM or classifier; out-of-scope goes to refusal)
2. `retrieve` -> hybrid (dense + BM25), top-k, with scores
3. `confidence_gate` -> if best score below threshold (in `configs/base.yaml`) go to `not_found`
4. `generate` -> grounded prompt, uses ONLY retrieved text
5. `verify_citations` -> every cited id must exist in the corpus; the cited text must be in the retrieved set; otherwise regenerate once, then fall back to `not_found`
6. `respond` -> response object (see 6.3) with disclaimer

Lay users do not use statutory wording, so queries may be **rewritten/expanded** before retrieval. Keep the original and rewritten queries in logs for analysis.

## 8. Definition of done (for any task)

- Code runs and `pytest -q` passes
- `ruff check .` is clean
- New behaviour has a test (or a documented reason why not)
- Any data/legal-text change is traceable to a source in `data/raw/`
- You report: what changed, how you verified, what is left, any risks
- `PLAN.md` checkboxes and the `NOTES` section are updated

## 9. How to communicate

- Short, specific summaries. Say what you did and did not verify.
- Say "I don't know" or "I need the source" instead of guessing.
- For legal wording questions: quote the corpus, do not paraphrase from memory.
- Ask at most one clarifying question at a time.

## 10. Skills available (load when relevant)

- `statute-chunking` - turning Act/regulation text into section records
- `ocr-number-check` - verifying numbers extracted from scanned gazettes
- `rag-eval` - running and reporting retrieval / faithfulness / scope metrics

## 11. Working modes (one tool, different models)

Everything happens in **Antigravity 2.0**. The user switches the model with the model selector under the prompt box. The same rules apply in both modes.

### Planner / reviewer mode (Claude model, e.g. Sonnet 5.5; Opus 5.5 for hard problems)
- Plan only; do not edit code unless asked. Edit `PLAN.md` and eval/rubric documents.
- Write small ordered tasks with "done when" checks.
- Review diffs and test results: look for invented legal text, unverified numbers, missing citation checks, leakage between dev and frozen eval sets, untested code.

### Builder mode (Gemini model)
- Implement **one `PLAN.md` task at a time**. Create an implementation plan first and wait for approval.
- Run `pytest -q` and `ruff check .`, then report honestly, including failures and what was not verified.
- Do not mark a task done unless its "done when" check passes.

### Shared rules for both modes
- Only **one agent writes files at a time**. Do not run parallel agents on overlapping files.
- Say which file paths you created or changed.
- After each task, add a short line to `PLAN.md` NOTES: who/which mode, what changed.
- Keep terminal approvals on; ask before destructive or bulk commands.
- If you do not see the skills in `.agents/skills/`, tell the user instead of guessing.
