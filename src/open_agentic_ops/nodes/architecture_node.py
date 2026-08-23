"""Nó Architecture (RF-3.4, RF-4.2, ADR-0007).

Complicated-subsystem. Discute contrato de API externo/compliance de forma
síncrona (A2A), registra ADR e aconselha sem vetar. Papel puramente
consultivo — a decisão final fica com o Feature Agent.
"""

from __future__ import annotations

from collections.abc import Callable

from open_agentic_ops.state import Adr, BoardState


def _aconselhar(spec: str) -> str:
    """Fallback determinístico quando não há serviço A2A."""
    return (
        "Recomendação: validar o contrato externo contra o perfil FAPI-BR "
        "antes do merge. Decisão final fica com o Feature Agent."
    )


def make_architecture_node(
    *,
    aconselhar: Callable[[str], str] | None = None,
    endpoint: str | None = None,
) -> Callable[[BoardState], BoardState]:
    """Factory do nó Architecture (A2A)."""
    advisor = aconselhar or _aconselhar

    def architecture_node(state: BoardState) -> BoardState:
        spec = state.get("spec", "")
        recomendacao = advisor(spec)

        adr: Adr = {
            "titulo": "Contrato externo/compliance",
            "conteudo": recomendacao,
        }

        adrs = list(state.get("adrs", []))
        adrs.append(adr)

        return {
            "adrs": adrs,
            "status": "em_implementacao",
        }

    return architecture_node
