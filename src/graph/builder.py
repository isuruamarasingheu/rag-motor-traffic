"""Graph builder assembling the legal RAG state machine using LangGraph."""

from __future__ import annotations

from typing import Any

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from src.graph.nodes import PipelineNodes, route_confidence, route_scope
from src.graph.state import GraphState


def build_legal_rag_graph(
    nodes: PipelineNodes | None = None,
) -> CompiledStateGraph:
    """Build and compile the LangGraph workflow for Sri Lankan Motor Traffic RAG."""
    pipeline_nodes = nodes or PipelineNodes()

    workflow = StateGraph(GraphState)

    # 1. Register nodes
    workflow.add_node("scope_check", pipeline_nodes.scope_check)
    workflow.add_node("refuse", pipeline_nodes.refuse)
    workflow.add_node("rewrite_and_retrieve", pipeline_nodes.rewrite_and_retrieve)
    workflow.add_node("confidence_gate", pipeline_nodes.confidence_gate)
    workflow.add_node("not_found", pipeline_nodes.not_found)
    workflow.add_node("generate", pipeline_nodes.generate)
    workflow.add_node("respond", pipeline_nodes.respond)

    # 2. Add edges & routing
    workflow.add_edge(START, "scope_check")

    workflow.add_conditional_edges(
        "scope_check",
        route_scope,
        {
            "rewrite_and_retrieve": "rewrite_and_retrieve",
            "refuse": "refuse",
        },
    )

    workflow.add_edge("refuse", "respond")

    workflow.add_edge("rewrite_and_retrieve", "confidence_gate")

    workflow.add_conditional_edges(
        "confidence_gate",
        route_confidence,
        {
            "generate": "generate",
            "not_found": "not_found",
        },
    )

    workflow.add_edge("not_found", "respond")
    workflow.add_edge("generate", "respond")

    workflow.add_edge("respond", END)

    return workflow.compile()


def ask_legal_assistant(
    question: str,
    query_id: str | None = None,
    graph: CompiledStateGraph | None = None,
    nodes: PipelineNodes | None = None,
) -> dict[str, Any]:
    """Convenience execution entrypoint for querying the legal assistant.

    Returns API response contract matching AGENTS.md §6.3:
    {
        "status": "answered" | "refused_out_of_scope" | "not_found",
        "answer": str | None,
        "citations": list[dict],
        "disclaimer": str
    }
    """
    app = graph or build_legal_rag_graph(nodes=nodes)
    initial_state: GraphState = {
        "question": question.strip(),
        "query_id": query_id,
    }

    final_state = app.invoke(initial_state)

    return {
        "status": final_state.get("status", "not_found"),
        "answer": final_state.get("answer"),
        "citations": final_state.get("citations", []),
        "disclaimer": final_state.get("disclaimer", ""),
    }
