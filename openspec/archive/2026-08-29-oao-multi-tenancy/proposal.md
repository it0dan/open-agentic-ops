## Why

O OAO foi fechado como **produto vendável** (ADR-0015): instituições participantes do Open Finance Brasil contratam a squad. Com a Fase B (auth real OAuth2/Keycloak + JWT) concluída, o `tenant_id` já vive no `BoardState` e é extraído do JWT. Porém, **nenhum endpoint do console filtra por tenant** — `GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`, `POST /intake` e `GET /auditoria` operam globalmente. Um FDE de um cliente poderia ver/operar demandas de outro cliente — inaceitável para produto vendável.

Este change implementa a **Fase C (backend)** do plano `oao-endpoints-auth-scopes`: isolamento por tenant em todo endpoint que toca o board (D10), `BoardView` com filtro por `tenant_id` (C.2) e auth real no console (o console passa a exigir Bearer token JWT). O login OIDC no frontend fica para uma rodada separada.

## What Changes

- **`BoardView` com filtro por `tenant_id`**: `all(tenant_id=...)`, `snapshot(thread_id, tenant_id=...)`.
- **Isolamento por tenant** em `GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`, `POST /intake`, `GET /auditoria` — mismatch → **404** (anti-enumeração, ADR-0015).
- **`POST /intake`** usa o tenant do JWT (não `TENANT_DEFAULT`).
- **Auth real no console**: dependency `get_current_tenant`/`require_auth` nos endpoints de dados.
- **Testes** de isolamento por tenant + atualizar `test_api.py` com provider mockado.

## Capabilities

### New Capabilities
- `oao-multi-tenancy`: isolamento por tenant no console do FDE (backend) — `BoardView` filtrado, endpoints com 404 anti-enumeração, `POST /intake` com tenant do JWT, auth real nos endpoints de dados.

### Modified Capabilities
- `oao-auth-real`: o console do FDE passa a exigir Bearer token JWT (auth real) nos endpoints de dados, com isolamento por tenant.

## Impact

- `src/open_agentic_ops/persistence/__init__.py` — `BoardView` com filtro por `tenant_id`.
- `api/main.py` — endpoints do console com isolamento por tenant + auth real.
- `tests/test_api.py` — injeta provider mockado; novos testes de isolamento.
- `docs/adr/0023-multi-tenancy-console-isolation.md` — novo ADR.
- `docs/sdd/feature-intakes/oao-multi-tenancy.md` — novo Feature Intake Brief.
- `openspec/changes/oao-multi-tenancy/` — novo change OpenSpec.
