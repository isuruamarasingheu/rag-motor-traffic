"""Benchmark runner for legal RAG retrieval variants per skill rag-eval."""

from __future__ import annotations

import argparse
import csv
import datetime
import hashlib
import json
import logging
import subprocess
from pathlib import Path
from typing import Any

import yaml

from src.eval.retrieval import evaluate_retrieval_variant
from src.retrieval.bm25 import BM25Index
from src.retrieval.dense import DenseRetriever
from src.retrieval.hybrid import HybridRetriever
from src.retrieval.rewrite import QueryRewriter

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("eval.run")


def get_git_commit() -> str:
    """Retrieve current short git commit hash."""
    try:
        res = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        )
        return res.stdout.strip()
    except (subprocess.SubprocessError, FileNotFoundError, OSError):
        return "unknown"


def compute_file_sha256(path: Path | str) -> str:
    """Compute SHA-256 checksum of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()


def load_questions(questions_path: Path | str) -> list[dict[str, Any]]:
    questions = []
    with open(questions_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                questions.append(json.loads(line))
    return questions


def format_markdown_table(results: dict[str, dict[str, Any]]) -> str:
    """Format aggregated retrieval metrics into a GitHub Flavored Markdown table."""
    headers = ["Variant", "MRR", "P@1", "R@1", "P@3", "R@3", "P@5", "R@5"]
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]

    for variant_name, metrics in results.items():
        row = [
            variant_name,
            f"{metrics.get('mrr', 0.0):.4f}",
            f"{metrics.get('p@1', 0.0):.4f}",
            f"{metrics.get('r@1', 0.0):.4f}",
            f"{metrics.get('p@3', 0.0):.4f}",
            f"{metrics.get('r@3', 0.0):.4f}",
            f"{metrics.get('p@5', 0.0):.4f}",
            f"{metrics.get('r@5', 0.0):.4f}",
        ]
        lines.append("| " + " | ".join(row) + " |")

    return "\n".join(lines)


def run_benchmark(
    eval_set: str = "dev",
    config_path: str = "configs/base.yaml",
) -> None:
    with open(config_path, encoding="utf-8") as f:
        config = yaml.safe_load(f)

    paths = config.get("paths", {})
    retrieval_cfg = config.get("retrieval", {})

    top_k = retrieval_cfg.get("top_k", 5)
    rrf_k = retrieval_cfg.get("rrf_k", 60)
    dense_weight = retrieval_cfg.get("dense_weight", 0.5)
    bm25_weight = retrieval_cfg.get("bm25_weight", 0.5)

    if eval_set == "frozen":
        questions_file = (
            Path(paths.get("eval_frozen_dir", "data/eval/frozen")) / "questions.jsonl"
        )
        logger.warning(
            "RUNNING ON FROZEN EVALUATION SET. Ensure this is the final evaluation run."
        )
    else:
        questions_file = (
            Path(paths.get("eval_dev_dir", "data/eval/dev")) / "questions.jsonl"
        )

    if not questions_file.exists():
        raise FileNotFoundError(f"Questions file not found: {questions_file}")

    git_commit = get_git_commit()
    file_checksum = compute_file_sha256(questions_file)
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    logger.info(
        "Loading questions from %s (SHA-256: %s)...", questions_file, file_checksum[:12]
    )
    all_questions = load_questions(questions_file)
    logger.info("Total questions in set: %d", len(all_questions))

    # Initialize components
    logger.info("Initializing retrievers...")
    dense_retriever = DenseRetriever(
        chroma_dir=paths.get("chroma_dir", "data/chroma_db")
    )
    bm25_index = BM25Index(index_path="data/bm25_index.pkl")
    hybrid_retriever = HybridRetriever(
        dense_retriever=dense_retriever,
        bm25_index=bm25_index,
        rrf_k=rrf_k,
        dense_weight=dense_weight,
        bm25_weight=bm25_weight,
    )
    query_rewriter = QueryRewriter(model="gpt-4o-mini")

    variants: dict[str, Any] = {
        "Dense only": lambda q, k: dense_retriever.retrieve(q, top_k=k),
        "BM25 only": lambda q, k: bm25_index.query(q, top_k=k),
        "Hybrid (RRF)": lambda q, k: hybrid_retriever.retrieve(q, top_k=k),
        "Hybrid + Rewrite": lambda q, k: hybrid_retriever.retrieve(
            query_rewriter.rewrite(q).rewritten_query, top_k=k
        ),
    }

    summary_results: dict[str, dict[str, Any]] = {}
    detailed_rows_by_variant: dict[str, list[dict[str, Any]]] = {}

    for name, retrieve_fn in variants.items():
        logger.info("Evaluating variant: '%s'...", name)
        agg, per_q = evaluate_retrieval_variant(
            all_questions,
            retrieve_fn=retrieve_fn,
            k_values=[1, 3, 5],
            top_k=top_k,
        )
        summary_results[name] = agg.get("overall", {})
        detailed_rows_by_variant[name] = per_q

    # Print summary table
    print("\n" + "=" * 80)
    print(f"RETRIEVAL BENCHMARK RESULTS ({eval_set.upper()} SET)")
    print(f"Date: {timestamp} | Commit: {git_commit} | Checksum: {file_checksum[:12]}")
    print("=" * 80)
    markdown_table = format_markdown_table(summary_results)
    print(markdown_table)
    print("=" * 80 + "\n")

    # Save reports
    reports_dir = Path(paths.get("reports_dir", "reports"))
    reports_dir.mkdir(parents=True, exist_ok=True)

    summary_file = reports_dir / f"retrieval_benchmark_{eval_set}.md"
    csv_file = reports_dir / f"retrieval_per_question_{eval_set}.csv"

    report_content = f"""# Retrieval Benchmark Report ({eval_set.upper()} Set)

- **Date**: {timestamp}
- **Git Commit**: `{git_commit}`
- **Question Set**: `{eval_set}` (`{questions_file}`)
- **Questions SHA-256**: `{file_checksum}`
- **RRF Constant k**: {rrf_k}
- **Weights**: Dense={dense_weight}, BM25={bm25_weight}

## Comparative Overall Performance

{markdown_table}

## Analysis Notes
- **Dense only**: Captures semantic intent when the user asks conceptual questions without exact legal terminology.
- **BM25 only**: Excels when exact legal references or numbers are queried.
- **Hybrid (RRF)**: Merges both representations to achieve high precision and top-1 ranking.
- **Hybrid + Rewrite**: Bridges informal Sri Lankan colloquial terms into formal statutory vocabulary.
"""
    with open(summary_file, "w", encoding="utf-8") as f:
        f.write(report_content)
    logger.info("Saved summary report to %s", summary_file)

    # Save detailed CSV
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "variant",
                "question_id",
                "type",
                "question",
                "gold_sections",
                "retrieved_ids",
                "mrr",
                "p@1",
                "r@1",
                "p@3",
                "r@3",
                "p@5",
                "r@5",
            ]
        )
        for var_name, rows in detailed_rows_by_variant.items():
            for r in rows:
                writer.writerow(
                    [
                        var_name,
                        r["id"],
                        r["type"],
                        r["question"],
                        ";".join(r["gold_sections"]),
                        ";".join(r["retrieved_ids"]),
                        f"{r['mrr']:.4f}",
                        f"{r['p@1']:.4f}",
                        f"{r['r@1']:.4f}",
                        f"{r['p@3']:.4f}",
                        f"{r['r@3']:.4f}",
                        f"{r['p@5']:.4f}",
                        f"{r['r@5']:.4f}",
                    ]
                )
    logger.info("Saved per-question CSV to %s", csv_file)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run retrieval evaluation benchmark.")
    parser.add_argument(
        "--set",
        choices=["dev", "frozen"],
        default="dev",
        help="Evaluation set to benchmark ('dev' or 'frozen'). Default: 'dev'.",
    )
    parser.add_argument(
        "--config",
        default="configs/base.yaml",
        help="Path to YAML configuration file.",
    )
    args = parser.parse_args()
    run_benchmark(eval_set=args.set, config_path=args.config)


if __name__ == "__main__":
    main()
