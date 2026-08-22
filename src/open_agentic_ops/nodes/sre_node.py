"""Nó SRE e loop de fechamento (RF-7, ADR-0010).

Monitora SLOs/error budget em produção e gera uma task que realimenta o board
como 4ª origem, passando pelo Intake (mesmo funil das outras 3 origens).
"""

from __future__ import annotations

from collections.abc import Callable

from open_agentic_ops.state import BoardState


def _monitorar() -> dict:
    """Fallback determinístico quando não há métricas reais."""
    return {"slo_ok": True, "error_budget": 0.05}


def make_sre_node(
    monitorar: Callable[[], dict] | None = None,
) -> Callable[[BoardState], BoardState]:
    """Factory do nó SRE."""
    check = monitorar or _monitorar

    def sre_node(state: BoardState) -> BoardState:
        metricas = check()
        task_gerada = not metricas.get("slo_ok", True)

        return {
            "status": "monitorado",
            "sre_task_gerada": task_gerada,
        }

    return sre_node
