# oao-multi-tenancy Specification

## Purpose
TBD - created by archiving change oao-multi-tenancy. Update Purpose after archive.
## Requirements
### Requirement: Isolamento por tenant no console do FDE

O sistema SHALL isolar as demandas por `tenant_id` nos endpoints do console do FDE (`GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`, `POST /intake`, `GET /auditoria`), filtrando ou validando contra o tenant do JWT, com mismatch retornando **404** (anti-enumeração, ADR-0015).

#### Scenario: Lista de tasks filtrada por tenant

- **WHEN** um FDE do tenant X chama `GET /tasks` com Bearer token (claim `tenant_id` = X)
- **THEN** a resposta contém apenas demandas do tenant X

#### Scenario: Detalhe de task de outro tenant

- **WHEN** um FDE do tenant X chama `GET /tasks/{thread_id}` de uma demanda do tenant Y (X ≠ Y)
- **THEN** o endpoint responde 404

#### Scenario: Resume de demanda de outro tenant

- **WHEN** um FDE do tenant X chama `POST /resume` para uma demanda do tenant Y (X ≠ Y)
- **THEN** o endpoint responde 404

#### Scenario: Intake cria demanda no tenant do JWT

- **WHEN** um FDE do tenant X chama `POST /intake` com Bearer token (claim `tenant_id` = X)
- **THEN** a demanda é criada com `tenant_id` = X (não `TENANT_DEFAULT`)

#### Scenario: Auditoria filtrada por tenant

- **WHEN** um FDE do tenant X chama `GET /auditoria` com Bearer token (claim `tenant_id` = X)
- **THEN** a resposta contém apenas classificações de demandas do tenant X

### Requirement: BoardView com filtro por tenant_id

O sistema SHALL prover `BoardView` com filtro por `tenant_id` (`all(tenant_id=...)` e `snapshot(thread_id, tenant_id=...)`), retornando `None`/vazio quando o thread não pertence ao tenant.

#### Scenario: all filtra por tenant

- **WHEN** `BoardView.all(tenant_id="X")` é chamado
- **THEN** retorna apenas demandas com `tenant_id` = X

#### Scenario: snapshot valida tenant

- **WHEN** `BoardView.snapshot(thread_id, tenant_id="X")` é chamado para uma demanda de outro tenant
- **THEN** retorna `None`

### Requirement: Auth real no console

O sistema SHALL exigir Bearer token JWT (Keycloak) nos endpoints de dados do console (`GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`, `POST /intake`, `GET /auditoria`), via dependency `get_current_tenant`.

#### Scenario: Sem token

- **WHEN** um endpoint de dados do console é chamado sem Bearer token
- **THEN** o endpoint responde 401/403

#### Scenario: Token válido

- **WHEN** um endpoint de dados do console é chamado com Bearer token válido
- **THEN** o endpoint processa a requisição com o tenant do JWT

