## Why

A superfície de integração externa do OAO (`/oao/<agent>/chat/completions`) foi implementada na **Fase A (Camada 1)** do change `oao-endpoints-auth-scopes` com auth **mockada**: o `HeaderScopeProvider` lê `client_id`/`tenant_id` de headers forjáveis. Para o OAO ser um **produto vendável** (ADR-0015), a superfície precisa de **auth real**: OAuth2 `client_credentials` + JWT (Keycloak), com `tenant_id` vindo da claim do token e enforcement real de escopos por `client_id`.

Sem auth real, qualquer chamada com headers forjados acessa os agentes — inaceitável para instituições do Open Finance Brasil que contratam a squad. Este change implementa a **Fase B (Camada 2)** do plano: auth real OAuth2/Keycloak + JWT (D7), wire do `LLMProviderPort` real (Sensedia AI Gateway) (D8) e enforcement real de escopos por `client_id` do JWT (D9).

## What Changes

- **Keycloak provisionado** no `docker-compose.yml` (realm único + import de realm JSON com clientes `oa-*` e protocol mapper `tenant_id`).
- **Dependência JWT** (`PyJWT` + `cryptography`) adicionada ao `pyproject.toml`.
- **`JWTScopeProvider`** (implementa `ScopeProvider`): decodifica/valida Bearer token via JWKS, extrai `client_id` e claim `tenant_id`.
- **Dependency FastAPI `get_current_tenant`**: extrai o tenant do JWT (única fonte de verdade, ADR-0015).
- **`SensediaAIGatewayProvider`** (implementa `LLMProviderPort`): OAuth2 `client_credentials` + chat, com degradação graciosa sem credenciais.
- **Wire do LLM real** no `create_app` → `build_graph(llm=...)`.
- **Enforcement real de escopos** por `client_id` do JWT (B.3/D9).
- **Testes** (auth, agents_api com JWT, ai_gateway_provider com mock).

## Capabilities

### New Capabilities
- `oao-auth-real`: auth real OAuth2/Keycloak + JWT na superfície `/oao/*`, wire do `LLMProviderPort` real (Sensedia AI Gateway) e enforcement real de escopos por `client_id` do JWT.

### Modified Capabilities
- `oao-endpoints-auth-scopes`: a superfície `/oao/*` deixa de confiar em headers forjáveis e passa a validar Bearer token JWT (Keycloak), com `tenant_id` da claim e escopos do `client_id` do token.

## Impact

- `docker-compose.yml` — serviço `keycloak` adicionado.
- `infra/keycloak/realm-export.json` — novo realm com clientes `oa-*` e protocol mapper `tenant_id`.
- `pyproject.toml` + `poetry.lock` — dependências `PyJWT` + `cryptography`.
- `src/open_agentic_ops/auth.py` — novo: `JWTScopeProvider` + `get_current_tenant`.
- `src/open_agentic_ops/providers/ai_gateway.py` — novo: `SensediaAIGatewayProvider`.
- `api/main.py` — provider JWT + LLM real wireados.
- `api/agents.py` — `require_scope` lê `client_id` do JWT.
- `tests/` — novos testes de auth, agents_api com JWT e ai_gateway_provider.
- `.env.example` — variáveis `KEYCLOAK_*` e `AI_GATEWAY_CHAT_ENDPOINT`.
- `docs/adr/0022-oauth2-jwt-auth-and-ai-gateway-provider.md` — novo ADR.
