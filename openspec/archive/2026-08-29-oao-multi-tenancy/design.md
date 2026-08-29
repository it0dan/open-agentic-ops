## Context

A Fase B (auth real OAuth2/Keycloak + JWT) está concluída: `tenant_id` no `BoardState`, `JWTScopeProvider` extrai `client_id` + `tenant_id` do JWT, `get_current_tenant` dependency criada. Porém, os endpoints do console (`/tasks`, `/resume`, `/intake`, `/auditoria`) não filtram nem validam o tenant — operam globalmente. `POST /intake` usa `TENANT_DEFAULT` hardcoded. `BoardView` faz full scan sem filtro.

Esta Fase C (backend) implementa o isolamento por tenant (D10) e auth real no console. O login OIDC no frontend fica para uma rodada separada.

## Goals / Non-Goals

**Goals:**
- `BoardView` filtra por `tenant_id`.
- Todo endpoint que toca o board filtra ou valida contra o tenant do JWT; mismatch → **404** (anti-enumeração, ADR-0015).
- `POST /intake` usa o tenant do JWT (não `TENANT_DEFAULT`).
- O console passa a exigir Bearer token JWT (auth real) nos endpoints de dados.

**Non-Goals:**
- Login OIDC no frontend (rodada separada).
- FDE por tenant no console (login por usuário) — preparar infra, deferir login.
- Filtro de tenant no console web (telas) — deferido.
- Eval gate real LangSmith (ADR-0018) — frente separada.
- Wire do `ToolExecutionPort` MCP / A2A HTTP — frentes separadas.

## Decisions

### D18 — `BoardView` com filtro por `tenant_id`.

Adicionar parâmetro `tenant_id` a `BoardView.all()` e `BoardView.snapshot()`:
- `all(tenant_id: str | None = None)` — filtra os snapshots cujo `snap.get("tenant_id") == tenant_id`. Se `tenant_id` for `None`, retorna todos (uso interno/global).
- `snapshot(thread_id, tenant_id: str | None = None)` — se `tenant_id` fornecido e o snapshot não pertencer ao tenant, retorna `None` (o endpoint responde 404).

### D19 — Isolamento por tenant nos endpoints do console (404 anti-enumeração).

- `GET /tasks` — filtra por `tenant_id` do JWT.
- `GET /tasks/{thread_id}` — `snapshot(thread_id, tenant_id)`; se `None` → **404**.
- `POST /resume` — valida tenant do thread; mismatch → **404**.
- `POST /intake` — usa o tenant do JWT (não `TENANT_DEFAULT`).
- `GET /auditoria` — filtra por `tenant_id` do JWT.

Mismatch retorna **404** (não 403), prática anti-enumeração (ADR-0015).

### D20 — Auth real no console (dependency `get_current_tenant`).

Os endpoints de dados do console (`/tasks`, `/tasks/{thread_id}`, `/resume`, `/intake`, `/auditoria`) passam a exigir Bearer token JWT via dependency `get_current_tenant` (que usa o `JWTScopeProvider`). Sem token válido → 401/403. O `HeaderScopeProvider` permanece como provider de dev/teste (injetável via `create_app(scope_provider=...)`).

### D21 — `POST /intake` com tenant do JWT.

`POST /intake` usa `get_current_tenant(request)` em vez de `TENANT_DEFAULT`. O tenant vem da claim do JWT (única fonte de verdade, ADR-0015).

## Risks / Trade-offs

- [Testes existentes do console usam `create_app()` sem auth] → injetar provider mockado (`HeaderScopeProvider`) no fixture de `test_api.py`.
- [Console pode quebrar temporariamente] → o frontend ainda não envia token; o login OIDC fica para a próxima rodada. Documentado como transição.
- [Sem defesa em profundidade (ADR-0015)] → enforcement disciplinado em todo endpoint + testes de isolamento.
- [Escopos do console] → o FDE (usuário) precisa de escopos para `/tasks`, `/resume`, `/intake`, `/auditoria`; matriz de escopos do FDE definida na rodada do frontend OIDC.
