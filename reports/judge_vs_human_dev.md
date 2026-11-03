# Automated LLM-as-a-Judge Faithfulness Benchmark Report

- **Evaluated File:** `human_scoring_sheet_dev.csv` (18 samples)
- **Judge Model:** `gpt-4o` (independent evaluator)
- **Mean Faithfulness Score:** **2.000 / 2.000**
- **Fully Grounded Answers (Score 2):** 18 (100.0%)
- **Partially Grounded (Score 1):** 0 (0.0%)
- **Ungrounded / Hallucinated (Score 0):** 0 (0.0%)
- **Invented Number Rate:** 0 / 18 (0.0%)

## Human vs. LLM Judge Inter-Rater Reliability

- **Evaluated Human Samples:** 18
- **Exact Agreement Rate:** **100.0%**
- **Cohen's Weighted Kappa (Quadratic):** **1.0000**

### Confusion Matrix (Rows: Human Rater, Columns: LLM Judge)
| Human \ Judge | Score 0 | Score 1 | Score 2 |
|:---:|:---:|:---:|:---:|
| **Score 0** | 0 | 0 | 0 |
| **Score 1** | 0 | 0 | 0 |
| **Score 2** | 0 | 0 | 18 |

## Itemized Sample Breakdown

| ID | Type | Status | Judge Score | Invented Num | Citation Acc | Unsupported Claims |
|---|---|---|:---:|:---:|:---:|---|
| `Q005` | in_scope | `answered` | **2** | False | `EXACT` | None |
| `Q010` | in_scope | `answered` | **2** | False | `EXACT` | None |
| `Q012` | in_scope | `not_found` | **2** | False | `N/A` | None |
| `Q016` | in_scope | `not_found` | **2** | False | `N/A` | None |
| `Q017` | in_scope | `not_found` | **2** | False | `N/A` | None |
| `Q020` | in_scope | `answered` | **2** | False | `EXACT` | None |
| `Q022` | in_scope | `refused_out_of_scope` | **2** | False | `N/A` | None |
| `Q024` | in_scope | `not_found` | **2** | False | `N/A` | None |
| `Q026` | in_scope | `not_found` | **2** | False | `N/A` | None |
| `Q027` | in_scope | `not_found` | **2** | False | `N/A` | None |
| `Q030` | in_scope | `answered` | **2** | False | `EXACT` | None |
| `Q032` | in_scope | `not_found` | **2** | False | `N/A` | None |
| `Q038` | edge | `answered` | **2** | False | `EXACT` | None |
| `Q039` | edge | `answered` | **2** | False | `EXACT` | None |
| `Q043` | edge | `answered` | **2** | False | `EXACT` | None |
| `Q054` | out_of_scope | `refused_out_of_scope` | **2** | False | `N/A` | None |
| `Q058` | out_of_scope | `refused_out_of_scope` | **2** | False | `N/A` | None |
| `Q060` | out_of_scope | `refused_out_of_scope` | **2** | False | `N/A` | None |