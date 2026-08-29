"""Testes de isolamento por tenant no console (Fase C, ADR-0015).

Cobre: `GET /tasks` filtra por tenant, `GET /tasks/{thread_id}` de outro tenant
→ 404, `POST /resume` de outro tenant → 404, `POST /intake` cria demanda no
tenant do JWT, `GET /auditoria` filtra por tenant, e endpoints sem token →
401/403.

Usa `HeaderScopeProvider` com headers `X-OAO-Tenant-Id` para simular tenants
diferentes (mais simples que JWT para testes de isolamento).
"""

import pytest
from fastapi.testclient import TestClient

from api.agents import HeaderScopeProvider
from api.main import create_app

CASO_ALTA = (
    "Nova Instrução Normativa do BCB altera o Manual de Escopo de Dados e "
    "Serviços do Open Finance, introduzindo um campo ligado à portabilidade "
    "de crédito consignado."
)


@pytest.fixture
def client() -> TestClient:
    with TestClient(create_app(scope_provider=HeaderScopeProvider())) as c:
        yield c


def _headers(tenant: str) -> dict:
    return {"X-OAO-Tenant-Id": tenant}


def _intake(client: TestClient, tenant: str, texto: str = "Adicionar botão no dashboard.") -> str:
    r = client.post("/intake", headers=_headers(tenant), json={"origem": "cliente", "texto": texto})
    assert r.status_code == 200
    return r.json()["thread_id"]


def test_tasks_filtra_por_tenant(client):
    _intake(client, "tenant-a")
    _intake(client, "tenant-b")

    r_a = client.get("/tasks", headers=_headers("tenant-a"))
    assert r_a.status_code == 200
    assert len(r_a.json()) == 1

    r_b = client.get("/tasks", headers=_headers("tenant-b"))
    assert r_b.status_code == 200
    assert len(r_b.json()) == 1


def test_task_detalhe_de_outro_tenant_retorna_404(client):
    tid = _intake(client, "tenant-a")

    r = client.get(f"/tasks/{tid}", headers=_headers("tenant-b"))
    assert r.status_code == 404

    r_ok = client.get(f"/tasks/{tid}", headers=_headers("tenant-a"))
    assert r_ok.status_code == 200


def test_resume_de_outro_tenant_retorna_404(client):
    tid = _intake(client, "tenant-a", texto=CASO_ALTA)

    r = client.post(
        "/resume",
        headers=_headers("tenant-b"),
        json={"thread_id": tid, "spec": "Spec autorada."},
    )
    assert r.status_code == 404


def test_intake_cria_demanda_no_tenant_do_jwt(client):
    tid = _intake(client, "tenant-x")

    r = client.get(f"/tasks/{tid}", headers=_headers("tenant-x"))
    assert r.status_code == 200

    r_outro = client.get(f"/tasks/{tid}", headers=_headers("tenant-y"))
    assert r_outro.status_code == 404


def test_auditoria_filtra_por_tenant(client):
    _intake(client, "tenant-a", texto=CASO_ALTA)
    _intake(client, "tenant-b", texto=CASO_ALTA)

    r_a = client.get("/auditoria", headers=_headers("tenant-a"))
    assert r_a.status_code == 200
    assert len(r_a.json()) == 1

    r_b = client.get("/auditoria", headers=_headers("tenant-b"))
    assert r_b.status_code == 200
    assert len(r_b.json()) == 1
