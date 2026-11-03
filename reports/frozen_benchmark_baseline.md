# Ungrounded Baseline Benchmark Report (gpt-4o-mini without RAG)

- **Dataset:** `questions.jsonl` (42 questions)
- **Dataset SHA-256:** `B0733BF5655ABE1424C80709657A92F3C91145FA6458607EE3F1508432CE55F3`
- **Model:** `gpt-4o-mini` (Zero Retrieval / Parametric Memory Only)
- **Judge Model:** `gpt-4o` (Audited against authentic corpus text)

## Baseline Performance Summary (Direct Comparison to RAG)

| Metric | Ungrounded Baseline | Grounded RAG Target |
|---|:---:|:---:|
| **Mean Faithfulness Score** | **0.333 / 2.000** | 2.000 / 2.000 |
| **Fully Grounded Answers** | **7 / 42 (16.7%)** | ~100% |
| **Invented Number / Hallucination Rate** | **32 / 42 (76.2%)** | 0.0% |
| **Scope Refusal Rate (Out-of-Scope)** | **0 / 7 (0.0%)** | 100.0% |

## Itemized Query Audit

| ID | Type | Faithfulness Score | Invented Number | Citation Acc | Reasoning Snippet |
|---|---|:---:|:---:|:---:|---|
| `Q001` | in_scope | **0** | True | `N/A` | The generated answer provides a specific sound limit of 80 decibels for motorcycle silence... |
| `Q002` | in_scope | **0** | True | `WRONG` | The generated answer claims a general speed limit of 50 km/h in built-up areas and referen... |
| `Q003` | in_scope | **0** | True | `WRONG` | The answer claims that Section 192 of the Motor Traffic Act mandates seat belt use for all... |
| `Q004` | in_scope | **0** | True | `WRONG` | The retrieved passage specifies that helmets must conform to the Sri Lanka Standard Specif... |
| `Q006` | in_scope | **0** | True | `WRONG` | The generated answer claims a specific speed limit of 50 km/h for three-wheelers on normal... |
| `Q007` | in_scope | **2** | False | `EXACT` | The generated answer correctly states that you have a period of 14 days (two weeks) to pay... |
| `Q008` | in_scope | **0** | True | `WRONG` | The retrieved passage from Section 215A of the Motor Traffic Act specifies that spot fines... |
| `Q009` | in_scope | **0** | True | `N/A` | The answer provides a specific age requirement and cites a section of the Motor Traffic Ac... |
| `Q011` | in_scope | **0** | True | `WRONG` | The generated answer discusses emission test requirements, standards, and penalties, but n... |
| `Q013` | in_scope | **0** | True | `WRONG` | The answer claims that overtaking from the left is illegal under Section 122 of the Motor ... |
| `Q014` | in_scope | **0** | True | `N/A` | The answer lists specific documents that drivers must carry and produce, but there are no ... |
| `Q015` | in_scope | **0** | True | `N/A` | The answer provides a specific validity period of 3 months for a temporary driving permit ... |
| `Q018` | in_scope | **0** | True | `WRONG` | The generated answer claims that a three-wheeler can carry a maximum of three passengers a... |
| `Q019` | in_scope | **0** | True | `WRONG` | The generated answer claims that Section 77 of the Motor Traffic Act mandates the use of h... |
| `Q021` | in_scope | **0** | True | `N/A` | The answer provides a detailed process for changing the name in a vehicle's CR book, inclu... |
| `Q023` | in_scope | **0** | True | `WRONG` | The generated answer makes several claims that are not supported by the retrieved passages... |
| `Q025` | in_scope | **0** | False | `WRONG` | The retrieved passage from Section 215A of the Motor Traffic Act specifies that fines for ... |
| `Q028` | in_scope | **0** | True | `WRONG` | The generated answer discusses the advisability of laminating a revenue licence disc and p... |
| `Q029` | in_scope | **0** | True | `N/A` | The answer provides specific legal claims and numerical figures without any retrieved pass... |
| `Q031` | in_scope | **0** | True | `WRONG` | The generated answer claims a specific fine amount (LKR 2,500) for exceeding the speed lim... |
| `Q033` | in_scope | **0** | True | `WRONG` | The retrieved passage from Gazette No. 2287/28, Regulation 2, specifies that helmets must ... |
| `Q034` | in_scope | **0** | True | `N/A` | The answer provides a detailed procedure and time limit for transferring vehicle ownership... |
| `Q035` | in_scope | **0** | True | `WRONG` | The generated answer includes several claims about speed limits, safety gear, and addition... |
| `Q036` | edge | **0** | False | `WRONG` | The retrieved passage from Section 239 of the Motor Traffic Act does not address the appli... |
| `Q037` | edge | **0** | True | `WRONG` | The generated answer discusses the classification of electric bicycles and specific criter... |
| `Q040` | edge | **0** | True | `WRONG` | The answer provides a detailed distinction between reckless and negligent driving, but it ... |
| `Q041` | edge | **0** | True | `N/A` | The answer provides specific legal claims and numerical figures regarding the prohibition ... |
| `Q042` | edge | **0** | False | `WRONG` | The retrieved passage from Section 215A of the Motor Traffic Act discusses the use of spot... |
| `Q044` | edge | **0** | True | `WRONG` | The retrieved passage from Section 132A of the Motor Traffic Act does not mention any prov... |
| `Q045` | edge | **0** | True | `WRONG` | The retrieved passage from Section 152A of the Motor Traffic Act explicitly prohibits the ... |
| `Q046` | in_scope | **0** | True | `N/A` | The answer provides specific numerical ranges for import duties (0% to 30%) and mentions a... |
| `Q047` | in_scope | **0** | True | `N/A` | The answer provides a specific fare amount (LKR 60 per kilometer) and claims about regulat... |
| `Q048` | in_scope | **2** | False | `N/A` | The answer correctly identifies that the specific technical specifications for electronic ... |
| `Q049` | in_scope | **0** | True | `N/A` | The answer provides a detailed compensation formula and mentions a capped limit for compen... |
| `Q050` | in_scope | **2** | False | `N/A` | The answer correctly identifies that the structural requirements for roadside railway leve... |
| `Q051` | out_of_scope | **0** | True | `N/A` | The answer provides a detailed process for registering a deed for a residential land plot,... |
| `Q052` | out_of_scope | **0** | True | `N/A` | The answer provides specific sections and penalties from the Penal Code of Sri Lanka, but ... |
| `Q053` | out_of_scope | **2** | False | `N/A` | The answer provides a general overview of the process for filing a divorce based on malici... |
| `Q055` | out_of_scope | **2** | False | `N/A` | The question about the capital city of Australia is out of scope for a legal assistant spe... |
| `Q056` | out_of_scope | **2** | False | `N/A` | The question about registering a private limited company under the Companies Act of Sri La... |
| `Q057` | out_of_scope | **2** | False | `N/A` | The question about a recipe is out of scope for a legal assistant focused on Sri Lankan la... |
| `Q059` | out_of_scope | **0** | True | `N/A` | The answer discusses provisions of the Rent Act No. 7 of 1972, including a specific sectio... |