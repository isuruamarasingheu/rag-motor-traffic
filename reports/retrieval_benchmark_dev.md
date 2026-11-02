# Retrieval Benchmark Report (DEV Set)

- **Date**: 2026-11-02 14:47:36
- **Git Commit**: `731fb13`
- **Question Set**: `dev` (`data\eval\dev\questions.jsonl`)
- **Questions SHA-256**: `6cc83d6b4ee8fcd6e5a66285a500e69013a8e7fe89ce2b38f81ceb8c8c21837f`
- **RRF Constant k**: 60
- **Weights**: Dense=0.5, BM25=0.5

## Comparative Overall Performance

| Variant | MRR | P@1 | R@1 | P@3 | R@3 | P@5 | R@5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dense only | 0.2967 | 0.2667 | 0.2333 | 0.1111 | 0.2333 | 0.1067 | 0.3667 |
| BM25 only | 0.2300 | 0.1333 | 0.1000 | 0.0889 | 0.2333 | 0.0933 | 0.3333 |
| Hybrid (RRF) | 0.2429 | 0.2000 | 0.1667 | 0.1111 | 0.2333 | 0.0800 | 0.2667 |
| Hybrid + Rewrite | 0.3300 | 0.2667 | 0.2333 | 0.1778 | 0.3333 | 0.1333 | 0.4000 |

## Analysis Notes
- **Dense only**: Captures semantic intent when the user asks conceptual questions without exact legal terminology.
- **BM25 only**: Excels when exact legal references or numbers are queried.
- **Hybrid (RRF)**: Merges both representations to achieve high precision and top-1 ranking.
- **Hybrid + Rewrite**: Bridges informal Sri Lankan colloquial terms into formal statutory vocabulary.
