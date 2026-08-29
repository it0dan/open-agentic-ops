## Context

A Fase A do change `oao-endpoints-auth-scopes` implementou a superfície `/oao/<agent>/chat/completions` com auth mockada (`HeaderScopeProvider` lê `client_id`/`tenant_id` de headers). O `ScopeProvider` é um Protocol com interface `client_id(request)`/`tenant_id(request)` — pronto para trocar por JWT. O `build_graph` já aceita `llm`/`tools` injetáveis e os repassa aos nós (o `feature_node` usa `LLMProviderPort`).

Esta Fase B implementa a Camada 2: auth real OAuth2/Keycloak + JWT (D7), wire do `LLMProviderPort` real (D8) e enforcement real de escopos (D9). O grafo core não muda — apenas se expõe com auth real.

## Goals / Non-Goals

**Goals:**
- Validar Bearer token JWT emitido pelo Keycloak (realm único, assinatura via JWKS).
- Extrair `client_id` e claim `tenant_id` do token (única fonte de verdade, ADR-0015).
- Enforce escopos por `client_id` do JWT (não do header mockado).
- Wirear o `LLMProviderPort` real (Sensedia AI Gateway) no `build_graph`, com degradação graciosa sem credenciais.
- Provisionar Keycloak local via docker-compose com realm import (reproduzível).

**Non-Goals:**
- Wire do `ToolExecutionPort` MCP (git/test/deploy) — depende de MCP server; fica como stub.
- A2A HTTP (Architecture/Review) — Camada 2 do protocolo, fica como stub.
- Eval gate real LangSmith (ADR-0018) — frente separada.
- Fase C (multi-tenancy completo: isolamento em todo endpoint + FDE por tenant) — próxima fase.
- Cadastro de scopes/credenciais no AI Gateway real — feito pelo usuário, não bloqueia (mock + degradação graciosa).

## Decisions

### D12 — Keycloak provisionado via docker-compose + realm import.

Adicionar serviço `keycloak` ao `docker-compose.yml` (imagem `quay.io/keycloak/keycloak`, porta 8080, modo `start-dev` para dev, volume de import do realm). O realm é versionado em `infra/keycloak/realm-export.json` com:
- Realm único `oao`.
- Clientes `oa-intake`, `oa-feature-backend`, `oa-feature-frontend`, `oa-platform`, `oa-review`, `oa-architecture`, `oa-sre` (tipo `confidential`, `client_credentials`).
- Protocol mapper `tenant_id` (User Attribute → claim) para FDEs.
- Usuário FDE de teste com `tenant_id`.

Realm import via `--import-realm` (Keycloak lê de `/opt/keycloak/data/import`). Reproduzível e versionável.

### D13 — `JWTScopeProvider` implementa `ScopeProvider` (validação via JWKS).

Criar `src/open_agentic_ops/auth.py` com `JWTScopeProvider` que:
- Lê o Bearer token do header `Authorization`.
- Busca as chaves públicas do Keycloak via JWKS (`KEYCLOAK_JWKS_URL`), com cache.
- Valida assinatura, expiração e issuer/audience.
- Extrai `client_id` (claim `azp` ou `client_id`) e claim `tenant_id`.
- Mantém a interface `client_id(request)`/`tenant_id(request)` do `ScopeProvider`.

Fallback: `HeaderScopeProvider` permanece como provider de dev/teste, selecionável via env (`OAO_AUTH_MODE=header|jwt`). Default em produção: `jwt`.

### D14 — Dependency FastAPI `get_current_tenant`.

Dependency que usa o `JWTScopeProvider` para retornar o `tenant_id` do token. Usada nos endpoints que tocam o board (Fase C). Nesta Fase B, o tenant já é extraído do JWT no provider; `get_current_tenant` formaliza a dependency para a Fase C.

### D15 — `SensediaAIGatewayProvider` implementa `LLMProviderPort` com degradação graciosa.

Criar `src/open_agentic_ops/providers/ai_gateway.py` com `SensediaAIGatewayProvider`:
- `invoke(prompt, *, system=None)` implementa `LLMProviderPort`.
- Obtém token via OAuth2 `client_credentials` (`AI_GATEWAY_OAUTH_ENDPOINT` + `AI_GATEWAY_CLIENT_ID`/`AI_GATEWAY_CLIENT_SECRET`).
- Chama o endpoint de chat (`AI_GATEWAY_CHAT_ENDPOINT`) com payload OpenAI-compatível.
- **Degradação graciosa:** se credenciais ausentes ou chamada falhar, cai no fallback determinístico (mesmo comportamento do `_DefaultLLM` atual) — mantém testes verdes sem infra.

### D16 — Wire do LLM real no `create_app`.

`create_app` instancia o `SensediaAIGatewayProvider` (se credenciais presentes) e passa ao `build_graph(llm=provider)`. Sem credenciais, `build_graph` usa o fallback determinístico (comportamento atual). O provider é injetável para testes.

### D17 — Enforcement real de escopos por `client_id` do JWT.

`require_scope` continua lendo o `client_id` do `ScopeProvider` (agora `JWTScopeProvider`), mas o `client_id` vem do token validado, não do header. `deploy:execute` só pós-Eval e `pr:merge` exclusivo do FDE permanecem como restrições de processo declaradas em `scopes.py` (enforcement de processo depende do Eval gate real, ADR-0018 — frente separada). `pii:raw` negado a todos por construção.

## Risks / Trade-offs

- [JWKS fetch precisa de rede] → cache das chaves; em testes, usar chave local assinada (sem rede).
- [Formato do token Keycloak] → `client_id` em `azp` ou `client_id`; `tenant_id` via protocol mapper (claim custom); tratar ambos.
- [Credenciais do AI Gateway não cadastradas] → provider degrada graciosamente; smoke test real condicionado ao cadastro do usuário.
- [Sem defesa em profundidade (ADR-0015)] → enforcement disciplinado em todo endpoint + testes de isolamento (Fase C).
- [`deploy:execute` pós-Eval] → enforcement de processo depende do Eval gate real (ADR-0018), frente separada; aqui só o escopo por `client_id`.
