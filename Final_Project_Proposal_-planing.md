# . Introduction

## 2.1 Background Information

Access to justice for ordinary citizens in Sri Lanka is significantly constrained by the inaccessibility of legal information. Legislation, gazetted regulations, and their amendments are dispersed across sources such as the Department of Government Printing, LawNet, and CommonLII, and are written in dense legal English that is difficult for a lay citizen to interpret without professional assistance. This problem is compounded in everyday situations such as a traffic offence for example, a rider fined for an overly loud motorcycle silencer typically has no accessible means of finding the applicable decibel limit, the section of law under which the fine was issued, or the correct appeal procedure.

Retrieval-Augmented Generation (RAG) has emerged as the dominant technique for grounding large language model outputs in verified external sources rather than the model's own parametric memory, substantially reducing hallucination in knowledge-intensive tasks (Patrick, et al., 2020) demonstrated that combining a pre-trained dense retriever with a pre-trained seq2seq generator produces more specific, diverse, and factually accurate responses than a purely parametric language model, and critically for a legal domain subject to periodic amendment showed that the retrieval index can be "hot-swapped" to update the system's knowledge without retraining the generator itself. This foundational architecture has since been adapted extensively for legal question-answering, where unverified or fabricated answers carry serious real-world consequences.

(Wiratunga, et al., 2024) in work involving a Sri Lanka-affiliated researcher extended this architecture by introducing CBR-RAG, which structures RAG retrieval using Case-Based Reasoning techniques. Using a dual-embedding representation (combining question-to-question "intra" similarity with question-to-evidence "inter" similarity), and evaluating three embedding backbones (BERT, LegalBERT, and AnglEBERT) on the Australian Open Legal QA dataset, they found that a hybrid AnglEBERT configuration significantly outperformed both a non-retrieval baseline and the domain-specific LegalBERT variant. This result is instructive for the present project: it suggests that careful retrieval structuring and embedding choice can matter more than domain-specific pre-training alone, and that the composition of the case representation (question, supporting evidence, and extracted entities) directly affects downstream answer quality a design consideration directly applicable to structuring retrieval units from the Motor Traffic Act and its subsidiary regulations.

Separately (Li, Bhambhoria, Dahan, & Zhu, 2024) showed that retrieval from a small, curated set of under 1,000 legal-expert-approved documents matched or outperformed retrieval from the entire internet on real layperson legal questions, framing their work explicitly around improving access to justice. This finding directly supports narrowing the present project's scope to a single, well-curated legal domain the Motor Traffic Act rather than attempting broad legal coverage, since a small but rigorously verified corpus can plausibly deliver comparable or superior retrieval accuracy to a broader but less-curated one.

Narrow, domain-specific legal chatbots have also been successfully implemented and rigorously evaluated elsewhere. (Socatiyanurak, 2021) developed LAW-U, an AI chatbot providing legal guidance to survivors of sexual violence in Thailand, which matched user queries against a curated set of 182 annotated Supreme Court cases rather than attempting general legal coverage. Their work demonstrates that a narrowly scoped, sensitively designed legal chatbot can be built and evaluated with academic rigour even using a comparatively small, expert-curated dataset a structural precedent that supports the present project's decision to scope narrowly to Motor Traffic Law rather than general legal coverage, and to prioritise data quality over corpus size.

Most directly relevant to this proposal, (Athulathmudali, 2025) applied RAG with large language models specifically to Sri Lankan civil-law guidance, developing a curated dataset of expert-validated legal scenarios and comparing two generation backends GPT-3.5-Turbo and the open-source Mistral-7B-v0.1 under identical retrieval conditions. The study found that GPT-3.5-Turbo achieved 92.5% accuracy at a latency of 4.17 seconds and the lowest cost per correct response, while Mistral-7B-v0.1 achieved a competitive 82.5% accuracy with the added benefit of full data sovereignty, better suiting institutional deployments prioritising privacy over responsiveness. This study confirms both that RAG is a technically viable and empirically validated approach for Sri Lankan statutory and civil-law guidance, and that the choice of generation backend produces a measurable, non-trivial accuracy trade-off in this specific jurisdiction a trade-off the present project must also account for when selecting its own generation model. However, (Athulathmudali, 2025) evaluation addressed civil-law scenarios broadly and did not report citation-level faithfulness hat is, whether the system's answer could be traced to a specific Act section or subsection with precision. This is a critical gap in a domain such as motor traffic law, where the exact clause determines a citizen's legal exposure (for example, the specific decibel threshold that separates a compliant vehicle from a finable offence).

In practice, deployed Sri Lankan legal-technology products have not yet closed this gap. Preliminary testing conducted for this proposal found that at least one widely used platform's "AI Assistant" feature answers general-knowledge questions entirely unrelated to law (e.g., geography or programming queries) without any scope restriction, suggesting it functions as an ungrounded general-purpose language model rather than a system retrieving from verified legal text. By contrast, a document-drafting assistant on the same platform correctly refused an out-of-scope query, showing that scope-restriction is achievable but has not been consistently applied to legal-information Q&A. This inconsistency combined with the absence, in the literature reviewed above, of a rigorously evaluated, citation-grounded, single-domain legal assistant for a high-stakes, penalty-bearing area of Sri Lankan law motivates the present study.

## 2.2 Research Problem

Ordinary Sri Lankan citizens who encounter a specific legal problem such as a motor traffic offence have no reliable, citation-grounded tool to determine which law applies, what the specific technical thresholds or penalties are, and what procedural steps to take next. Existing AI-branded legal-assistance tools in Sri Lanka either lack topical scope restriction (answering unrelated general-knowledge questions, indicating no grounding in actual statutory text) or are oriented toward legal professionals and document drafting rather than citizen-facing statutory Q&A. There is currently no publicly available system that is (a) restricted in scope to verified Sri Lankan legal text, (b) capable of citing the precise Act section or gazette regulation supporting its answer, and (c) rigorously evaluated for retrieval accuracy and answer faithfulness.

## 2.3 Rationale

The Motor Traffic Act No. 14 of 1951 and its subsidiary regulations govern an extremely high-frequency citizen interaction vehicle registration, licensing, and traffic offences yet the technical detail that determines the outcome of a specific case (for example, the permissible noise-emission threshold for an exhaust/silencer) typically resides in gazette regulations made under the Act rather than in the Act's text itself, making it particularly difficult for citizens to locate. Building a narrowly scoped, rigorously evaluated legal-information assistant for this single domain allows for a depth of data curation and evaluation that broader, general-purpose legal chatbots have not demonstrated. This addresses a genuine access to justice gap, provides measurable value to citizens facing everyday traffic related legal problems, and constitutes a technically sound contribution combining natural language processing, information retrieval, and applied AI evaluation appropriate in scope and rigor for an individual undergraduate capstone project.

To maintain a feasible scope for an individual undergraduate capstone, this project will operate as an English-language system the underlying legal corpus, user queries, and generated answers will all be in English. While the multilingual accessibility problem discussed above is a central motivation for this line of work, verifying the translation accuracy of legal text into Sinhala and Tamil is itself a substantial research problem particularly given documented risks of critical meaning loss in machine-translated legal and medical instructions in low-resource languages. Attempting to solve both the retrieval-grounding problem and the cross-lingual translation-verification problem within a single undergraduate timeline would risk under-delivering on both. English-only scope is therefore stated as an explicit, deliberate boundary condition of this study, with cross-lingual (Sinhala/Tamil) query support for example, translating an incoming query to English for retrieval, then translating the grounded answer back proposed as a clearly identified direction for future work.

# 

# 3\. Objectives

## Primary/Overall Objective

To design, implement, and evaluate an AI-powered, citation-grounded legal-information assistant that answers citizen queries relating to Sri Lanka's Motor Traffic Act and its subsidiary regulations, retrieving and citing the precise applicable legal provision rather than generating unverified responses.

## Specific Research Objectives

| **Objective** | **Description** |
| --- | --- |
| **Specific Objective 1** | To compile and structure a verified digital corpus of the Sri Lanka Motor Traffic Act No. 14 of 1951, its amendments, and subsidiary gazette regulations (e.g., noise-emission and vehicle-fitness standards) suitable for machine retrieval. |
| **Specific Objective 2** | To design and implement a retrieval-augmented generation (RAG) pipeline that retrieves the correct statutory or regulatory section in response to a citizen's natural-language query. |
| **Specific Objective 3** | To implement a citation-grounded answer-generation module that produces plain-language explanations strictly derived from retrieved legal text, with explicit section citation and refusal on out-of-scope queries. |
| **Specific Objective 4** | To evaluate the system's retrieval accuracy and answer faithfulness against a hand-labelled test set, and benchmark it against existing tools (LankaLAW AI Assistant, Aythiya). |

# 

# 4\. Proposed Research Methods

## 4.1 General Description of the Study Field

This study lies at the intersection of Natural Language Processing (NLP), Information Retrieval (IR), and applied legal-technology (LegalTech). It applies retrieval-augmented generation (RAG) a technique in which a large language model's output is grounded in text retrieved from a verified external corpus rather than generated purely from the model's trained parameters to the domain of Sri Lankan statutory and regulatory text.

## 4.2 Research Questions

-   RQ1: Can a RAG-based system retrieve the correct section of the Motor Traffic Act or its subsidiary regulations for a given natural-language citizen query with high accuracy?
-   RQ2: Does grounding answer generation strictly in retrieved statutory text reduce hallucination and improve faithfulness compared to an ungrounded general-purpose language model answering the same legal queries?
-   RQ3: Can the system reliably distinguish in scope (Motor Traffic Law) queries from out-of-scope queries and respond appropriately (i.e., refuse or redirect) in the latter case?

## 4.3 Methods for Data Collection

The primary legal corpus will be compiled from:

1.  The consolidated text of the Motor Traffic Act No. 14 of 1951 and its amendments, cross-verified between LawNet (the Ministry of Justice's official legal database) and CommonLII's section-indexed version.
2.  Subsidiary gazette regulations made under the Act relevant to common citizen queries (e.g., vehicle noise-emission limits, vehicle-fitness and registration requirements), sourced from the Department of Government Printing's gazette archive.
3.  Supplementary procedural information (e.g., fine payment and appeal procedures) from the Department of Motor Traffic and Sri Lanka Police public resources. Each legal document will be segmented into individually addressable sections to serve as retrieval units. A test-question set of approximately 50–80 realistic citizen queries (including edge cases and deliberately out-of-scope questions) will be manually constructed and labelled with the correct supporting section to serve as the evaluation ground truth.

A known technical challenge in this data collection process is that Sri Lankan government gazettes are frequently published as scanned image-based PDFs of variable print quality, rather than as machine-readable text. Where a subsidiary regulation is only available in this format, an OCR (Optical Character Recognition) step will be required prior to sectioning, along with manual verification of the extracted text against the original scanned document to catch OCR errors particularly for numerical values such as decibel limits or fine amounts, where a single misrecognized digit would compromise the accuracy of the entire system. This data-cleaning step is explicitly accounted for within the timeline (Section 5) and is treated as a first-class technical task rather than a trivial pre-processing formality.

## 4.4 Methods for Analysis of Data

Retrieved-section accuracy will be evaluated using standard information-retrieval metrics (precision@k, recall@k) against the manually labelled test set. Answer faithfulness whether the generated plain-language explanation accurately reflects the retrieved source text without distortion or fabrication will be assessed through a combination of methods to reduce single-rater bias, (i) manual review by the researcher against a defined faithfulness rubric; (ii) where feasible, independent review of a subset of answers by a peer using the same rubric, with inter-rater agreement calculated to assess evaluation reliability; and (iii) a supplementary automated “LLM-as-a-judge” evaluation, in which a separate large language model is prompted to assess whether the generated answer is fully supported by the retrieved source text, providing a scalable cross-check alongside the human evaluation. Scope-restriction performance will be measured as the proportion of out-of-scope test queries correctly identified and refused or redirected, rather than answered as if in-domain.

## 4.5 Methods for Implementation of the Solution

The system will be implemented as a web application with a Python-based backend and a React-based front end. Legal text (the Motor Traffic Act, its amendments, and relevant gazette regulations) will be segmented into individually addressable sections and converted into vector embeddings using OpenAI's text-embedding-3-small model, chosen for its strong general-purpose semantic performance and low computational cost at this corpus scale. These embeddings, along with structured metadata (Act name, section number, amendment date, regulation category), will be indexed and stored in Chroma, an open-source vector database that runs locally without external service dependency.

Given the strongly hierarchical structure of legal documents (Act → Part → Chapter → Section → Subsection), naive fixed-size character chunking is deliberately avoided, as it risks severing a subsection from its parent section header and context directly undermining the citation accuracy this project aims to achieve. Instead, a document-structure-aware chunking strategy will be used, in which each retrieval unit is defined by its actual legal-document hierarchy (e.g., retaining the full reference path such as “Section 112(1)(a)”) rather than an arbitrary character count, ensuring that retrieved context remains legally coherent and correctly attributable.

Given the relatively small scale of the corpus (an estimated few hundred to low-thousand indexed sections), retrieval will initially use a flat (brute-force) index to guarantee exact nearest-neighbor matching; as an additional technical contribution, retrieval will also be benchmarked against Chroma's built-in HNSW (Hierarchical Navigable Small World) approximate index to evaluate the trade-off between retrieval speed and accuracy, informing how the system could scale to a larger, multi-domain legal corpus in future work. Where appropriate, a hybrid retrieval approach combining semantic similarity search with keyword-based matching (BM25) will be explored, since legal queries frequently reference exact terms such as section numbers or defined statutory terms that pure semantic embeddings can under-weight.

The overall query pipeline (scope classification → retrieval → grounded answer generation → citation output, including a refusal path for out-of-scope queries) will be orchestrated using LangGraph, which supports explicit branching control flow more naturally than a purely linear chain, while still making use of LangChain's retriever and embedding integration components. Answer generation will use GPT-4o-mini, prompted under a strict grounding instruction to produce plain-language explanations derived only from retrieved section text, with mandatory citation of the exact section number, and explicit refusal when no relevant section is retrieved with sufficient confidence. The backend will be built using Python and FastAPI, exposing the retrieval-and-generation pipeline via a REST API. The front end will be built using React with Tailwind CSS, presenting the plain-language answer alongside the cited source section and a clear disclaimer that the system provides legal information rather than legal advice.

## 

## 4.6 Expected Results and Applications

-   Objective 1: A structured, verified, section-indexed digital corpus of the Motor Traffic Act and its relevant subsidiary regulations, reusable for future legal-NLP research in Sri Lanka.
-   Objective 2: A working retrieval pipeline demonstrating measurable retrieval accuracy on the constructed test set.
-   Objective 3: A citation-grounded answer-generation module with quantified faithfulness and scope-restriction performance.
-   Objective 4: A comparative benchmark showing how the proposed system performs against existing Sri Lankan legal-AI tools (LankaLAW AI Assistant, Aythiya) on the same test-question set, evidencing the contribution of this project.

## 4.7 Methods of Comparing Models and Results

To demonstrate the measurable benefit of the citation-grounded retrieval approach, the proposed RAG-based system will be benchmarked against two comparison points using the same labelled test-question set and identical evaluation metrics:

A baseline ungrounded LLM - the same large language model answering the identical test questions without access to the retrieval pipeline, relying only on its own trained knowledge. This isolates the specific contribution of retrieval grounding.

Existing publicly accessible Sri Lankan legal-AI tools - such as LankaLAW's AI Assistant and Aythiya, tested on the same question set to establish how the proposed system performs relative to currently available tools.

All three systems (the proposed system, the ungrounded baseline, and the existing tools) will be evaluated using identical metrics:

Retrieval accuracy — whether the correct Act section or regulation is retrieved for a given query (measured via precision@k and recall@k, as defined in Section 4.4).

Faithfulness — whether the generated answer accurately reflects the retrieved source text without distortion or fabrication.

Scope-restriction rate — the proportion of out-of-scope queries correctly identified and refused or redirected, rather than answered as if in-domain.

This comparative design allows the study to make a direct, evidence-based claim that grounding answer generation in a verified, citation-linked legal corpus produces measurably more accurate and trustworthy results than either an ungrounded general-purpose language model or existing Sri Lankan legal-AI tools evaluated under the same conditions.

## 4.8 Resources

This project requires a personal computer with internet access for development access to free-tier or low-cost large language model and embedding APIs (OpenAI); open-source software libraries (Python, LangGraph/LangChain, Chroma, FastAPI, React with Tailwind CSS) and access to publicly available legal databases (LawNet, CommonLII, Department of Government Printing gazette archive). No specialised laboratory space, proprietary datasets, or paid database subscriptions are required. As the study involves only publicly available legal text and does not involve human subjects, personal data collection, or clinical procedures, formal ethics approval is not anticipated to be required; this will be confirmed with the supervisor prior to commencement.

# 

# \\

# 6\. Status of Permits and Clearance

Not applicable. This project uses only publicly available legislative and regulatory text and does not involve human participants, personal data, animals, or environmentally sensitive fieldwork. No ethical clearance or external permits are anticipated to be required; this will be confirmed with the supervisor(s) at the outset of the project and revisited if the scope changes to include human-subject evaluation (e.g., a citizen usability pilot).

# 

# 7\. References

(n.d.).

Athulathmudali, A. (2025). AI for legal domain identification and guidance in Sri Lankan law. *International Journal of Innovative Science and Research Technology*.

Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., . . . Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *Advances in Neural Information Processing Systems*.

Li, J., Bhambhoria, R., Dahan, S., & Zhu, X. (2024). Experimenting with legal AI solutions: the case of question-answering for access to justice. *Proceedings of the 41st International Conference on Machine Learning (ICML 2024), PMLR 235*.

P. L., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., . . . Douwe Kiela. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *Advances in Neural Information Processing Systems*.

Socatiyanurak, V. a. (2021). IEEE Access. *LAW-U: Legal Guidance Through Artificial Intelligence Chatbot for Sexual Violence Victims and Survivors*.

Wiratunga, N., Abeyratne, R., Jayawardena, L., Martin, K., Massie, S., Nkisi-Orji, I., . . . Fleisch, B. (2024). CBR-RAG: case-based reasoning for retrieval-augmented generation in LLMs for legal question answering. *arXiv*.

# 8\. Annexure

## Ethical Clearance Application

Not applicable, as indicated in Section 6. This project uses only publicly available legislative and regulatory text sourced from LawNet, CommonLII, and the Department of Government Printing. It does not involve the collection, storage, or processing of personal data, human subjects, or any information relating to identifiable individuals. Should the scope of this project be extended in future work to include a citizen usability pilot (e.g., collecting feedback from real users), ethical clearance will be sought at that stage.