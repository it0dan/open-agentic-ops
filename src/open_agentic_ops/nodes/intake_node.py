"""Nó Intake (RF-1).

Recebe itens das 4 origens, mascara PII na fronteira de entrada (ADR-0006),
classifica `dominio` e `ambiguidade`, rascunha a spec em baixa ambiguidade
(`spec_autor=intake`) e escala ao FDE em alta (`spec_autor=fde`).
"""

from __future__ import annotations

from open_agentic_ops.nodes.intake import classificar_ambiguidade, classificar_dominio
from open_agentic_ops.pii import sanitizar_payload
from open_agentic_ops.state import BoardState, Origem


def intake_node(state: BoardState) -> BoardState:
    """Triagem e fronteira de PII do item de demanda."""
    origem: Origem = state.get("origem", "cliente")
    texto_raw = state.get("spec", "")

    sanitizado = sanitizar_payload({"spec": texto_raw})
    spec = sanitizado["spec"]

    dominio = classificar_dominio(spec)
    ambiguidade = classificar_ambiguidade(spec)

    spec_autor = "intake" if ambiguidade == "baixa" else "fde"

    return {
        "origem": origem,
        "spec": spec,
        "domino": dominio,
        "ambiguidade": ambiguidade,
        "spec_autor": spec_autor,
        "pii_masked": True,
        "status": "triado",
    }


def route_by_ambiguity(state: BoardState) -> str:
    """Aresta condicional: baixa → rascunha spec; alta → escala ao FDE."""
    if state.get("ambiguidade") == "alta":
        return "fde"
    return "rascunha_spec"
