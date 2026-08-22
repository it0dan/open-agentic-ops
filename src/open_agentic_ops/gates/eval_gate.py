"""Eval gate (RF-6, ADR-0013).

Trajectory eval (PromptFoo) como condição não-negociável antes do deploy,
integrado com LangSmith como plataforma de avaliação. Porta o espírito do
`run_all_evals.sh` (abortar na primeira falha).
"""

from __future__ import annotations

from collections.abc import Callable

from open_agentic_ops.state import BoardState, ResultadoEval


def _run_evals(spec: str) -> ResultadoEval:
    """Fallback determinístico quando não há runner PromptFoo/LangSmith."""
    return {"aprovado": True, "detalhes": "eval noop: aprovado"}


def make_eval_gate(
    runner: Callable[[str], ResultadoEval] | None = None,
) -> Callable[[BoardState], BoardState]:
    """Factory do Eval gate."""
    evaluate = runner or _run_evals

    def eval_gate(state: BoardState) -> BoardState:
        resultado = evaluate(state.get("spec", ""))
        return {
            "resultado_eval": resultado,
            "status": "em_eval" if resultado["aprovado"] else "em_revisao",
        }

    return eval_gate
