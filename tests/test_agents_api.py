"""Testes da superfície de integração externa por agente (D6, Camada 1).

Cobre: endpoint por agente responde (200), escopo negado → 403, `pii:raw`
negado a todos, delegação `act` propagada e `tenant_id` propagado ao estado.
Usa `TestClient` sobre o app com o `HeaderScopeProvider` default (mock).
"""

import pytest
from fastapi.testclient import TestClient

from api.main import create_app


@pytest.fixture
def client() -> TestClient:
    with TestClient(create_app()) as c:
        yield c


def _headers(client_id: str, tenant: str = "tenant-a") -> dict:
    return {"X-OAO-Client-Id": client_id, "X-OAO-Tenant-Id": tenant}


def _body(mensagem: str = "Processar nova solicitação.") -> dict:
    return {"messages": [{"role": "user", "content": mensagem}]}


def test_endpoint_intake_responde(client):
    r = client.post(
        "/oao/intake/chat/completions",
        headers=_headers("oa-intake"),
        json=_body("Adicionar botão de download no dashboard."),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["object"] == "chat.completion"
    assert body["model"] == "oao/intake"
    assert body["choices"][0]["message"]["role"] == "assistant"


def test_todos_os_agentes_respondem(client):
    agentes = [
        "intake",
        "feature-backend",
        "feature-frontend",
        "platform",
        "review",
        "architecture",
        "sre",
    ]
    for agente in agentes:
        r = client.post(
            f"/oao/{agente}/chat/completions",
            headers=_headers(f"oa-{agente}"),
            json=_body(),
        )
        assert r.status_code == 200, f"{agente} falhou: {r.status_code}"


def test_escopo_negado_retorna_403(client):
    # oa-review não tem board:write (escopo requerido pelo intake)
    r = client.post(
        "/oao/intake/chat/completions",
        headers=_headers("oa-review"),
        json=_body(),
    )
    assert r.status_code == 403


def test_client_id_desconhecido_retorna_403(client):
    r = client.post(
        "/oao/intake/chat/completions",
        headers=_headers("client-desconhecido"),
        json=_body(),
    )
    assert r.status_code == 403


def test_sem_client_id_retorna_403(client):
    r = client.post(
        "/oao/intake/chat/completions",
        headers={"X-OAO-Tenant-Id": "tenant-a"},
        json=_body(),
    )
    assert r.status_code == 403


def test_pii_raw_negado_a_todos(client):
    # mesmo um client_id com pii:mask não pode acessar pii:raw
    r = client.post(
        "/oao/intake/chat/completions",
        headers=_headers("oa-intake"),
        json=_body(),
    )
    assert r.status_code == 200
    # pii:raw não existe como escopo concedido a ninguém
    from open_agentic_ops.scopes import ESCOPOS_NEGADOS, escopos_do_client

    assert "pii:raw" in ESCOPOS_NEGADOS
    for client_id in ("oa-intake", "oa-platform", "oa-sre"):
        assert "pii:raw" not in escopos_do_client(client_id)


def test_act_propagado_ao_estado(client):
    r = client.post(
        "/oao/intake/chat/completions",
        headers=_headers("oa-intake"),
        json={**_body(), "act": "fde@tenant-a"},
    )
    assert r.status_code == 200
    content = r.json()["choices"][0]["message"]["content"]
    assert "fde@tenant-a" in content


def test_tenant_id_propagado_ao_estado(client):
    r = client.post(
        "/oao/intake/chat/completions",
        headers=_headers("oa-intake", tenant="tenant-b"),
        json=_body("Adicionar botão de download no dashboard."),
    )
    assert r.status_code == 200
    content = r.json()["choices"][0]["message"]["content"]
    assert "tenant-b" in content


def test_act_nao_altera_tenant_efetivo(client):
    # act é metadado; o tenant efetivo vem do provider (header)
    r = client.post(
        "/oao/intake/chat/completions",
        headers=_headers("oa-intake", tenant="tenant-a"),
        json={**_body(), "act": "outro-tenant"},
    )
    assert r.status_code == 200
    content = r.json()["choices"][0]["message"]["content"]
    assert "tenant-a" in content
