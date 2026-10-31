---
name: rag-eval
description: Runs and reports evaluation for the legal RAG system - retrieval metrics (precision@k, recall@k, MRR), answer faithfulness (rubric, LLM judge, inter-rater agreement), and scope-restriction rate, plus baseline comparison. Use whenever retrieval, prompts, thresholds or models change, or when producing results tables.
---

# RAG Evaluation

## Ground rules
- **Dev set** (`data/eval/dev/`) is for tuning. **Frozen set** (`data/eval/frozen/`) is for final results only. Never tune on the frozen set. If frozen results look bad, record them honestly and report; do not adjust the system and re-run silently.
- Every result file records: date, git commit hash, config (models, k, thresholds, prompt version), question set name, and the question set checksum.
- Fix random seeds. Cache LLM judge outputs so re-runs are reproducible.

## 1. Retrieval metrics
For each in-scope question with `gold_sections`:
- **precision@k**, **recall@k** for k in {1, 3, 5}
- **MRR** (rank of the first correct section)
- Report **per question type** (in_scope, edge) and overall
- Compare variants in one table: dense, BM25, hybrid, hybrid + query rewrite
- Out-of-scope questions are excluded from retrieval metrics

## 2. Scope-restriction rate
`correct_refusals / out_of_scope_questions` and also the false-refusal rate on in-scope questions (`wrongly_refused / in_scope_questions`). Report both; refusing everything must not look good.

## 3. Faithfulness
Faithfulness = every claim in the answer is supported by the retrieved text, and the cited section is the one supporting it.
- **Rubric** (score each answer): 2 = fully supported, correct citation; 1 = minor unsupported detail or imprecise citation; 0 = contradicts or invents content, or wrong citation. Also record a flag for `invented_number` (any figure not in retrieved text).
- **Human scoring** by the researcher on a defined sample (generate a blank scoring sheet CSV: question, answer, retrieved text, score, notes).
- **Second rater** on a subset; compute Cohen's kappa (or weighted kappa for the 0-2 scale).
- **LLM judge** from a **different model family** than the generator, prompted with the rubric, retrieved text and answer; temperature 0; output JSON `{score, unsupported_claims}`. Report agreement between judge and human on the shared sample before trusting the judge.

## 4. Baselines and comparisons
- **Ungrounded baseline**: same generator model, same questions, no retrieval. Score faithfulness against the true source text from the corpus, and scope behaviour.
- **Existing tools** (LankaLAW, Aythiya): tested manually; store raw outputs. Compare on faithfulness and scope-refusal only (retrieval metrics do not apply to black-box tools).

## 5. Reporting
Write to `reports/<date>_<set>/`:
- `summary.md` with the main tables
- `per_question.csv` with every question's outcome
- `errors.md` with failures grouped into: retrieval miss, chunking problem, OCR/corpus error, generation distortion, wrong citation, gate threshold, scope misclassification
- Small sample sizes: include counts alongside percentages (e.g. 41/50), and a confidence interval where reasonable. Avoid claiming differences that are within noise.

## Never
- Never change gold labels to make results look better.
- Never report metrics without saying which question set and commit they came from.
