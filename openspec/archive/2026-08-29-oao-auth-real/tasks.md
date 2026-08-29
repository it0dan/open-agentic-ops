## Grupo 1 — Infra (Keycloak + dependência JWT)

- [x] 1.1 Adicionar serviço `keycloak` ao `docker-compose.yml` (imagem `quay.io/keycloak/keycloak`, porta 8080, `start-dev`, volume de import).
- [x] 1.2 Criar `infra/keycloak/realm-export.json` (realm `oao`, clientes `oa-*`, protocol mapper `tenant_id`, usuário FDE de teste).
- [x] 1.3 Adicionar `PyJWT` + `cryptography` ao `pyproject.toml` (via `poetry add`).
- [x] 1.4 Atualizar `.env.example` com `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_JWKS_URL`, `AI_GATEWAY_CHAT_ENDPOINT`, `OAO_AUTH_MODE`.

## Grupo 2 — Auth real (D7/D13/D14)

- [x] 2.1 Criar `src/open_agentic_ops/auth.py` com `JWTScopeProvider` (validação via JWKS, extração `client_id` + `tenant_id`).
- [x] 2.2 Criar dependency FastAPI `get_current_tenant`.
- [x] 2.3 Trocar `HeaderScopeProvider` por `JWTScopeProvider` no `create_app` (selecionável via `OAO_AUTH_MODE`; header provider como fallback de dev/teste).

## Grupo 3 — LLMProviderPort real (D8/D15/D16)

- [x] 3.1 Criar `src/open_agentic_ops/providers/ai_gateway.py` com `SensediaAIGatewayProvider` (OAuth2 client_credentials + chat, degradação graciosa).
- [x] 3.2 Wirear o provider no `create_app` → `build_graph(llm=...)` (se credenciais presentes; injetável para testes).

## Grupo 4 — Enforcement real de escopos (D9/D17)

- [x] 4.1 `require_scope` passa a ler `client_id` do JWT (via `JWTScopeProvider`).
- [x] 4.2 Confirmar `pii:raw` negado a todos e `deploy:execute`/`pr:merge` como restrições de processo declaradas.

## Grupo 5 — Testes e validação

- [x] 5.1 Criar `tests/test_auth.py` (JWTScopeProvider: token válido/inválido/expirado, extração client_id/tenant).
- [x] 5.2 Estender `tests/test_agents_api.py` com auth real (401/403/404 via JWT).
- [x] 5.3 Criar `tests/test_ai_gateway_provider.py` (mock do gateway: token + chat; degradação graciosa).
- [x] 5.4 `poetry run pytest` verde; `poetry run ruff check .` limpo.

## Grupo 6 — Docs e arquivamento

- [x] 6.1 Criar ADR-0022 (auth real OAuth2/Keycloak + AI Gateway provider).
- [x] 6.2 Atualizar `HANDOFF.md`, `README.md`, `ARCHITECTURE.md`.
- [x] 6.3 Arquivar o change `oao-auth-real` em `openspec/archive/`.
- [x] 6.4 Commits coesos + push (após confirmação).
