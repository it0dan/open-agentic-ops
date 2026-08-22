"""Montagem do grafo (RF-3.1, RF-4, RF-7.2).

Supervisor único (ADR-0001): um `StateGraph` que encadeia os nós e usa arestas
condicionais para ramificar por ambiguidade e fazer fan-out/fan-in dos
worktrees paralelos. O checkpointer é o board (ADR-0002).
"""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from open_agentic_ops.gates.eval_gate import make_eval_gate
from open_agentic_ops.gates.hitl_gate import hitl_gate
from open_agentic_ops.nodes.architecture_node import make_architecture_node
from open_agentic_ops.nodes.feature_node import make_feature_node
from open_agentic_ops.nodes.intake_node import intake_node, route_by_ambiguity
from open_agentic_ops.nodes.platform_node import make_platform_node
from open_agentic_ops.nodes.review_node import make_review_node
from open_agentic_ops.nodes.sre_node import make_sre_node
from open_agentic_ops.ports import LLMProviderPort, ToolExecutionPort
from open_agentic_ops.state import BoardState


def _rascunha_spec(state: BoardState) -> BoardState:
    """Baixa ambiguidade: spec já rascunhada pelo Intake, segue ao fan-out."""
    return {"status": "spec_pronta"}


def _escala_fde(state: BoardState) -> BoardState:
    """Alta ambiguidade: pausa para autoria da spec pelo FDE (ADR-0009)."""
    return {"status": "spec_pronta"}


def _fan_out(state: BoardState) -> BoardState:
    """Dispara os worktrees paralelos (backend/frontend) com seus Guias."""
    return {"status": "em_implementacao"}


def _fan_in(state: BoardState) -> BoardState:
    """Convergência dos worktrees antes da revisão."""
    return {"status": "em_revisao"}


def build_graph(
    *,
    llm: LLMProviderPort | None = None,
    tools: ToolExecutionPort | None = None,
    skill_dir: str | None = None,
    architecture_enabled: bool = True,
) -> StateGraph:
    """Monta o grafo da squad com os nós e arestas condicionais."""
    feature_backend = make_feature_node("backend", llm=llm, skill_dir=skill_dir)
    feature_frontend = make_feature_node("frontend", llm=llm, skill_dir=skill_dir)
    platform = make_platform_node(tools=tools)
    architecture = make_architecture_node()
    review = make_review_node()
    eval_gate = make_eval_gate()
    sre = make_sre_node()

    builder = StateGraph(BoardState)

    builder.add_node("intake", intake_node)
    builder.add_node("rascunha_spec", _rascunha_spec)
    builder.add_node("escala_fde", _escala_fde)
    builder.add_node("fan_out", _fan_out)
    builder.add_node("feature_backend", feature_backend)
    builder.add_node("feature_frontend", feature_frontend)
    builder.add_node("platform", platform)
    builder.add_node("architecture", architecture)
    builder.add_node("fan_in", _fan_in)
    builder.add_node("review", review)
    builder.add_node("hitl", hitl_gate)
    builder.add_node("eval", eval_gate)
    builder.add_node("sre", sre)

    builder.add_edge(START, "intake")
    builder.add_conditional_edges(
        "intake",
        route_by_ambiguity,
        {"rascunha_spec": "rascunha_spec", "fde": "escala_fde"},
    )
    builder.add_edge("rascunha_spec", "fan_out")
    builder.add_edge("escala_fde", "fan_out")

    builder.add_edge("fan_out", "feature_backend")
    builder.add_edge("fan_out", "feature_frontend")
    builder.add_edge("feature_backend", "platform")
    builder.add_edge("feature_frontend", "platform")
    builder.add_edge("platform", "fan_in")

    if architecture_enabled:
        builder.add_edge("fan_in", "architecture")
        builder.add_edge("architecture", "review")
    else:
        builder.add_edge("fan_in", "review")

    builder.add_edge("review", "hitl")
    builder.add_edge("hitl", "eval")
    builder.add_edge("eval", "sre")
    builder.add_edge("sre", END)

    return builder
