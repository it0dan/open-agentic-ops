"""Nó Review (RF-4.1, RF-4.2, ADR-0007).

Enabling. Dá feedback de PR contra padrões do time; orienta, não bloqueia.
Se discordar da classificação do Intake em andamento, pausa e escala ao FDE
(sem hierarquia de severidade). Desde a decisão 3 da seção 7, o reviewer
recebe contexto real (branch + diff + spec + checklist) e produz discordância
estruturada (`motivo` + `ambiguidade_sugerida`) quando o checklist indica
violação — em vez de `discorda_classificacao: False` hardcoded.
"""

from __future__ import annotations

from collections.abc import Callable

from open_agentic_ops.pii import detectar_pii
from open_agentic_ops.state import BoardState, FeedbackReview


def _revisar(contexto: dict) -> dict:
    """Fallback determinístico quando não há serviço A2A.

    Harness (Camada 1): se o checklist do domínio incluir "sem PII em claro" e
    houver PII detectada no resultado do worktree, discorda da classificação
    com `motivo` e `ambiguidade_sugerida`. Caso contrário, concorda.
    """
    branch = contexto.get("branch", "")
    checklist = contexto.get("checklist", ())
    resultado = contexto.get("resultado") or ""

    exige_sem_pii = any("sem PII" in item for item in checklist)
    if exige_sem_pii and detectar_pii(resultado):
        return {
            "feedback": (
                f"PR {branch}: PII em claro detectada no resultado; corrigir antes do merge."
            ),
            "discorda_classificacao": True,
            "motivo": "PII em claro no resultado do worktree",
            "ambiguidade_sugerida": "alta",
        }

    return {
        "feedback": f"PR {branch}: sem bloqueios; seguir com os padrões do time.",
        "discorda_classificacao": False,
        "motivo": None,
        "ambiguidade_sugerida": None,
    }


def make_review_node(
    *,
    revisar: Callable[[dict], dict] | None = None,
) -> Callable[[BoardState], BoardState]:
    """Factory do nó Review (A2A)."""
    reviewer = revisar or _revisar

    def review_node(state: BoardState) -> BoardState:
        worktrees = list(state.get("worktrees", []))
        spec = state.get("spec", "")
        feedbacks: list[FeedbackReview] = []
        discordou = False

        for wt in worktrees:
            contexto = {
                "branch": wt["branch"],
                "dominio": wt.get("dominio"),
                "spec": spec,
                "checklist": _checklist_do_dominio(wt.get("dominio")),
                "resultado": wt.get("resultado") or "",
            }
            resp = reviewer(contexto)
            feedbacks.append(
                {
                    "worktree": wt["branch"],
                    "feedback": resp.get("feedback", ""),
                    "discorda_classificacao": bool(resp.get("discorda_classificacao", False)),
                    "motivo": resp.get("motivo"),
                    "ambiguidade_sugerida": resp.get("ambiguidade_sugerida"),
                }
            )
            if resp.get("discorda_classificacao"):
                discordou = True

        retorno: BoardState = {
            "feedback_review": feedbacks,
            "status": "em_revisao",
        }
        if discordou:
            retorno["origem_discordancia"] = "review"
        return retorno

    return review_node


def _checklist_do_dominio(dominio: object) -> tuple[str, ...]:
    """Checklist de verificação por domínio (espelho do Guia, ADR-0016)."""
    if dominio == "backend":
        return (
            "testes passando",
            "lint limpo",
            "contrato externo regulado respeitado (FAPI-BR)",
            "sem PII em claro na resposta",
        )
    if dominio == "frontend":
        return (
            "testes passando",
            "lint limpo",
            "identidade visual Sensedia preservada",
            "sem PII em claro na UI",
        )
    return (
        "testes passando",
        "lint limpo",
        "sem PII em claro",
    )
