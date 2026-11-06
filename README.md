# Sri Lanka Motor Traffic Law Assistant (RAG)

A citation-grounded legal information assistant for Sri Lanka's **Motor Traffic Act No. 14 of 1951**, its amendments, and related gazette regulations.

A citizen asks a question in plain English, for example *"How many days do I have to pay a spot fine?"*. The system:

1. checks whether the question is about motor traffic law, and refuses if it is not,
2. finds the relevant legal sections using hybrid search (meaning-based + keyword),
3. writes a plain-language answer **only from the retrieved legal text**,
4. cites the exact section (e.g. *Section 112(1)(a)*) and shows the original wording,
5. says *"I could not find a relevant provision"* instead of guessing.

> ⚠️ **Disclaimer:** This tool provides **legal information, not legal advice**. Always confirm with the official Act or a qualified lawyer.

This is an individual undergraduate final-year project (BSc Computer Science with AI). It is research-focused: every design choice is measured against an evaluation set.

---

## Research questions

| # | Question | Measured by |
|---|---|---|
| RQ1 | Can RAG retrieve the correct legal section for a citizen's question? | Precision@k, Recall@k, MRR |
| RQ2 | Does strict grounding reduce hallucination compared with a plain LLM? | Faithfulness score (0–2), invented-number rate |
| RQ3 | Can the system tell in-scope from out-of-scope questions and refuse correctly? | Scope-refusal rate, false-refusal rate |

---

## How it works

```
Question (React UI) ──► FastAPI /ask
                          │
                  1. scope_check ──────────── out of scope ──► refuse
                          │ in scope
                  2. rewrite_and_retrieve
                     Chroma (dense) + BM25, fused with RRF (k = 60), top 8
                          │
                  3. confidence_gate ──────── low score ─────► not_found
                          │ passes
                  4. generate (gpt-4o-mini, temperature 0, grounded prompt)
                          │
                     citation & number verifier (1 retry, then safe fallback)
                          │
                  5. respond → status, answer, citations, disclaimer
```

- **Citation check:** every cited section ID must exist in the corpus and be in the retrieved set.
- **Number check:** every fine amount or number in the answer must appear in the retrieved text.
- If verification fails twice, the system returns a safe message instead of an unverified answer.

### Tech stack

| Layer | Tool |
|---|---|
| Language | Python 3.11+ |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector store | Chroma (local, persistent) |
| Keyword search | BM25 (`rank_bm25`) |
| Orchestration | LangGraph |
| Generator LLM | OpenAI `gpt-4o-mini` |
| Backend | FastAPI |
| Frontend | React + Vite + Tailwind CSS |
| Tests / lint | pytest, ruff |

---

## Corpus

**991 verified section records** in `DATA/processed/sections.jsonl`, built from:

- the consolidated Motor Traffic Act No. 14 of 1951 (520 records),
- 18 gazette regulations: speed limits, spot fines, fees, traffic signs, vehicle noise, etc. (461 records),
- 3 procedural guides on registration, foreign licences, and spot-fine payment and appeals (10 records).

The 7 amending Acts are also kept in `DATA/raw/amendments/` as source documents.

All source documents and their origins are listed in [`DATA/raw/SOURCES.md`](DATA/raw/SOURCES.md). No legal text was written from memory. Every record traces back to a file in `DATA/raw/`.

---

## Results (frozen test set, 42 questions)

| Metric | Ungrounded baseline (gpt-4o-mini alone) | This system |
|---|---|---|
| Mean faithfulness (0–2) | 0.333 | **1.929** |
| Answers with an invented number | 32 / 42 (76.2%) | **0 / 42 (0%)** |
| Out-of-scope questions refused | 0 / 7 | **7 / 7** |

Retrieval (hybrid + query rewrite, 30 questions with gold sections): **MRR 0.391, Recall@5 0.467**.

The full results and the error analysis are in [`reports/`](reports/) and in the final report, [`reports/Final_Report_IU_Amarasinghe.docx`](reports/Final_Report_IU_Amarasinghe.docx).

**Known limitations:** retrieval accuracy is moderate, so some valid questions get *"not found"* rather than a wrong answer. The scope check sometimes refuses questions on closely related law. The LLM judge (gpt-4o) is from the same vendor as the generator.

---

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+
- An OpenAI API key

### 1. Install

```bash
git clone https://github.com/isuruamarasingheu/rag-motor-traffic.git
cd rag-motor-traffic

python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
npm install                      # root: runs backend + frontend together
npm install --prefix frontend
```

### 2. Add your API key

Copy `.env.example` to `.env` and add your key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

`.env` is git-ignored. Never commit it.

### 3. Build the search index

The processed corpus is included in the repo. The Chroma and BM25 indexes are not, so build them once:

```bash
python -m src.index.build
```

This calls the OpenAI embeddings API for all 991 sections.

### 4. Run the app

```bash
npm run dev
```

This starts the FastAPI backend on `http://127.0.0.1:8005` and the React frontend on `http://localhost:5173`.

To run them separately:

```bash
uvicorn src.api.main:app --host 127.0.0.1 --port 8005 --reload
```

```bash
npm run dev --prefix frontend
```

---

## Features

- **Ask a question:** grounded answers with section citations and a "Source" panel that shows the verbatim legal text.
- **Statute library:** browse the Act, amendments and gazettes, and open the official PDFs.
- **Fine calculator:** look up spot-fine amounts from the fine schedule.
- **Chat history:** saved locally in the browser only. No user accounts, and queries are not sent anywhere except the OpenAI API.

### API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/ask` | Ask a question → `status`, `answer`, `citations`, `disclaimer` |
| GET | `/sections` | List corpus sections |
| GET | `/fines` | Fine schedule |
| GET | `/resources`, `/resources/{id}` | Statute library catalogue |
| GET | `/pdf/{id}` | Stream an official PDF |

Example response from `/ask`:

```json
{
  "status": "answered | refused_out_of_scope | not_found",
  "answer": "plain-language text or null",
  "citations": [{"id": "...", "citation": "...", "text": "verbatim source text"}],
  "disclaimer": "This is legal information, not legal advice..."
}
```

---

## Evaluation

```bash
python -m src.eval.run --set dev
```

```bash
python -m src.eval.run_frozen_benchmark
```

```bash
python -m src.eval.run_baseline
```

- The **dev set** (`DATA/eval/dev/`, 18 questions) was used during development.
- The **frozen set** (`DATA/eval/frozen/`, 42 questions) was used only for the final results and was not edited after freezing.
- Faithfulness is scored 0–2 by an LLM judge (gpt-4o), checked against human scoring with Cohen's weighted kappa (see `reports/inter_rater_reliability.md`).

---

## Tests

```bash
pytest -q
```

```bash
ruff check .
```

---

## Project structure

```
rag-motor-traffic/
├── configs/base.yaml        # models, top-k, RRF weights, confidence thresholds
├── DATA/
│   ├── raw/                 # original Acts, gazettes, guides (read-only) + SOURCES.md
│   ├── interim/             # OCR output awaiting verification
│   ├── processed/           # verified section records (sections.jsonl), fine schedule
│   └── eval/                # dev and frozen question sets, rubrics, scoring sheets
├── src/
│   ├── ingest/              # PDF text extraction, OCR, number checks
│   ├── chunking/            # structure-aware section parsing
│   ├── index/               # embeddings, Chroma, BM25
│   ├── retrieval/           # dense, BM25, hybrid (RRF), query rewrite
│   ├── graph/               # LangGraph pipeline (scope → retrieve → gate → generate)
│   ├── generation/          # grounded prompts, confidence gate, citation verifier
│   ├── api/                 # FastAPI app
│   └── eval/                # metrics, LLM judge, benchmarks, baseline
├── frontend/                # React + Tailwind UI
├── tests/                   # pytest suite
└── reports/                 # evaluation outputs and the final report
```

---

## Scope and boundaries

- **English only.** Sinhala and Tamil are future work.
- **One domain only:** Sri Lankan motor traffic law.
- Uses only publicly available legal text. No personal data is collected.

## Author

**I U Amarasinghe** (KIC-BSCCSAI-251P-042), BSc (Hons) Computer Science with Artificial Intelligence. Final-year project, 2026.
