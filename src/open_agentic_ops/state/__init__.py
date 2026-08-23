"""Modelo de estado do board (ADR-0002).

Cada execução do grafo corresponde a um item de demanda e é identificada por um
`thread_id`. O estado é um schema tipado com reducers de append para os campos
acumulativos (`feedback_review`, `adrs`).
"""

from __future__ import annotations

import operator
from typing import Annotated, Literal, TypedDict

Origem = Literal["cliente", "regulatorio", "estrategia", "sre"]
Ambiguidade = Literal["baixa", "alta"]
SpecAutor = Literal["intake", "fde"]
Dominio = Literal["backend", "frontend", "ambos"]
Status = Literal[
    "triado",
    "spec_pronta",
    "em_implementacao",
    "em_revisao",
    "aguardando_hitl",
    "aprovado",
    "em_eval",
    "deployado",
    "monitorado",
]


class Worktree(TypedDict):
    dominio: Dominio
    guia: str
    branch: str
    status: str
    resultado: str | None


class FeedbackReview(TypedDict):
    worktree: str
    feedback: str
    discorda_classificacao: bool


class Adr(TypedDict):
    titulo: str
    conteudo: str


class DecisaoHitl(TypedDict):
    aprovado: bool
    comentario: str | None


class ResultadoEval(TypedDict):
    aprovado: bool
    detalhes: str | None


class ClassificacaoIntake(TypedDict):
    dominio: Dominio
    ambiguidade: Ambiguidade
    justificativa: list[str]
    timestamp: str


class BoardState(TypedDict, total=False):
    origem: Origem
    ambiguidade: Ambiguidade
    spec_autor: SpecAutor
    spec: str
    status: Status
    domino: Dominio
    worktrees: Annotated[list[Worktree], operator.add]
    feedback_review: Annotated[list[FeedbackReview], operator.add]
    adrs: Annotated[list[Adr], operator.add]
    pii_masked: bool
    decisao_hitl: DecisaoHitl
    resultado_eval: ResultadoEval
    sre_task_gerada: bool
    classificacao_intake: ClassificacaoIntake
