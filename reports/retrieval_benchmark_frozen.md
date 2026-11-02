# Retrieval Benchmark Report (FROZEN Set)

- **Date**: 2026-11-01 16:41:24
- **Git Commit**: `5a47174`
- **Question Set**: `frozen` (`data\eval\frozen\questions.jsonl`)
- **Questions SHA-256**: `b0733bf5655abe1424c80709657a92f3c91145fa6458607ee3f1508432ce55f3`
- **RRF Constant k**: 60
- **Weights**: Dense=0.5, BM25=0.5

## Comparative Overall Performance

| Variant | MRR | P@1 | R@1 | P@3 | R@3 | P@5 | R@5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dense only | 0.3800 | 0.2667 | 0.2167 | 0.2222 | 0.3833 | 0.1733 | 0.4667 |
| BM25 only | 0.2594 | 0.1667 | 0.1167 | 0.1444 | 0.2833 | 0.1067 | 0.3667 |
| Hybrid (RRF) | 0.3622 | 0.2667 | 0.1833 | 0.1778 | 0.3500 | 0.1400 | 0.4000 |
| Hybrid + Rewrite | 0.3911 | 0.2667 | 0.1833 | 0.2111 | 0.3500 | 0.1800 | 0.4667 |

## Analysis Notes
- **Dense only**: Captures semantic intent when the user asks conceptual questions without exact legal terminology.
- **BM25 only**: Excels when exact legal references or numbers are queried.
- **Hybrid (RRF)**: Merges both representations to achieve high precision and top-1 ranking.
- **Hybrid + Rewrite**: Bridges informal Sri Lankan colloquial terms into formal statutory vocabulary.
