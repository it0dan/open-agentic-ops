"""HITL gate (RF-5, ADR-0005/0009).

Usa `interrupt()` nativo do LangGraph; nenhum merge ocorre sem aprovação
humana do FDE. O FDE é notificado via Redis/SSE (push) e aprova/rejeita via
`POST /resume`, que injeta a decisão via `Command(resume=...)`. O payload do
`interrupt()` é JSON-serializable e sem PII raw.
"""

from __future__ import annotations

from collections.abc import Callable

from langgraph.types import Command, interrupt

from open_agentic_ops.state import BoardState, DecisaoHitl


def hitl_gate(state: BoardState) -> BoardState:
    """Bloqueia o fluxo até o FDE aprovar/rejeitar via `POST /resume`."""
    decisao: DecisaoHitl = interrupt(
        {
            "tipo": "hitl",
            "thread": state.get("origem", "desconhecida"),
            "spec_resumo": (state.get("spec") or "")[:200],
            "worktrees": [wt["branch"] for wt in state.get("worktrees", [])],
        }
    )

    aprovado = bool(decisao.get("aprovado"))
    return {
        "decisao_hitl": decisao,
        "status": "aprovado" if aprovado else "aguardando_hitl",
    }


def make_resume_handler(
    notifier: Callable[[str, dict], None] | None = None,
) -> Callable[[str, dict], Command]:
    """Factory do handler de `POST /resume` (ponte do FDE)."""

    def resume(thread_id: str, decision: dict) -> Command:
        if notifier is not None:
            notifier(thread_id, {"status": "resumed", "decision": decision})
        return Command(resume=decision)

    return resume
