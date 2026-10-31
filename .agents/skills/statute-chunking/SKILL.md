---
name: statute-chunking
description: Converts verified Sri Lankan legal text (Acts, amendments, gazette regulations) into hierarchical, individually citable section records for RAG. Use when parsing, sectioning, chunking or structuring legal documents, or when fixing citation or hierarchy problems in the corpus.
---

# Statute Chunking

## Goal
Every retrieval unit must be **legally coherent and exactly citable**. A subsection must never be separated from the context that gives it meaning.

## Inputs and outputs
- Input: verified text from `data/interim/` or `data/raw/` (never unverified OCR for final evaluation).
- Output: `data/processed/sections.jsonl`, using the schema in `AGENTS.md` section 6.1.

## Steps
1. **Detect hierarchy**: Act -> Part -> Chapter -> Section -> Subsection -> Paragraph. Use the document's own numbering and headings (e.g. `112.`, `(1)`, `(a)`, `(i)`). Write the detection rules as code with tests, not ad-hoc fixes.
2. **Choose the unit**: the default unit is a **section**. Split into subsections only if the section is long (over ~400 words) AND each subsection stays understandable with its `parent_context`. Never produce a unit that starts mid-sentence.
3. **Build `citation`** from the hierarchy exactly as lawyers cite it, e.g. `Motor Traffic Act, Section 112(1)(a)`. For gazettes: instrument title, gazette number, regulation number.
4. **Fill `parent_context`**: the section heading and any lead-in sentence that subsections depend on ("A person shall not ... if:").
5. **Handle definitions**: find the interpretation section. For each unit, detect defined terms it uses and store them in `definitions_used`; the retrieval layer can attach the definitions text.
6. **Handle cross-references** ("subject to section 20", "as prescribed"): store referenced section ids in a `refers_to` list if detected. Do not resolve them by guessing.
7. **Handle amendments**: if a section was amended or repealed, keep `amendment_date`. Prefer the **current consolidated text**; keep superseded text only if explicitly needed, and mark it.
8. **Tables and schedules** (e.g. limits in a table): keep the table as text in one unit with its caption; never split rows from headers.
9. **Validate** (write tests):
   - ids are unique and stable
   - no empty `text`
   - every record has `citation`, `source_file`
   - section numbers are monotonic within each Part, or exceptions are listed
   - a manual spot-check of at least 3 random Parts against the source

## Never
- Never rewrite or "clean up" legal wording. Whitespace and hyphenation repair only, and log what was changed.
- Never fill in missing text from memory. If text is missing, create a `TODO_SOURCE` note.
- Never use fixed-size character chunking.

## Report back
Number of units per instrument, any parse failures, ambiguous numbering cases, and the spot-check results.
