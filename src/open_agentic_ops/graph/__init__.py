"""Montagem do grafo (RF-3.1, RF-4, RF-7.2).

Supervisor único (ADR-0001): um `StateGraph` que encadeia os nós e usa arestas
condicionais para ramificar por ambiguidade e fazer fan-out/fan-in dos
worktrees paralelos. O checkpointer é o board (ADR-0002).
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable, Sequence

from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt

from open_agentic_ops.gates.eval_gate import make_eval_gate
from open_agentic_ops.gates.hitl_gate import hitl_gate
from open_agentic_ops.nodes.architecture_node import make_architecture_node
from open_agentic_ops.nodes.feature_node import make_feature_node
from open_agentic_ops.nodes.intake_node import make_intake_node, route_by_ambiguity
from open_agentic_ops.nodes.platform_node import _NoopTools, make_platform_node
from open_agentic_ops.nodes.review_node import make_review_node
from open_agentic_ops.nodes.sre_node import make_sre_node
from open_agentic_ops.ports import LLMProviderPort, ToolExecutionPort
from open_agentic_ops.state import BoardState, ResultadoEval


def _rascunha_spec(state: BoardState) -> BoardState:
    """Baixa ambiguidade: spec já rascunhada pelo Intake, segue ao fan-out."""
    return {"status": "spec_pronta"}


def _escala_fde(state: BoardState) -> BoardState:
    """Alta ambiguidade: escala ao FDE para autoria da spec (ADR-0009).

    Marca o estado como aguardando autoria e delega ao nó `autoria_spec`,
    que pausa via `interrupt()` até o FDE injetar a spec via `POST /resume`.
    """
    return {"status": "aguardando_autoria"}


def _autoria_spec(state: BoardState) -> BoardState:
    """Pausa para o FDE autorar a spec (alta ambiguidade).

    O `interrupt()` retorna o payload do `POST /resume` (ADR-0009), contendo a
    spec autorada pelo FDE, que re-entra no estado e libera o fluxo para o
    fan-out dos worktrees.
    """
    payload: dict = interrupt(
        {
            "tipo": "autoria_spec",
            "thread": state.get("origem", "desconhecida"),
            "spec_resumo": (state.get("spec") or "")[:200],
        }
    )
    spec_autorada = payload.get("spec", "")
    return {
        "spec": spec_autorada,
        "spec_autor": "fde",
        "status": "spec_pronta",
    }


def _fan_out(state: BoardState) -> BoardState:
    """Dispara os worktrees paralelos (backend/frontend) com seus Guias."""
    return {"status": "em_implementacao"}


def _fan_in(state: BoardState) -> BoardState:
    """Convergência dos worktrees antes da revisão."""
    return {"status": "em_revisao"}


def _marcar_hitl(state: BoardState) -> BoardState:
    """Marca a demanda como aguardando HITL antes do gate (ADR-0005).

    O `hitl_gate` pausa via `interrupt()`; o status precisa refletir a espera
    durante a pausa, então é setado aqui (nó anterior), no mesmo padrão de
    `_escala_fde` → `_autoria_spec`.
    """
    return {"status": "aguardando_hitl"}


def route_by_hitl_decision(state: BoardState) -> str:
    """Aresta condicional do HITL (ADR-0017).

    `rejeitado` é status terminal — o grafo termina. Qualquer outra decisão
    (aprovado, aprovado com ressalvas) segue ao Eval.
    """
    decisao = (state.get("decisao_hitl") or {}).get("decisao")
    if decisao == "rejeitado":
        return "rejeitado"
    return "aprovado"


def route_by_eval_result(state: BoardState) -> str:
    """Aresta condicional do Eval (ADR-0017).

    Reprovado volta ao HITL (julgamento humano); aprovado segue ao deploy.
    """
    aprovado = (state.get("resultado_eval") or {}).get("aprovado", True)
    return "aprovado" if aprovado else "reprovado"


def route_by_architecture(state: BoardState) -> str:
    """Aresta condicional do Architecture (decisão 7.3).

    Aciona o Architecture apenas quando a spec toca contrato de API
    externo/regulado (decidido pelo Feature Agent); caso contrário, segue
    direto ao Review.
    """
    if state.get("toca_contrato_externo"):
        return "architecture"
    return "review"


def make_deploy_node(
    tools: ToolExecutionPort | None = None,
) -> Callable[[BoardState], BoardState]:
    """Nó de deploy (ADR-0017): Platform Agent, chama tool `deploy` (stub)."""
    executor: ToolExecutionPort = tools or _NoopTools()

    def deploy_node(state: BoardState) -> BoardState:
        asyncio.run(
            executor.call_tool(
                "deploy", {"branches": [wt["branch"] for wt in state.get("worktrees", [])]}
            )
        )
        return {"status": "deployado"}

    return deploy_node


def build_graph(
    *,
    llm: LLMProviderPort | None = None,
    tools: ToolExecutionPort | None = None,
    skill_dir: str | None = None,
    eval_runner: Callable[[str], ResultadoEval] | None = None,
    criar_demanda: Callable[[str, str], str] | None = None,
    monitorar: Callable[[], dict] | None = None,
    buscar_precedentes: Callable[..., Sequence[object]] | None = None,
    registrar_precedente: Callable[..., None] | None = None,
    revisar: Callable[[dict], dict] | None = None,
) -> StateGraph:
    """Monta o grafo da squad com os nós e arestas condicionais."""
    feature_backend = make_feature_node("backend", llm=llm, tools=tools, skill_dir=skill_dir)
    feature_frontend = make_feature_node("frontend", llm=llm, tools=tools, skill_dir=skill_dir)
    platform = make_platform_node(tools=tools)
    architecture = make_architecture_node()
    review = make_review_node(revisar=revisar)
    eval_gate = make_eval_gate(runner=eval_runner)
    sre = make_sre_node(
        monitorar=monitorar,
        criar_demanda=criar_demanda,
        registrar_precedente=registrar_precedente,
    )
    deploy = make_deploy_node(tools=tools)
    intake = make_intake_node(buscar_precedentes=buscar_precedentes)

    builder = StateGraph(BoardState)

    builder.add_node("intake", intake)
    builder.add_node("rascunha_spec", _rascunha_spec)
    builder.add_node("escala_fde", _escala_fde)
    builder.add_node("autoria_spec", _autoria_spec)
    builder.add_node("fan_out", _fan_out)
    builder.add_node("feature_backend", feature_backend)
    builder.add_node("feature_frontend", feature_frontend)
    builder.add_node("platform", platform)
    builder.add_node("architecture", architecture)
    builder.add_node("fan_in", _fan_in)
    builder.add_node("review", review)
    builder.add_node("marcar_hitl", _marcar_hitl)
    builder.add_node("hitl", hitl_gate)
    builder.add_node("eval", eval_gate)
    builder.add_node("deploy", deploy)
    builder.add_node("sre", sre)

    builder.add_edge(START, "intake")
    builder.add_conditional_edges(
        "intake",
        route_by_ambiguity,
        {"rascunha_spec": "rascunha_spec", "fde": "escala_fde"},
    )
    builder.add_edge("rascunha_spec", "fan_out")
    builder.add_edge("escala_fde", "autoria_spec")
    builder.add_edge("autoria_spec", "fan_out")

    builder.add_edge("fan_out", "feature_backend")
    builder.add_edge("fan_out", "feature_frontend")
    builder.add_edge("feature_backend", "platform")
    builder.add_edge("feature_frontend", "platform")
    builder.add_edge("platform", "fan_in")

    builder.add_conditional_edges(
        "fan_in",
        route_by_architecture,
        {"architecture": "architecture", "review": "review"},
    )
    builder.add_edge("architecture", "review")

    builder.add_edge("review", "marcar_hitl")
    builder.add_edge("marcar_hitl", "hitl")
    builder.add_conditional_edges(
        "hitl",
        route_by_hitl_decision,
        {"aprovado": "eval", "rejeitado": END},
    )
    builder.add_conditional_edges(
        "eval",
        route_by_eval_result,
        {"aprovado": "deploy", "reprovado": "hitl"},
    )
    builder.add_edge("deploy", "sre")
    builder.add_edge("sre", END)

    return builder
