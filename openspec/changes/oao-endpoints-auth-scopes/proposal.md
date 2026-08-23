## Why

O OAO foi fechado como **produto vendável** (ADR-0015): instituições participantes do Open Finance Brasil contratam a squad. Para isso, precisa de uma **superfície de integração externa** — um gateway por agente consumido via HTTP com autenticação e autorização por escopo. O contrato já foi definido em `Inicio/definicoes/oao-endpoints-and-scopes.md` (endpoints `/oao/<agent>/chat/completions`, OAuth2 `client_credentials`, matriz de escopos, delegação `act`, tenant-scoping), mas **não tem correspondência no código**: a única API existente é o console do FDE (humana, sem auth), não há `tenant_id` no `BoardState`, não há escopos nem delegação.

Este change transforma o contrato em um **plano de implementação executável**, organizado em 3 fases (Camada 1 harness → Camada 2 infra real → multi-tenancy), com decisões técnicas detalhadas. É uma rodada de **documentação/planejamento** — não implementa código.

## What Changes

- Novo Feature Intake Brief em `docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md`.
- Novo change OpenSpec `oao-endpoints-auth-scopes` com `proposal.md`, `design.md`, `specs/oao-endpoints-auth-scopes/spec.md` e `tasks.md` (3 fases).
- Seção "Plano de implementação" em `Inicio/definicoes/oao-endpoints-and-scopes.md` apontando para os artefatos.

## Capabilities

### New Capabilities
- `oao-endpoints-auth-scopes`: plano de implementação da superfície de integração externa do OAO — endpoints por agente, auth OAuth2/Keycloak, matriz de escopos, delegação `act` e tenant-scoping (ADR-0015), em 3 fases.

### Modified Capabilities
<!-- Nenhuma spec existente muda de comportamento nesta rodada (apenas documentos). -->

## Impact

- `docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md` — novo Feature Intake Brief.
- `openspec/changes/oao-endpoints-auth-scopes/` — novo change OpenSpec (proposal/design/spec/tasks).
- `Inicio/definicoes/oao-endpoints-and-scopes.md` — seção "Plano de implementação" adicionada.
- Sem mudanças de código, runtime Python, API pública, dependências ou backend nesta rodada.
