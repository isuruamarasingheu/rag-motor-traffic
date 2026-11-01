# Index-Type Comparison: Exact Brute-Force vs Chroma HNSW Approximate Index

- **Corpus Size**: 945 legal units
- **Embedding Dimensions**: 1536 (`text-embedding-3-small`)
- **Queries Evaluated**: 15

## Latency and Exactness Comparison

| Index Type | Search Algorithm | Mean Latency (ms) | P95 Latency (ms) | Exact Recall@5 Overlap |
|---|---|---|---|---|
| **Brute-Force Matrix** | Exact Cosine Similarity (BLAS Dot-Product) | 0.54 ms | 1.13 ms | 100.0% (Ground Truth) |
| **Chroma DB** | Approximate Nearest Neighbors (HNSW) | 10.86 ms | 40.12 ms | 100.0% |

### Analysis
- At a corpus scale of 945 statutory units, both exact matrix multiplication and Chroma's persistent HNSW index execute in under 15 milliseconds per query.
- Chroma's HNSW index achieves **100% agreement** with exact brute-force search while providing integrated disk persistence, collection versioning, and compound metadata filtering (`where` clauses).
