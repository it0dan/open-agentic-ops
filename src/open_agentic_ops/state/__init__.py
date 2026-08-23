"""Modelo de estado do board (ADR-0002).

Cada execução do grafo corresponde a um item de demanda e é identificada por um
`thread_id`. O estado é um schema tipado com reducers de append para os campos
acumulativos (`feedback_review`, `adrs`).
"""

from __future__ import annotations

import operator
from typing import Annotated, Literal, TypedDict

Origem = Literal["cliente", "regulatorio", "estrategia", "sre"]
OrigemSubtipo = Literal[
    "pedido",
    "incidente",
    "norma",
    "instrucao_normativa",
    "nova_funcionalidade",
    "melhoria",
    "bug",
    "performance",
]
Prioridade = Literal["alta", "media", "baixa"]
Ambiguidade = Literal["baixa", "alta"]
SpecAutor = Literal["intake", "fde"]
Dominio = Literal["backend", "frontend", "ambos"]
Status = Literal[
    "triado",
    "aguardando_autoria",
    "spec_pronta",
    "em_implementacao",
    "em_revisao",
    "aguardando_hitl",
    "aprovado",
    "em_eval",
    "deployado",
    "monitorado",
    "rejeitado",
]


class Worktree(TypedDict):
    dominio: Dominio
    guia: str
    branch: str
    status: str
    resultado: str | None
    iteracoes: int | None
    historico: list[dict] | None


class FeedbackReview(TypedDict):
    worktree: str
    feedback: str
    discorda_classificacao: bool
    motivo: str | None
    ambiguidade_sugerida: Ambiguidade | None


OrigemDiscordancia = Literal["review", "fde_auditoria", "fde_hitl"]


class Adr(TypedDict):
    titulo: str
    conteudo: str


DecisaoFDE = Literal["aprovado", "aprovado_com_ressalvas", "rejeitado"]


class DecisaoHitl(TypedDict):
    decisao: DecisaoFDE
    observacao: str | None


class ResultadoEval(TypedDict):
    aprovado: bool
    detalhes: str | None


class ResultadoMonitoramento(TypedDict):
    task_gerada: bool
    motivo: str
    descricao_task: str | None
    metricas_brutas: dict


class ClassificacaoIntake(TypedDict):
    dominio: Dominio
    ambiguidade: Ambiguidade
    justificativa: list[str]
    timestamp: str


class BoardState(TypedDict, total=False):
    thread_id: str
    origem: Origem
    origem_subtipo: OrigemSubtipo | None
    prioridade: Prioridade
    titulo: str | None
    ambiguidade: Ambiguidade
    spec_autor: SpecAutor
    spec: str
    status: Status
    domino: Dominio
    worktrees: Annotated[list[Worktree], operator.add]
    feedback_review: Annotated[list[FeedbackReview], operator.add]
    origem_discordancia: OrigemDiscordancia
    adrs: Annotated[list[Adr], operator.add]
    pii_masked: bool
    decisao_hitl: DecisaoHitl
    resultado_eval: ResultadoEval
    resultado_monitoramento: ResultadoMonitoramento
    classificacao_intake: ClassificacaoIntake
