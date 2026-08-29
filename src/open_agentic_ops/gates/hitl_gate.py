"""HITL gate por etapa (RF-5, ADR-0005/0009/0025).

Usa `interrupt()` nativo do LangGraph; nenhuma etapa avança sem aprovação
humana do FDE quando a matriz de autonomia exige `humano`. O FDE é notificado
via Redis/SSE (push) e aprova/rejeita via `POST /resume`, que injeta a decisão
via `Command(resume=...)`. O payload do `interrupt()` é JSON-serializable e sem
PII raw.

Desde o ADR-0025, o gate é genérico por etapa: recebe a `etapa` e o nível de
`autonomia` da matriz. `autonomo` não pausa; `llm_judge` avalia via LLM (fase 2,
por ora fallback determinístico); `humano` pausa com o raciocínio da etapa.
"""

from __future__ import annotations

from collections.abc import Callable

from langgraph.types import Command, interrupt

from open_agentic_ops.autonomia import Autonomia
from open_agentic_ops.state import BoardState, DecisaoHitl


def _llm_judge(raciocinio: dict) -> DecisaoHitl:
    """LLM-as-a-judge (fase 2). Por ora, fallback determinístico que aprova."""
    return {"decisao": "aprovado", "observacao": "Aprovado por LLM-as-a-judge (fase 2)."}


def make_hitl_gate(
    etapa: str,
    autonomia: Autonomia = "humano",
) -> Callable[[BoardState], BoardState]:
    """Factory do gate de HITL para uma etapa específica.

    `etapa` identifica o agente/etapa no fluxo (ex.: `intake`, `feature_backend`,
    `review`, `deploy`, `sre`). `autonomia` vem da matriz (ADR-0025).
    """

    def hitl_gate(state: BoardState) -> BoardState:
        raciocinios = list(state.get("raciocinios", []))
        raciocinio: dict = dict(raciocinios[-1]) if raciocinios else {}

        if autonomia == "autonomo":
            return {"status": "aprovado"}

        if autonomia == "llm_judge":
            decisao = _llm_judge(raciocinio)
            return {"decisao_hitl": decisao, "status": "aprovado"}

        payload: dict = {
            "tipo": "hitl",
            "etapa": etapa,
            "thread": state.get("origem", "desconhecida"),
            "spec_resumo": (state.get("spec") or "")[:200],
            "raciocinio": raciocinio,
        }

        decisao: DecisaoHitl = interrupt(payload)

        rejeitado = decisao.get("decisao") == "rejeitado"
        return {
            "decisao_hitl": decisao,
            "status": "rejeitado" if rejeitado else "aprovado",
        }

    return hitl_gate


def make_resume_handler(
    notifier: Callable[[str, dict], None] | None = None,
) -> Callable[[str, dict], Command]:
    """Factory do handler de `POST /resume` (ponte do FDE)."""

    def resume(thread_id: str, decision: dict) -> Command:
        if notifier is not None:
            notifier(thread_id, {"status": "resumed", "decision": decision})
        return Command(resume=decision)

    return resume
