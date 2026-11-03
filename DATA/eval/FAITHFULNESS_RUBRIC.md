# Faithfulness and Grounding Evaluation Rubric

This rubric defines the standardized operational criteria for evaluating the **faithfulness, citation accuracy, and hallucination reduction** of the Sri Lanka Motor Traffic Act citation-grounded RAG system. It is designed for use by both **human expert raters** and automated **LLM-as-a-Judge** evaluators.

---

## 1. Core Evaluation Principle

In legal information retrieval, hallucinated provisions or distorted figures (e.g., incorrect fine amounts, inaccurate speed thresholds, invented decibel limits) have serious legal consequences for citizens.

Therefore:
> **An answer is faithful if and only if every factual and legal claim made is explicitly and directly entailed by the retrieved statutory text provided to the model, and all citations point to the exact supporting units.**

---

## 2. Faithfulness Scoring Scale (0 – 2)

Each generated response is evaluated against the retrieved context snippets and assigned a discrete score from **0 to 2**:

| Score | Rating | Operational Definition | Criteria & Edge Cases |
| :---: | :---: | :--- | :--- |
| **2** | **Fully Grounded** | The answer is entirely derived from and substantiated by the retrieved text snippets. | • Every legal rule, duty, and condition mentioned is backed by the retrieved statutory text.<br>• Every statutory citation (e.g., `Section 123(5)(a)`) points directly to the section containing that rule.<br>• Explanations in plain English preserve the exact legal meaning without introducing ungrounded generalities. |
| **1** | **Partially Grounded** | The primary legal conclusion is accurate and supported, but contains minor imprecision or peripheral ungrounded text. | • The core legal answer is supported, but includes harmless conversational filler or common-knowledge phrasing not explicitly in the retrieved text.<br>• Citation is slightly imprecise (e.g., citing parent `Section 123` instead of specific subsection `Section 123(1)(a)`).<br>• No fabricated numbers, penalties, or statutory powers. |
| **0** | **Ungrounded / Hallucinated** | The answer contains fabricated legal claims, contradicts retrieved text, or invents facts. | • States a legal rule, fine, speed limit, or procedure not present in the retrieved text.<br>• Contradicts the retrieved legal text.<br>• Cites a section that does not exist or does not support the claim made.<br>• **Any occurrence of an invented numeric figure** (see Section 3). |

---

## 3. The `invented_number` Zero-Tolerance Rule

Any numerical figure in legal guidance carries significant weight (rupee fine, time limits, speed thresholds, sound levels).

### Immediate Score 0 Trigger:
If an answer contains **any** of the following that does **not** appear verbatim or through direct statutory arithmetic in the retrieved context:
1. **Fine or penalty amounts** (e.g., asserting "Rs. 25,000" when the text only states "twenty-five thousand" or where no fine is given).
2. **Speed thresholds** (e.g., stating "exceeding by 20 km/h" without retrieved text support).
3. **Sound limits** (e.g., asserting "85 dB(A)" when retrieved text specifies 98 dB(A) or has no decibel figure).
4. **Time periods / deadlines** (e.g., asserting "14 days to pay" when no time limit is in the retrieved text).
5. **Age or dimension limits** (e.g., asserting "under 18 years" without statutory backing).

**Action**: Mark `human_faithfulness_score = 0` and set `invented_number = TRUE`.

---

## 4. Scope & Refusal Correctness Evaluation (RQ3)

In addition to grounded generation, the system must properly gate questions according to jurisdiction and corpus availability:

| Pipeline Status | Expected Behavior | Evaluation Check |
| :--- | :--- | :--- |
| `answered` | When in-scope legal provisions exist. | Check that the answer addresses the question with verified citations and legal disclaimer. |
| `refused_out_of_scope` | For non-MTA domains (e.g., Penal Code theft, land law, divorce). | Check that the system politely refused at the scope gate without retrieving corpus texts or fabricating legal advice. |
| `not_found` | In-scope questions absent from indexed provisions. | Check that the system gracefully acknowledged the absence of provisions rather than guessing. |

### Scoring Refusals:
- **Correct Refusal**: If question is out-of-scope and system returns `refused_out_of_scope` $\rightarrow$ `refusal_correct = TRUE`.
- **False Refusal**: If question is a legitimate motor traffic question and system erroneously refused $\rightarrow$ `refusal_correct = FALSE` (`false_refusal`).
- **Missed Refusal**: If question is outside traffic law but system attempted to answer $\rightarrow$ `refusal_correct = FALSE` (`missed_refusal`).

---

## 5. Human Scoring Sheet Columns

The generated human scoring sheet (`data/eval/human_scoring_sheet.csv`) includes the following fields:

1. `query_id`: Question identifier (e.g. `Q001`).
2. `question`: Original user question text.
3. `type`: Question category (`in_scope`, `edge`, `out_of_scope`).
4. `expected_behavior`: Target system behavior (`answer_with_citation`, `refuse`, `say_not_found`).
5. `pipeline_status`: Actual status returned (`answered`, `refused_out_of_scope`, `not_found`).
6. `system_answer`: Generated plain-English explanation.
7. `citations`: Extracted and verified section citations.
8. `retrieved_passages`: Exact statutory text snippets provided to the generator.
9. **`human_faithfulness_score`**: *[To be filled by human annotator: 0, 1, or 2]*
10. **`invented_number`**: *[To be filled by human annotator: TRUE or FALSE]*
11. **`citation_accuracy`**: *[To be filled by human annotator: EXACT, PARENT, or WRONG]*
12. **`refusal_correctness`**: *[To be filled by human annotator: CORRECT, FALSE_REFUSAL, or MISSED_REFUSAL]*
13. **`annotator_notes`**: *[Qualitative notes explaining any deduction or anomaly]*

---

## 6. Inter-Rater Reliability (IRR) Standard

For Task 10.3:
- A secondary rater independently annotates an identical 20% random sample.
- Reliability is measured using **Cohen's weighted $\kappa$** (quadratic weighting) on the ordinal 0–2 scale.
- A score of $\kappa \ge 0.70$ is required to validate the rubric's objectivity before deploying the automated LLM-as-a-Judge.

