## ADDED Requirements

### Requirement: Plano de implementação da superfície de integração externa

O sistema SHALL documentar um plano de implementação, em 3 fases (Camada 1 harness, Camada 2 infra real, multi-tenancy), para a superfície de integração externa do OAO definida em `Inicio/definicoes/oao-endpoints-and-scopes.md` — endpoints por agente, auth OAuth2/Keycloak, matriz de escopos, delegação `act` e tenant-scoping (ADR-0015).

#### Scenario: Artefatos do plano criados

- **WHEN** o change `oao-endpoints-auth-scopes` é criado
- **THEN** existem `proposal.md`, `design.md`, `specs/oao-endpoints-auth-scopes/spec.md` e `tasks.md` em `openspec/changes/oao-endpoints-auth-scopes/`

#### Scenario: Feature Intake Brief criado

- **WHEN** o plano é documentado
- **THEN** existe `docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md` seguindo o template do projeto

#### Scenario: Doc de endpoints referencia o plano

- **WHEN** o plano é documentado
- **THEN** `Inicio/definicoes/oao-endpoints-and-scopes.md` contém uma seção "Plano de implementação" apontando para os artefatos

### Requirement: Decisões técnicas detalhadas por fase

O sistema SHALL detalhar decisões técnicas para cada fase do plano, cobrindo: `tenant_id` no `BoardState` (D1), origem do tenant via claim JWT (D2), matriz de escopos declarativa em `scopes.py` (D3), endpoints por agente com validação de escopo em memória (D4), delegação `act` como metadado (D5), auth real OAuth2/Keycloak (D7), wire dos ports reais (D8), enforcement real de escopos (D9), isolamento por tenant (D10) e FDE por tenant (D11).

#### Scenario: Design cobre as 3 fases

- **WHEN** o `design.md` é revisado
- **THEN** ele contém decisões numeradas (D1–D11) distribuídas entre Fase A (Camada 1), Fase B (Camada 2) e Fase C (multi-tenancy)

#### Scenario: Tasks organizadas em 3 fases

- **WHEN** o `tasks.md` é revisado
- **THEN** as tasks estão agrupadas em Fase A (Camada 1), Fase B (Camada 2) e Fase C (multi-tenancy)

### Requirement: Mapeamento do contrato para o plano

O sistema SHALL mapear cada endpoint, escopo e restrição do contrato (`Inicio/definicoes/oao-endpoints-and-scopes.md`) para uma decisão ou task do plano, garantindo cobertura completa.

#### Scenario: Todos os agentes cobertos

- **WHEN** o plano é revisado
- **THEN** os 7 agentes (Intake, Feature-backend, Feature-frontend, Platform, Review, Architecture, SRE) têm endpoint `/oao/<agent>/chat/completions` mapeado

#### Scenario: Escopos transversais cobertos

- **WHEN** o plano é revisado
- **THEN** a matriz de escopos transversais (`board:read/write`, `spec:read/draft`, `repo:read/write`, `platform:invoke`, `architecture:consult`, `ci/lint/test:run`, `deploy:execute`, `obs/slo:read`, `pr:read/comment/merge`, `contract:read`, `adr:write`, `pii:mask/raw`, `precedent:search`) está mapeada

#### Scenario: Restrições de segurança cobertas

- **WHEN** o plano é revisado
- **THEN** as restrições do contrato estão mapeadas: `pii:raw` negado a todos, `deploy:execute` só pós-Eval, `pr:merge` exclusivo do FDE, tenant-scoping com 404 anti-enumeração
