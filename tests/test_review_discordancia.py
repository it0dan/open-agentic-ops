"""Testes da discordância estruturada do Review (decisões 3-7 da seção 7).

Cobre: FeedbackReview estruturado (motivo + ambiguidade_sugerida), review node
com contexto real, payload do HITL com review_discordancia, origem_discordancia
na Audit e docstring do Architecture.
"""

from fastapi.testclient import TestClient
from langgraph.types import Command

from api.main import create_app
from open_agentic_ops.graph import build_graph
from open_agentic_ops.nodes.architecture_node import make_architecture_node
from open_agentic_ops.nodes.review_node import make_review_node
from open_agentic_ops.persistence import build_dev_checkpointer
from open_agentic_ops.state import BoardState


def _worktree_com_pii() -> dict:
    return {
        "dominio": "backend",
        "guia": "backend",
        "branch": "feat/backend",
        "status": "implementado",
        "resultado": "Endpoint criado. CPF 123.456.789-00 no payload.",
        "iteracoes": 1,
        "historico": [],
    }


def _revisar_discorda(contexto: dict) -> dict:
    return {
        "feedback": "PR discorda da classificação.",
        "discorda_classificacao": True,
        "motivo": "classificação de ambiguidade subestimada",
        "ambiguidade_sugerida": "alta",
    }


def test_review_discorda_com_motivo_e_ambiguidade_sugerida():
    node = make_review_node()
    state: BoardState = {
        "spec": "Spec de teste.",
        "worktrees": [_worktree_com_pii()],
    }
    result = node(state)

    fb = result["feedback_review"][0]
    assert fb["discorda_classificacao"] is True
    assert fb["motivo"]
    assert fb["ambiguidade_sugerida"] == "alta"
    assert result["origem_discordancia"] == "review"


def test_review_concorda_sem_motivo():
    node = make_review_node()
    state: BoardState = {
        "spec": "Spec de teste.",
        "worktrees": [
            {
                "dominio": "backend",
                "guia": "backend",
                "branch": "feat/backend",
                "status": "implementado",
                "resultado": "Endpoint criado sem PII.",
                "iteracoes": 1,
                "historico": [],
            }
        ],
    }
    result = node(state)

    fb = result["feedback_review"][0]
    assert fb["discorda_classificacao"] is False
    assert fb["motivo"] is None
    assert fb["ambiguidade_sugerida"] is None
    assert "origem_discordancia" not in result


def test_review_node_aceita_callable_injetado():
    def revisar(contexto: dict) -> dict:
        return {
            "feedback": "custom",
            "discorda_classificacao": True,
            "motivo": "padrão do time violado",
            "ambiguidade_sugerida": "alta",
        }

    node = make_review_node(revisar=revisar)
    result = node({"spec": "s", "worktrees": [_worktree_com_pii()]})

    assert result["feedback_review"][0]["feedback"] == "custom"
    assert result["feedback_review"][0]["motivo"] == "padrão do time violado"


def test_hitl_payload_carrega_review_discordancia():
    app = build_graph(revisar=_revisar_discorda).compile(checkpointer=build_dev_checkpointer())
    config = {"configurable": {"thread_id": "rev-disc-1"}}

    app.invoke(
        {
            "origem": "regulatorio",
            "spec": (
                "Nova Instrução Normativa do BCB altera o Manual de Escopo. CPF 123.456.789-00."
            ),
        },
        config,
    )
    app.invoke(Command(resume={"spec": "Spec autorada pelo FDE."}), config)

    state = app.get_state(config)
    assert "hitl" in state.next
    assert state.values.get("origem_discordancia") == "review"
    fb = state.values.get("feedback_review", [])
    assert any(f["discorda_classificacao"] for f in fb)


def test_hitl_payload_sem_review_discordancia():
    app = build_graph().compile(checkpointer=build_dev_checkpointer())
    config = {"configurable": {"thread_id": "rev-ok-1"}}

    app.invoke(
        {
            "origem": "cliente",
            "spec": "Adicionar botão de download no dashboard.",
        },
        config,
    )

    state = app.get_state(config)
    assert "origem_discordancia" not in state.values
    fb = state.values.get("feedback_review", [])
    assert all(not f["discorda_classificacao"] for f in fb)


def test_origem_discordancia_exposta_na_audit():
    with TestClient(create_app(revisar=_revisar_discorda)) as client:
        resp = client.post(
            "/intake",
            json={
                "origem": "regulatorio",
                "texto": (
                    "Nova Instrução Normativa do BCB altera o Manual de Escopo. CPF 998.877.665-00."
                ),
            },
        )
        assert resp.status_code == 200
        thread_id = resp.json()["thread_id"]

        client.post(
            "/resume",
            json={"thread_id": thread_id, "spec": "Spec autorada pelo FDE."},
        )

        auditoria = client.get("/auditoria").json()
        item = next(i for i in auditoria if i["thread_id"] == thread_id)
        assert item.get("origem_discordancia") == "review"
        assert item.get("discordancias_review")


def test_architecture_docstring_sem_promessa_de_pausa():
    import inspect

    doc = inspect.getdoc(make_architecture_node)
    assert doc is not None
    assert "pausa e escala ao FDE" not in doc
