"""Camada de API do console do FDE (D2).

Expõe o grafo LangGraph via FastAPI. Consome apenas o estado já mascarado na
fronteira (Intake) — nunca expõe PII raw (RNF-1). Endpoints:

- `GET /tasks`                    lista demandas
- `GET /tasks/{thread_id}`        detalhe de uma demanda (404 se inexistente)
- `POST /resume`                  aprova/rejeita HITL via `Command(resume=...)`
- `POST /intake`                  injeta nova demanda (gera thread_id)
- `GET /auditoria`                classificações registradas pelo Intake
- `POST /auditoria/heuristica`    corrige a heurística prospectivamente (RNF-6)
"""

from __future__ import annotations

import logging
import uuid
from collections.abc import Callable
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from open_agentic_ops.gates.hitl_gate import make_resume_handler
from open_agentic_ops.graph import build_graph
from open_agentic_ops.nodes.intake import (
    Heuristica,
    carregar_heuristica,
    salvar_heuristica,
)
from open_agentic_ops.observability import sanitize_for_telemetry
from open_agentic_ops.persistence import BoardView, build_dev_checkpointer
from open_agentic_ops.similaridade import buscar_precedentes, registrar_precedente
from open_agentic_ops.state import (
    BoardState,
    DecisaoFDE,
    Origem,
    OrigemSubtipo,
    Prioridade,
)


class ResumeBody(BaseModel):
    thread_id: str
    decisao: DecisaoFDE | None = None
    observacao: str | None = None
    spec: str | None = None


class IntakeBody(BaseModel):
    origem: Origem = "cliente"
    origem_subtipo: OrigemSubtipo | None = None
    prioridade: Prioridade = "media"
    titulo: str | None = None
    texto: str = Field(min_length=1)


class HeuristicaBody(BaseModel):
    categoria: Literal["backend", "frontend", "alta_ambiguidade"]
    palavra: str
    acao: Literal["add", "remove"]


class AmbiguidadeBody(BaseModel):
    thread_id: str | None = None


_contador_ambig_nao_keyword = 0

_logger = logging.getLogger("open_agentic_ops.hitl")


def _notifier_log(thread_id: str, payload: dict[str, Any]) -> None:
    """Notifier concreto (Camada 1): log estruturado, sem PII raw (ADR-0006)."""
    _logger.info(
        "hitl.resumed", extra={"thread_id": thread_id, "payload": sanitize_for_telemetry(payload)}
    )


def create_app(
    *,
    revisar: Callable[[dict], dict] | None = None,
    notifier: Callable[[str, dict[str, Any]], None] | None = None,
) -> FastAPI:
    """Monta o app FastAPI com o grafo compilado e o checkpointer (board)."""
    app = FastAPI(title="Open Agentic Ops — FDE Console API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def criar_demanda(texto: str) -> str:
        """Port do SRE (ADR-0019): realimenta o Intake com origem='sre'.

        Gera um novo thread_id e invoca o grafo compilado com `origem="sre"`,
        no mesmo caminho usado por `POST /intake`.
        """
        thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}
        graph.invoke(
            {
                "thread_id": thread_id,
                "origem": "sre",
                "spec": texto,
            },
            config,
        )
        return thread_id

    graph = build_graph(
        criar_demanda=criar_demanda,
        buscar_precedentes=buscar_precedentes,
        registrar_precedente=registrar_precedente,
        revisar=revisar,
    ).compile(checkpointer=build_dev_checkpointer())
    view = BoardView(graph.checkpointer)
    resume = make_resume_handler(notifier=notifier or _notifier_log)

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    @app.get("/tasks")
    def tasks() -> list[dict]:
        items = []
        for thread_id, snap in view.all():
            items.append(_resumo(thread_id, snap))
        return items

    @app.get("/tasks/{thread_id}")
    def task_detail(thread_id: str) -> dict:
        snap = view.snapshot(thread_id)
        if snap is None:
            raise HTTPException(status_code=404, detail="demanda não encontrada")
        return _detalhe(thread_id, snap)

    @app.post("/resume")
    def resume_endpoint(body: ResumeBody) -> dict:
        config = {"configurable": {"thread_id": body.thread_id}}
        snap = view.snapshot(body.thread_id)
        if snap is None:
            raise HTTPException(status_code=404, detail="demanda não encontrada")

        proximos = graph.get_state(config).next
        if "hitl" in proximos:
            if body.decisao is None:
                raise HTTPException(
                    status_code=422,
                    detail="decisão HITL requer o campo 'decisao'",
                )
            cmd = resume(
                body.thread_id,
                {"decisao": body.decisao, "observacao": body.observacao},
            )
        elif "autoria_spec" in proximos:
            if not body.spec or not body.spec.strip():
                raise HTTPException(
                    status_code=422,
                    detail="autoria de spec requer o campo 'spec'",
                )
            cmd = resume(body.thread_id, {"spec": body.spec})
        else:
            raise HTTPException(
                status_code=400,
                detail="demanda não está aguardando HITL nem autoria de spec",
            )

        result = graph.invoke(cmd, config)
        return _detalhe(body.thread_id, result)

    @app.post("/intake")
    def intake_endpoint(body: IntakeBody) -> dict:
        thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}
        result = graph.invoke(
            {
                "thread_id": thread_id,
                "origem": body.origem,
                "origem_subtipo": body.origem_subtipo,
                "prioridade": body.prioridade,
                "titulo": body.titulo,
                "spec": body.texto,
            },
            config,
        )
        return {"thread_id": thread_id, **_detalhe(thread_id, result)}

    @app.get("/auditoria")
    def auditoria() -> list[dict]:
        items = []
        for thread_id, snap in view.all():
            cls = snap.get("classificacao_intake")
            if cls is not None:
                item = {"thread_id": thread_id, **cls}
                discordancias = [
                    fb for fb in snap.get("feedback_review", []) if fb.get("discorda_classificacao")
                ]
                if discordancias:
                    item["origem_discordancia"] = snap.get("origem_discordancia")
                    item["discordancias_review"] = discordancias
                items.append(item)
        return items

    @app.post("/auditoria/heuristica")
    def heuristica_endpoint(body: HeuristicaBody) -> dict:
        h = carregar_heuristica()
        conjunto = getattr(h, body.categoria)
        palavra = body.palavra.strip().lower()
        if not palavra:
            raise HTTPException(status_code=422, detail="palavra vazia")
        if body.acao == "add":
            conjunto.add(palavra)
        else:
            conjunto.discard(palavra)
        salvar_heuristica(h)
        return _serializar_heuristica(h)

    @app.get("/auditoria/ambigua")
    def auditoria_ambigua() -> dict:
        return {"contador": _contador_ambig_nao_keyword}

    @app.post("/auditoria/ambigua")
    def auditoria_ambigua_incrementa(body: AmbiguidadeBody) -> dict:
        global _contador_ambig_nao_keyword
        _contador_ambig_nao_keyword += 1
        return {"contador": _contador_ambig_nao_keyword}

    return app


_FLUXO_STATUS = [
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

_AGENTE_POR_STATUS = {
    "triado": "Intake Agent",
    "aguardando_autoria": "FDE",
    "spec_pronta": "Feature Agent",
    "em_implementacao": "Feature Agent",
    "em_revisao": "Review Agent",
    "aguardando_hitl": "FDE",
    "aprovado": "Platform Agent",
    "em_eval": "Eval Gate",
    "deployado": "Platform Agent",
    "monitorado": "SRE Agent",
    "rejeitado": "FDE",
}


def _progresso(status: str | None) -> int:
    if status is None:
        return 0
    idx = _FLUXO_STATUS.index(status) if status in _FLUXO_STATUS else 0
    return round(idx / (len(_FLUXO_STATUS) - 1) * 100)


def _agente_atual(status: str | None) -> str | None:
    return _AGENTE_POR_STATUS.get(status or "")


def _erros(snap: BoardState) -> int:
    return sum(1 for wt in snap.get("worktrees", []) if wt.get("status") == "falhou")


def _resumo(thread_id: str, snap: BoardState) -> dict:
    cls = snap.get("classificacao_intake") or {}
    status = snap.get("status")
    return {
        "thread_id": thread_id,
        "origem": snap.get("origem"),
        "origem_subtipo": snap.get("origem_subtipo"),
        "prioridade": snap.get("prioridade"),
        "titulo": snap.get("titulo"),
        "ambiguidade": snap.get("ambiguidade"),
        "spec_autor": snap.get("spec_autor"),
        "dominio": snap.get("domino"),
        "status": status,
        "spec": snap.get("spec"),
        "spec_resumo": (snap.get("spec") or "")[:200],
        "criado_em": cls.get("timestamp"),
        "progresso": _progresso(status),
        "agente_atual": _agente_atual(status),
        "erros": _erros(snap),
    }


def _detalhe(thread_id: str, snap: BoardState) -> dict:
    return {
        "thread_id": thread_id,
        **_resumo(thread_id, snap),
        "spec": snap.get("spec"),
        "worktrees": snap.get("worktrees", []),
        "adrs": snap.get("adrs", []),
        "feedback_review": snap.get("feedback_review", []),
        "origem_discordancia": snap.get("origem_discordancia"),
        "decisao_hitl": snap.get("decisao_hitl"),
        "resultado_eval": snap.get("resultado_eval"),
        "resultado_monitoramento": snap.get("resultado_monitoramento"),
        "classificacao_intake": snap.get("classificacao_intake"),
        "pii_masked": snap.get("pii_masked"),
    }


def _serializar_heuristica(h: Heuristica) -> dict:
    return {
        "backend": sorted(h.backend),
        "frontend": sorted(h.frontend),
        "alta_ambiguidade": sorted(h.alta_ambiguidade),
    }


app = create_app()
