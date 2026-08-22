"""Nó Feature genérico (RF-3, ADR-0011).

Um único nó parametrizado por Guia (skill) roda o loop de implementação no
worktree. Backend e frontend são instâncias do mesmo nó com Guias distintos.
"""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

from open_agentic_ops.nodes.guia import Guia, carregar_guia
from open_agentic_ops.ports import LLMProviderPort
from open_agentic_ops.state import BoardState, Dominio, Worktree


class _DefaultLLM:
    """Fallback determinístico quando não há LLMProviderPort injetado."""

    def invoke(self, prompt: str, *, system: str | None = None) -> str:
        return f"[implementado] {prompt[:200]}"


def make_feature_node(
    dominio: Dominio,
    *,
    llm: LLMProviderPort | None = None,
    skill_dir: str | None = None,
    branch_prefix: str = "feat",
) -> Callable[[BoardState], BoardState]:
    """Factory do nó Feature para um domínio específico (Guia)."""
    guia: Guia = carregar_guia(dominio, Path(skill_dir) if skill_dir else None)
    provider: LLMProviderPort = llm or _DefaultLLM()

    def feature_node(state: BoardState) -> BoardState:
        spec = state.get("spec", "")
        prompt = (
            f"Domínio: {guia.dominio}\n"
            f"Spec:\n{spec}\n\n"
            f"Implemente a feature no worktree e retorne o resumo."
        )
        resultado = provider.invoke(prompt, system=guia.system_prompt)

        worktree: Worktree = {
            "dominio": guia.dominio,
            "guia": guia.nome,
            "branch": f"{branch_prefix}/{guia.nome}",
            "status": "implementado",
            "resultado": resultado,
        }

        return {
            "worktrees": [worktree],
        }

    return feature_node
