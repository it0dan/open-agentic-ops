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

import uuid
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from open_agentic_ops.gates.hitl_gate import make_resume_handler
from open_agentic_ops.graph import build_graph
from open_agentic_ops.nodes.intake import (
    Heuristica,
    carregar_heuristica,
    salvar_heuristica,
)
from open_agentic_ops.persistence import BoardView, build_dev_checkpointer
from open_agentic_ops.state import BoardState, Origem


class ResumeBody(BaseModel):
    thread_id: str
    aprovado: bool | None = None
    comentario: str | None = None
    spec: str | None = None


class IntakeBody(BaseModel):
    origem: Origem = "cliente"
    texto: str = Field(min_length=1)


class HeuristicaBody(BaseModel):
    categoria: Literal["backend", "frontend", "alta_ambiguidade"]
    palavra: str
    acao: Literal["add", "remove"]


def create_app() -> FastAPI:
    """Monta o app FastAPI com o grafo compilado e o checkpointer (board)."""
    app = FastAPI(title="Open Agentic Ops — FDE Console API")

    graph = build_graph().compile(checkpointer=build_dev_checkpointer())
    view = BoardView(graph.checkpointer)
    resume = make_resume_handler()

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
            if body.aprovado is None:
                raise HTTPException(
                    status_code=422,
                    detail="decisão HITL requer o campo 'aprovado'",
                )
            cmd = resume(
                body.thread_id,
                {"aprovado": body.aprovado, "comentario": body.comentario},
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
            {"origem": body.origem, "spec": body.texto},
            config,
        )
        return {"thread_id": thread_id, **_detalhe(thread_id, result)}

    @app.get("/auditoria")
    def auditoria() -> list[dict]:
        items = []
        for thread_id, snap in view.all():
            cls = snap.get("classificacao_intake")
            if cls is not None:
                items.append({"thread_id": thread_id, **cls})
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

    return app


def _resumo(thread_id: str, snap: BoardState) -> dict:
    return {
        "thread_id": thread_id,
        "origem": snap.get("origem"),
        "ambiguidade": snap.get("ambiguidade"),
        "spec_autor": snap.get("spec_autor"),
        "dominio": snap.get("domino"),
        "status": snap.get("status"),
        "spec_resumo": (snap.get("spec") or "")[:200],
    }


def _detalhe(thread_id: str, snap: BoardState) -> dict:
    return {
        "thread_id": thread_id,
        **_resumo(thread_id, snap),
        "spec": snap.get("spec"),
        "worktrees": snap.get("worktrees", []),
        "adrs": snap.get("adrs", []),
        "feedback_review": snap.get("feedback_review", []),
        "decisao_hitl": snap.get("decisao_hitl"),
        "resultado_eval": snap.get("resultado_eval"),
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
