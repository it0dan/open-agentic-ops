"""Testes de integração da camada de API (RNF-4).

Cobre board, detalhe, resume (HITL), intake e auditoria. Usa `TestClient`
sobre o app FastAPI com checkpointer InMemory (dev). Cada teste recebe um app
fresco (fixture `client`) para isolar o estado do board.
"""

import pytest
from fastapi.testclient import TestClient

from api.main import create_app
from open_agentic_ops.nodes.intake import (
    carregar_heuristica,
    salvar_heuristica,
)

CASO_ALTA = (
    "Nova Instrução Normativa do BCB altera o Manual de Escopo de Dados e "
    "Serviços do Open Finance, introduzindo um campo ligado à portabilidade "
    "de crédito consignado. CPF 123.456.789-00."
)


@pytest.fixture
def client() -> TestClient:
    with TestClient(create_app()) as c:
        yield c


@pytest.fixture
def restaurar_heuristica():
    original = carregar_heuristica()
    yield
    salvar_heuristica(original)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_board_vazio(client):
    r = client.get("/tasks")
    assert r.status_code == 200
    assert r.json() == []


def test_intake_alta_ambiguidade_pausa_na_autoria(client):
    r = client.post("/intake", json={"origem": "regulatorio", "texto": CASO_ALTA})
    assert r.status_code == 200
    body = r.json()
    assert body["thread_id"]
    assert body["ambiguidade"] == "alta"
    assert body["spec_autor"] == "fde"
    assert body["pii_masked"] is True
    assert "123.456.789-00" not in body["spec"]
    assert "[CPF]" in body["spec"]
    assert body["status"] == "aguardando_autoria"


def test_resume_autoria_spec_libera_fluxo(client):
    intake = client.post("/intake", json={"origem": "regulatorio", "texto": CASO_ALTA}).json()
    tid = intake["thread_id"]
    r = client.post(
        "/resume",
        json={"thread_id": tid, "spec": "Spec autorada pelo FDE."},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["spec"] == "Spec autorada pelo FDE."
    assert body["spec_autor"] == "fde"
    assert len(body["worktrees"]) == 2


def test_resume_autoria_spec_exige_spec(client):
    intake = client.post("/intake", json={"origem": "regulatorio", "texto": CASO_ALTA}).json()
    tid = intake["thread_id"]
    r = client.post("/resume", json={"thread_id": tid})
    assert r.status_code == 422


def test_intake_texto_vazio(client):
    r = client.post("/intake", json={"origem": "cliente", "texto": ""})
    assert r.status_code == 422


def test_intake_campos_estruturados(client):
    r = client.post(
        "/intake",
        json={
            "origem": "estrategia",
            "origem_subtipo": "nova_funcionalidade",
            "prioridade": "alta",
            "titulo": "Onboarding digital PJ",
            "texto": "Lançar onboarding digital com verificação facial para novos clientes PJ.",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["origem"] == "estrategia"
    assert body["origem_subtipo"] == "nova_funcionalidade"
    assert body["prioridade"] == "alta"
    assert body["titulo"] == "Onboarding digital PJ"

    tid = body["thread_id"]
    detalhe = client.get(f"/tasks/{tid}").json()
    assert detalhe["origem_subtipo"] == "nova_funcionalidade"
    assert detalhe["prioridade"] == "alta"
    assert detalhe["titulo"] == "Onboarding digital PJ"


def test_intake_defaults_quando_omitidos(client):
    r = client.post(
        "/intake",
        json={"origem": "cliente", "texto": "Adicionar botão de download no dashboard."},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["prioridade"] == "media"
    assert body["origem_subtipo"] is None
    assert body["titulo"] is None


def test_board_lista_demandas(client):
    client.post(
        "/intake",
        json={
            "origem": "cliente",
            "texto": "Adicionar botão de download no dashboard.",
        },
    )
    r = client.get("/tasks")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["ambiguidade"] == "baixa"
    assert items[0]["spec_autor"] == "intake"


def test_board_detalhe_404(client):
    r = client.get("/tasks/nao-existe")
    assert r.status_code == 404


def test_resume_aprova_demanda(client):
    intake = client.post("/intake", json={"origem": "regulatorio", "texto": CASO_ALTA}).json()
    tid = intake["thread_id"]
    client.post("/resume", json={"thread_id": tid, "spec": "Spec autorada pelo FDE."})
    r = client.post(
        "/resume",
        json={"thread_id": tid, "decisao": "aprovado", "observacao": "ok"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["decisao_hitl"]["decisao"] == "aprovado"
    assert body["resultado_eval"]["aprovado"] is True
    assert body["status"] == "monitorado"


def test_resume_rejeita_demanda(client):
    intake = client.post("/intake", json={"origem": "regulatorio", "texto": CASO_ALTA}).json()
    tid = intake["thread_id"]
    client.post("/resume", json={"thread_id": tid, "spec": "Spec autorada pelo FDE."})
    r = client.post(
        "/resume",
        json={"thread_id": tid, "decisao": "rejeitado", "observacao": "direção errada"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["decisao_hitl"]["decisao"] == "rejeitado"
    assert body["status"] == "rejeitado"


def test_resume_aprova_com_ressalvas(client):
    intake = client.post("/intake", json={"origem": "regulatorio", "texto": CASO_ALTA}).json()
    tid = intake["thread_id"]
    client.post("/resume", json={"thread_id": tid, "spec": "Spec autorada pelo FDE."})
    r = client.post(
        "/resume",
        json={
            "thread_id": tid,
            "decisao": "aprovado_com_ressalvas",
            "observacao": "revisar cobertura de testes",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["decisao_hitl"]["decisao"] == "aprovado_com_ressalvas"
    assert body["decisao_hitl"]["observacao"] == "revisar cobertura de testes"
    assert body["status"] == "monitorado"


def test_resume_sem_demanda_aguardando(client):
    intake = client.post("/intake", json={"origem": "regulatorio", "texto": CASO_ALTA}).json()
    tid = intake["thread_id"]
    client.post("/resume", json={"thread_id": tid, "spec": "Spec autorada pelo FDE."})
    client.post("/resume", json={"thread_id": tid, "decisao": "aprovado"})
    r = client.post("/resume", json={"thread_id": tid, "decisao": "aprovado"})
    assert r.status_code == 400


def test_resume_demanda_inexistente(client):
    r = client.post("/resume", json={"thread_id": "nao-existe", "decisao": "aprovado"})
    assert r.status_code == 404


def test_auditoria_lista_classificacoes(client):
    client.post("/intake", json={"origem": "regulatorio", "texto": CASO_ALTA})
    r = client.get("/auditoria")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["ambiguidade"] == "alta"
    assert items[0]["justificativa"]
    assert items[0]["timestamp"]


def test_heuristica_adiciona_palavra(client, restaurar_heuristica):
    r = client.post(
        "/auditoria/heuristica",
        json={"categoria": "alta_ambiguidade", "palavra": "novo-termo", "acao": "add"},
    )
    assert r.status_code == 200
    assert "novo-termo" in r.json()["alta_ambiguidade"]


def test_heuristica_remove_palavra(client, restaurar_heuristica):
    r = client.post(
        "/auditoria/heuristica",
        json={"categoria": "backend", "palavra": "api", "acao": "remove"},
    )
    assert r.status_code == 200
    assert "api" not in r.json()["backend"]


def test_auditoria_ambigua_incrementa_contador(client):
    r0 = client.get("/auditoria/ambigua")
    assert r0.status_code == 200
    antes = r0.json()["contador"]

    r = client.post("/auditoria/ambigua", json={"thread_id": "abc"})
    assert r.status_code == 200
    assert r.json()["contador"] == antes + 1

    r2 = client.get("/auditoria/ambigua")
    assert r2.json()["contador"] == antes + 1


def test_auditoria_ambigua_nao_altera_heuristica(client, restaurar_heuristica):
    antes = carregar_heuristica()
    client.post("/auditoria/ambigua", json={})
    depois = carregar_heuristica()
    assert antes == depois


def test_resume_hitl_dispara_notifier():
    chamadas: list[tuple[str, dict]] = []

    def spy(thread_id: str, payload: dict) -> None:
        chamadas.append((thread_id, payload))

    with TestClient(create_app(notifier=spy)) as c:
        intake = c.post("/intake", json={"origem": "regulatorio", "texto": CASO_ALTA}).json()
        tid = intake["thread_id"]
        c.post("/resume", json={"thread_id": tid, "spec": "Spec autorada pelo FDE."})
        c.post("/resume", json={"thread_id": tid, "decisao": "aprovado", "observacao": "ok"})

    assert len(chamadas) == 2
    hitl = [p for _, p in chamadas if "decisao" in p["decision"]]
    assert len(hitl) == 1
    payload = hitl[0]
    assert payload["status"] == "resumed"
    assert payload["decision"] == {"decisao": "aprovado", "observacao": "ok"}


def test_notifier_log_sanitiza_pii(caplog):
    from api.main import _notifier_log

    with caplog.at_level("INFO", logger="open_agentic_ops.hitl"):
        _notifier_log(
            "tid-1",
            {
                "status": "resumed",
                "decision": {"decisao": "aprovado", "observacao": "CPF 123.456.789-00"},
            },
        )

    assert "123.456.789-00" not in caplog.text
    assert len(caplog.records) == 1
    payload = caplog.records[0].payload
    assert "123.456.789-00" not in str(payload)
    assert "[CPF]" in str(payload)
