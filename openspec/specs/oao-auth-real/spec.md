# oao-auth-real Specification

## Purpose
TBD - created by archiving change oao-auth-real. Update Purpose after archive.
## Requirements
### Requirement: Auth real OAuth2/Keycloak + JWT na superfície /oao/*

O sistema SHALL validar o Bearer token JWT emitido pelo Keycloak (realm único, assinatura via JWKS) nas requisições aos endpoints `/oao/<agent>/chat/completions`, extraindo `client_id` e claim `tenant_id` do token como única fonte de verdade (ADR-0015).

#### Scenario: Token válido com escopo concedido

- **WHEN** uma requisição chega com `Authorization: Bearer <token válido>` cujo `client_id` possui o escopo requerido
- **THEN** o endpoint responde 200 e o `tenant_id` da claim é propagado ao estado

#### Scenario: Token inválido ou expirado

- **WHEN** uma requisição chega com token inválido, expirado ou com assinatura incorreta
- **THEN** o endpoint responde 401

#### Scenario: Token sem o escopo requerido

- **WHEN** uma requisição chega com token válido cujo `client_id` não possui o escopo requerido
- **THEN** o endpoint responde 403

### Requirement: Enforcement real de escopos por client_id do JWT

O sistema SHALL validar o escopo do `client_id` extraído do JWT (não do header mockado) em cada endpoint `/oao/<agent>/chat/completions`, mantendo `pii:raw` negado a todos por construção.

#### Scenario: Escopo negado por client_id do JWT

- **WHEN** o `client_id` do JWT não possui o escopo requerido pelo endpoint
- **THEN** o endpoint responde 403

#### Scenario: pii:raw negado a todos

- **WHEN** qualquer `client_id` tenta acessar `pii:raw`
- **THEN** o acesso é negado (403), pois `pii:raw` está em `ESCOPOS_NEGADOS`

### Requirement: LLMProviderPort real (Sensedia AI Gateway) com degradação graciosa

O sistema SHALL wirear um `LLMProviderPort` concreto (Sensedia AI Gateway) no `build_graph`, obtendo token via OAuth2 `client_credentials` e chamando o endpoint de chat, com degradação graciosa para o fallback determinístico quando credenciais estiverem ausentes ou a chamada falhar.

#### Scenario: Credenciais presentes

- **WHEN** `AI_GATEWAY_CLIENT_ID`/`AI_GATEWAY_CLIENT_SECRET` estão configurados
- **THEN** o `SensediaAIGatewayProvider` obtém token via OAuth2 e chama o chat, retornando a resposta textual

#### Scenario: Credenciais ausentes

- **WHEN** as credenciais do AI Gateway não estão configuradas
- **THEN** o provider degrada graciosamente para o fallback determinístico, mantendo o comportamento atual

### Requirement: Keycloak provisionado via docker-compose com realm import

O sistema SHALL provisionar o Keycloak no `docker-compose.yml` com import de realm JSON versionado em `infra/keycloak/realm-export.json`, contendo os clientes `oa-*` e o protocol mapper `tenant_id`.

#### Scenario: Realm importado

- **WHEN** o docker-compose sobe o serviço `keycloak`
- **THEN** o realm `oao` é importado com os clientes `oa-intake`, `oa-feature-backend`, `oa-feature-frontend`, `oa-platform`, `oa-review`, `oa-architecture`, `oa-sre` e o protocol mapper `tenant_id`

