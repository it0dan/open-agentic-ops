"""Nó Review (RF-4.1, RF-4.2, ADR-0007).

Enabling. Dá feedback de PR contra padrões do time; orienta, não bloqueia.
Se discordar da classificação do Intake em andamento, pausa e escala ao FDE
(sem hierarquia de severidade).
"""

from __future__ import annotations

from collections.abc import Callable

from open_agentic_ops.state import BoardState, FeedbackReview


def _revisar(branch: str) -> str:
    """Fallback determinístico quando não há serviço A2A."""
    return f"PR {branch}: sem bloqueios; seguir com os padrões do time."


def make_review_node(
    *,
    revisar: Callable[[str], str] | None = None,
) -> Callable[[BoardState], BoardState]:
    """Factory do nó Review (A2A)."""
    reviewer = revisar or _revisar

    def review_node(state: BoardState) -> BoardState:
        worktrees = list(state.get("worktrees", []))
        feedbacks: list[FeedbackReview] = []

        for wt in worktrees:
            feedback = reviewer(wt["branch"])
            feedbacks.append(
                {
                    "worktree": wt["branch"],
                    "feedback": feedback,
                    "discorda_classificacao": False,
                }
            )

        return {
            "feedback_review": feedbacks,
            "status": "em_revisao",
        }

    return review_node
