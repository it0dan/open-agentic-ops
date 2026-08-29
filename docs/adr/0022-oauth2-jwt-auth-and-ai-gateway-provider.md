# Auth real OAuth2/Keycloak + JWT e LLMProviderPort real (AI Gateway)

## Status

Accepted

## Context

A superfície de integração externa do OAO (`/oao/<agent>/chat/completions`) foi implementada na Fase A (Camada 1) com auth **mockada**: o `HeaderScopeProvider` lê `client_id`/`tenant_id` de headers forjáveis. Para o OAO ser um **produto vendável** (ADR-0015), a superfície precisa de auth real: OAuth2 `client_credentials` + JWT (Keycloak), com `tenant_id` vindo da claim do token e enforcement real de escopos por `client_id`.

Além disso, o `build_graph` já aceita `llm`/`tools` injetáveis (ADR-0016), mas o `LLMProviderPort` concreto (Sensedia AI Gateway) nunca foi wireado — o `feature_node` usa o fallback determinístico `_DefaultLLM`.

## Decision

- **Keycloak provisionado** via docker-compose (imagem `quay.io/keycloak/keycloak:26.0`, porta 8080, management 9000) com realm import versionado em `infra/keycloak/realm-export.json` (realm `oao`, clientes `oa-*` com `client_credentials`, protocol mapper `tenant_id` para FDEs).
- **`JWTScopeProvider`** (implementa `ScopeProvider`): valida Bearer token JWT via JWKS (PyJWT `PyJWKClient`), extrai `client_id` (claim `azp`/`client_id`) e claim `tenant_id`. Sem token válido → `client_id` vazio (o `require_scope` responde 403/401).
- **`get_current_tenant`**: dependency FastAPI que retorna o `tenant_id` do JWT (formaliza o acesso para a Fase C).
- **Modo de auth selecionável** via `OAO_AUTH_MODE` (`jwt` default, `header` para dev/teste). O `HeaderScopeProvider` permanece como fallback de dev/teste.
- **`SensediaAIGatewayProvider`** (implementa `LLMProviderPort`): obtém token via OAuth2 `client_credentials` e chama o endpoint de chat (OpenAI-compatível). **Degradação graciosa**: sem credenciais ou em falha, cai no fallback determinístico — mantém testes verdes sem infra.
- **Wire do LLM real** no `create_app` → `build_graph(llm=...)` quando credenciais presentes.
- **Enforcement real de escopos** por `client_id` do JWT (não do header mockado). `pii:raw` negado a todos por construção; `deploy:execute`/`pr:merge` permanecem como restrições de processo declaradas (enforcement de processo depende do Eval gate real, ADR-0018).

## Consequences

- A superfície `/oao/*` deixa de confiar em headers forjáveis — auth real OAuth2/Keycloak + JWT.
- `tenant_id` vem da claim do token (única fonte de verdade, ADR-0015); sem claim, usa `TENANT_DEFAULT`.
- O `LLMProviderPort` real (AI Gateway) é wireado quando credenciais presentes; degrada graciosamente sem elas.
- O smoke test real do AI Gateway fica condicionado ao cadastro de scopes/credenciais no gateway (feito pelo usuário).
- Fase C (multi-tenancy completo: isolamento em todo endpoint + FDE por tenant) permanece como próxima fase.
- `PyJWT` + `cryptography` adicionados como dependências.
