# Frozen Test Set Benchmark Report: Citation-Grounded Legal RAG

- **Dataset:** `questions.jsonl` (42 questions)
- **Dataset SHA-256:** `B0733BF5655ABE1424C80709657A92F3C91145FA6458607EE3F1508432CE55F3` (Frozen & Verified)
- **Git Commit:** `ac414ae`
- **Generator Model:** `gpt-4o-mini` | **Judge Model:** `gpt-4o`

## 1. Research Question 1 (RQ1): Retrieval Accuracy

Evaluation on in-scope statutory questions with verified gold citations:

| Metric | Value | Academic Standard |
|---|:---:|:---:|
| **Mean Reciprocal Rank (MRR)** | **0.1551** | Primary Rank Metric |
| **Precision @ 1 (P@1)** | **0.0667** | Top Rank Precision |
| **Recall @ 1 (R@1)** | **0.0333** | Top Rank Recall |
| **Precision @ 3 (P@3)** | **0.0778** | Top-3 Precision |
| **Recall @ 3 (R@3)** | **0.1333** | Top-3 Recall |
| **Precision @ 5 (P@5)** | **0.0533** | Top-5 Precision |
| **Recall @ 5 (R@5)** | **0.1667** | Top-5 Recall |

## 2. Research Question 2 (RQ2): Faithfulness & Hallucination Elimination

| Faithfulness Metric | Result | Benchmark Target |
|---|:---:|:---:|
| **Mean Faithfulness Score** | **1.929 / 2.000** | $\ge 1.800$ |
| **Fully Grounded Answers (Score 2)** | **40 / 42 (95.2%)** | High Grounding |
| **Invented Number Rate** | **0 / 42 (0.0%)** | Zero Hallucinated Numbers |

## 3. Research Question 3 (RQ3): Scope Restriction & Refusal Reliability

| Scope Metric | Count | Rate (%) |
|---|:---:|:---:|
| **Scope Restriction Rate (Correct Out-of-Scope Refusals)** | 7 / 7 | **100.0%** |
| **False Refusal Rate (Incorrectly Refused In-Scope)** | 6 / 35 | **17.1%** |

## 4. Itemized Query Results

| ID | Type | Expected | Actual Status | P@1 | R@5 | MRR | Judge Score | Inv Num | Citations |
|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `Q001` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.5000 | 0.5000 | **1** | False | Motor Traffic Act, Section 160; Gazette No. 1738/37, Schedule |
| `Q002` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.0000 | 0.0000 | **2** | False | Gazette No. 1775/32, Regulation 1 |
| `Q003` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.0000 | 0.0000 | **2** | False | Gazette No. 2455/29 |
| `Q004` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 1.0000 | 0.3333 | **2** | False | Gazette No. 2287/28, Regulation 2; Motor Traffic Act, Section 158 |
| `Q006` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.0000 | 0.0000 | **2** | False | Gazette No. 1775/32, Regulation 1; Gazette No. 2003/41, Regulation 5 |
| `Q007` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.5000 | 0.5000 | **2** | False | Procedural Guide, PG-POL-2 |
| `Q008` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.5000 | 0.5000 | **2** | False | Procedural Guide, PG-POL-2; Motor Traffic Act, Section 215A |
| `Q009` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.0000 | 0.0000 | **2** | False | Motor Traffic Act, Section 123(2); Motor Traffic Act, Section 124 |
| `Q011` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.0000 | 0.0000 | **2** | False | Procedural Guide, PG-DMT-4; Motor Traffic Act, Section 29 |
| `Q013` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.0000 | 0.0000 | **2** | False | Motor Traffic Act, Section 148(1); Motor Traffic Act, Section 148(4) |
| `Q014` | in_scope | `answer_with_citation` | `not_found` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q015` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.0000 | 0.0000 | **2** | False | Motor Traffic Act, Section 132 |
| `Q018` | in_scope | `answer_with_citation` | `not_found` | 0.0000 | 0.0000 | 0.1429 | **2** | False | None |
| `Q019` | in_scope | `answer_with_citation` | `not_found` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q021` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.0000 | 0.0000 | **2** | False | Motor Traffic Act, Section 12(2); Motor Traffic Act, Section 12(4); Procedural Guide, PG-DMT-2 |
| `Q023` | in_scope | `answer_with_citation` | `not_found` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q025` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.5000 | 0.3333 | **2** | False | Procedural Guide, PG-POL-1; Motor Traffic Act, Section 215A |
| `Q028` | in_scope | `answer_with_citation` | `not_found` | 0.0000 | 1.0000 | 0.2000 | **2** | False | None |
| `Q029` | in_scope | `answer_with_citation` | `not_found` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q031` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.0000 | 0.0000 | **2** | False | Motor Traffic Act, Section 141A |
| `Q033` | in_scope | `answer_with_citation` | `not_found` | 1.0000 | 0.5000 | 1.0000 | **2** | False | None |
| `Q034` | in_scope | `answer_with_citation` | `not_found` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q035` | in_scope | `answer_with_citation` | `answered` | 0.0000 | 0.0000 | 0.0000 | **2** | False | Gazette No. 1775/32, Regulation 1; Gazette No. 2003/41, Regulation 3 |
| `Q036` | edge | `answer_with_citation` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q037` | edge | `answer_with_citation` | `not_found` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q040` | edge | `answer_with_citation` | `not_found` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q041` | edge | `answer_with_citation` | `not_found` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q042` | edge | `answer_with_citation` | `not_found` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q044` | edge | `answer_with_citation` | `answered` | 1.0000 | 0.5000 | 1.0000 | **2** | False | Motor Traffic Act, Section 132B |
| `Q045` | edge | `answer_with_citation` | `answered` | 0.0000 | 0.0000 | 0.1429 | **0** | False | Motor Traffic Act, Section 152A |
| `Q046` | in_scope | `say_not_found` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q047` | in_scope | `say_not_found` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q048` | in_scope | `say_not_found` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q049` | in_scope | `say_not_found` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q050` | in_scope | `say_not_found` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q051` | out_of_scope | `refuse` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q052` | out_of_scope | `refuse` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q053` | out_of_scope | `refuse` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q055` | out_of_scope | `refuse` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q056` | out_of_scope | `refuse` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q057` | out_of_scope | `refuse` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |
| `Q059` | out_of_scope | `refuse` | `refused_out_of_scope` | 0.0000 | 0.0000 | 0.0000 | **2** | False | None |