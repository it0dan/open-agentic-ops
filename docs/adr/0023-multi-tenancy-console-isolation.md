# Isolamento por tenant no console do FDE + auth real

## Status

Accepted

## Context

O OAO foi fechado como **produto vendável** (ADR-0015): instituições participantes do Open Finance Brasil contratam a squad. Com a Fase B (auth real OAuth2/Keycloak + JWT) concluída, o `tenant_id` já vive no `BoardState` e é extraído do JWT via `get_current_tenant`. Porém, **nenhum endpoint do console filtra por tenant** — `GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`, `POST /intake` e `GET /auditoria` operam globalmente. `POST /intake` usa `TENANT_DEFAULT` hardcoded. `BoardView` faz full scan sem filtro.

Sem isolamento, um FDE de um cliente poderia ver/operar demandas de outro cliente — inaceitável para produto vendável. Esta Fase C (backend) implementa o isolamento por tenant (D10) e auth real no console. O login OIDC no frontend fica para uma rodada separada.

## Decision

- **`BoardView` com filtro por `tenant_id`**: `all(tenant_id=None)` filtra os snapshots cujo `tenant_id` coincide; `snapshot(thread_id, tenant_id=None)` retorna `None` se o thread não pertencer ao tenant. `tenant_id=None` mantém o comportamento global (uso interno).
- **Isolamento por tenant nos endpoints do console** (`GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`, `POST /intake`, `GET /auditoria`): filtram ou validam contra o tenant do JWT. Mismatch → **404** (não 403), prática anti-enumeração (ADR-0015).
- **`POST /intake` usa o tenant do JWT** (não `TENANT_DEFAULT`). O tenant vem da claim do token — única fonte de verdade (ADR-0015).
- **Auth real no console**: os endpoints de dados passam a exigir Bearer token JWT via dependency `get_current_tenant` (que usa o `JWTScopeProvider`). Sem token válido → 401/403. O `HeaderScopeProvider` permanece como provider de dev/teste, injetável via `create_app(scope_provider=...)`.

## Consequences

- Um FDE de um tenant só vê/opera demandas do próprio tenant; acesso a demanda de outro tenant → 404 (anti-enumeração).
- `POST /intake` cria demandas no tenant do JWT, não mais em `TENANT_DEFAULT`.
- O console passa a exigir Bearer token JWT nos endpoints de dados. O frontend ainda não envia token (login OIDC fica para a próxima rodada) — o console pode quebrar temporariamente até o frontend ser atualizado (transição documentada).
- Testes do console injetam provider mockado (`HeaderScopeProvider`) para isolar o estado do board.
- FDE por tenant no console (login por usuário) e filtro de tenant no console web permanecem deferidos.
