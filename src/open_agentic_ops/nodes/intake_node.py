"""Nó Intake (RF-1).

Recebe itens das 4 origens, mascara PII na fronteira de entrada (ADR-0006),
classifica `dominio` e `ambiguidade`, rascunha a spec em baixa ambiguidade
(`spec_autor=intake`) e escala ao FDE em alta (`spec_autor=fde`). Registra a
classificação + justificativa no estado para auditoria prospectiva (RNF-6).

Desde a decisão 2, a detecção de precedente usa busca por similaridade semântica
(pgvector + Sentence-Transformers local): se há demanda resolvida similar da
mesma `origem`+`dominio` acima do threshold, reforça a baixa; caso contrário,
cai no fallback de alta (decisão 1). A keyword literal "sem precedente"
permanece como sinal explícito adicional.
"""

from __future__ import annotations

import os
from collections.abc import Callable, Sequence
from datetime import UTC, datetime

from open_agentic_ops.nodes.intake import classificar_ambiguidade, classificar_dominio
from open_agentic_ops.pii import sanitizar_payload
from open_agentic_ops.state import BoardState, Origem

BuscarPrecedentes = Callable[[str, str, str, int, float], Sequence[object]]


def _threshold_default() -> float:
    return float(os.environ.get("SIMILARIDADE_THRESHOLD", "0.75"))


def _n_default() -> int:
    return int(os.environ.get("SIMILARIDADE_N", "5"))


def make_intake_node(
    buscar_precedentes: BuscarPrecedentes | None = None,
) -> Callable[[BoardState], BoardState]:
    """Factory do nó Intake.

    `buscar_precedentes` é a dependência de similaridade semântica (decisão 2),
    injetável para testes. Quando ausente ou indisponível, o Intake mantém o
    comportamento determinístico atual (keyword + fallback).
    """
    buscar = buscar_precedentes

    def intake_node(state: BoardState) -> BoardState:
        origem: Origem = state.get("origem", "cliente")
        texto_raw = state.get("spec", "")

        sanitizado = sanitizar_payload({"spec": texto_raw})
        spec = sanitizado["spec"]

        dominio, just_dominio = classificar_dominio(spec)
        ambiguidade, just_ambiguidade = classificar_ambiguidade(spec)

        precedente_ref: str | None = None
        if buscar is not None:
            try:
                precedentes = buscar(
                    spec,
                    origem,
                    dominio,
                    _n_default(),
                    _threshold_default(),
                )
                if precedentes:
                    precedente_ref = getattr(precedentes[0], "thread_id", None) or str(
                        precedentes[0]
                    )
                    if ambiguidade != "alta":
                        ambiguidade = "baixa"
            except Exception:  # noqa: BLE001 - degradação graciosa
                precedente_ref = None

        spec_autor = "intake" if ambiguidade == "baixa" else "fde"

        justificativa = just_dominio + just_ambiguidade
        if precedente_ref:
            justificativa.append(f"precedente:{precedente_ref}")

        return {
            "origem": origem,
            "origem_subtipo": state.get("origem_subtipo"),
            "prioridade": state.get("prioridade", "media"),
            "titulo": state.get("titulo"),
            "spec": spec,
            "domino": dominio,
            "ambiguidade": ambiguidade,
            "spec_autor": spec_autor,
            "pii_masked": True,
            "status": "triado",
            "classificacao_intake": {
                "dominio": dominio,
                "ambiguidade": ambiguidade,
                "justificativa": justificativa,
                "timestamp": datetime.now(UTC).isoformat(),
            },
        }

    return intake_node


def route_by_ambiguity(state: BoardState) -> str:
    """Aresta condicional: baixa → rascunha spec; alta → escala ao FDE."""
    if state.get("ambiguidade") == "alta":
        return "fde"
    return "rascunha_spec"
