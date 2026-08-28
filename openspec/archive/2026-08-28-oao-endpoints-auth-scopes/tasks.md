## Fase 0 — Documentação do plano (esta rodada)

- [x] 0.1 Criar Feature Intake Brief `docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md`.
- [x] 0.2 Criar change OpenSpec `oao-endpoints-auth-scopes` (proposal/design/spec/tasks).
- [x] 0.3 Validar o change (`openspec validate --changes` → valid).
- [x] 0.4 Adicionar seção "Plano de implementação" em `Inicio/definicoes/oao-endpoints-and-scopes.md`.

## Fase A — Camada 1 (harness, testável hoje, sem infra)

- [x] A.1 `state.py`: adicionar `tenant_id: str` ao `BoardState` (D1, ADR-0015).
- [x] A.2 `scopes.py`: criar matriz declarativa `ESCOPOS_POR_CLIENT_ID` e `ESCOPOS_POR_RECURSO` (D3).
- [x] A.3 `api/agents.py` (router): endpoints `/oao/<agent>/chat/completions` para os 7 agentes, formato OpenAI-compatível (`messages[]`), tradutor para o nó do grafo (D4).
- [x] A.4 Dependency `require_scope(scope)` com provider de `client_id`/escopos mockado/injetável (D4).
- [x] A.5 Delegação `act` como metadado de contexto, sem alterar tenant efetivo (D5).
- [x] A.6 `POST /intake`: propagar `tenant_id` (da claim JWT mockada na Camada 1; do `state` no port `criar_demanda` do SRE) (D2).
- [x] A.7 Testes `tests/test_agents_api.py`: escopo negado → 403; tenant mismatch → 404; `act` propagado; endpoint por agente responde (D6).

## Fase B — Camada 2 (depende de infra: Keycloak, Postgres, gateway)

- [ ] B.1 Auth real OAuth2 `client_credentials` + JWT (Keycloak realm único, protocol mapper `tenant_id`); dependency `get_current_tenant` (D7).
- [ ] B.2 Wire dos ports reais: `LLMProviderPort` (Sensedia AI Gateway/JWT), `ToolExecutionPort` (MCP git/test/deploy), A2A HTTP (Architecture/Review) (D8).
- [ ] B.3 Enforcement real de escopos por `client_id` do JWT; `deploy:execute` só pós-Eval; `pr:merge` exclusivo do FDE; `pii:raw` negado (D9).

## Fase C — Multi-tenancy (ADR-0015)

- [ ] C.1 Isolamento por tenant em todo endpoint que toca o board (`GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`, `POST /intake`); mismatch → 404 (D10).
- [ ] C.2 `BoardView` com filtro por `tenant_id` (D10).
- [ ] C.3 FDE por tenant (atributo Keycloak `tenant_id` por usuário); console continua global (D11).
