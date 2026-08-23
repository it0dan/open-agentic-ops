## Context

O contrato em `Inicio/definicoes/oao-endpoints-and-scopes.md` define a superfície de integração externa do OAO: endpoints OpenAI-compatíveis `/oao/<agent>/chat/completions` para os 7 agentes, auth OAuth2 `client_credentials` (Keycloak), matriz de escopos transversais, delegação via `act` e tenant-scoping. O código atual está muito aquém:

- `api/main.py` expõe apenas o **console do FDE** (humana): `/tasks`, `/resume`, `/intake`, `/auditoria`. Não há endpoints por agente.
- **Auth é mockada** (ADR-0014): frontend usa `localStorage "fde-auth"`; a API não verifica token.
- **Não existe `tenant_id`** no `BoardState` (ADR-0015 não implementado) — o board é global.
- **Não há escopos nem delegação `act`**.
- O protocolo MCP/A2A (ADR-0007) está desenhado, mas sem transporte real (Camada 2).

Este design detalha as decisões técnicas para implementar o contrato em **3 fases incrementais**, respeitando as ADRs existentes e o princípio de que o grafo core não muda — apenas se expõe.

## Goals / Non-Goals

**Goals:**
- Transformar o contrato em plano executável com decisões técnicas detalhadas.
- Cobrir as 3 fases: Camada 1 (harness, testável hoje), Camada 2 (infra real), multi-tenancy (ADR-0015).
- Mapear cada endpoint/escopo/restrição do contrato para uma decisão ou task.
- Manter o grafo core (nós/arestas/gates) intacto — apenas expor.

**Non-Goals:**
- Implementar código nesta rodada (apenas documentos).
- Mudar o grafo LangGraph (nós/arestas/gates).
- Provisionar infra real (Keycloak, Postgres, gateway) — dependência da Camada 2.
- Implementar `pii:raw` (negado a todos, ADR-0006).
- Alterar o console do FDE (continua global, uso interno — ADR-0015).

## Decisions

### Fase A — Camada 1 (harness, testável hoje, sem infra)

**D1 — `tenant_id` no `BoardState` (ADR-0015).**
Adicionar campo `tenant_id: str` ao `BoardState` (mesma filosofia de "o board é o checkpointer", ADR-0002). Roundtrip automático via `channel_values`. `thread_id` continua `uuid4()` puro, **sem namespace** — consequência registrada no ADR-0015: isolamento depende de enforcement disciplinado em todo endpoint (sem defesa em profundidade estrutural).

**D2 — Origem do `tenant_id` via claim JWT (Keycloak), nunca do corpo.**
`IntakeBody` **não** ganha campo `tenant_id`. Em `POST /intake`, o tenant vem do JWT (claim via Protocol Mapper User Attribute → claim). Exceção: demandas geradas pelo SRE (port `criar_demanda`) propagam `tenant_id` do próprio `state` da execução corrente (chamada interna, sem JWT).

**D3 — Matriz de escopos declarativa em módulo `scopes.py`.**
Criar `src/open_agentic_ops/scopes.py` com a matriz transversal do contrato como dados declarativos (constante `ESCOPOS_POR_CLIENT_ID: dict[str, set[str]]` e `ESCOPOS_POR_RECURSO`). Fonte única de verdade, testável, sem lógica espalhada. Alternativa (config YAML) rejeitada: módulo Python permite tipagem e testes unitários diretos.

**D4 — Endpoints por agente com validação de escopo em memória (Camada 1).**
Estrutura de rotas `/oao/<agent>/chat/completions` no `api/main.py` (ou router dedicado `api/agents.py`), com dependency `require_scope(scope)` que valida o `client_id` contra a matriz. Na Camada 1, o `client_id`/escopos vêm de um **provedor mockado/injetável** (sem auth real); o enforcement real fica para a Camada 2. Formato do payload: **OpenAI-compatível** (`messages[]`), conforme o contrato — o handler traduz `messages` para a invocação do nó do grafo correspondente.

**D5 — Delegação `act` como metadado de contexto.**
`act` (age em nome do originador/agente) entra como campo de contexto no payload, propagado ao estado/execução. Restrição de segurança: `act` **não** altera o tenant efetivo (o tenant vem do JWT); delegação não burla isolamento. Na Camada 1, `act` é apenas metadado auditável.

**D6 — Testes de integração da Camada 1.**
Novos testes em `tests/test_agents_api.py` (ou extensão de `test_api.py`): escopo negado → **403**; tenant mismatch → **404** (anti-enumeração, ADR-0015); `act` propagado; endpoint por agente responde.

### Fase B — Camada 2 (depende de infra)

**D7 — Auth real OAuth2 `client_credentials` + JWT (Keycloak).**
Dependency FastAPI `get_current_tenant` decodifica o JWT (realm único, protocol mapper `tenant_id`). `client_id` mapeado para escopos via `ESCOPOS_POR_CLIENT_ID`. Requer infra Keycloak + biblioteca de validação JWT (ex.: `python-jose`/`PyJWT` + JWKS). Não implementável isoladamente com o campo morto no estado.

**D8 — Wire dos ports reais (Camada 2 do loop, ADR-0016/0019).**
`LLMProviderPort` concreto (Sensedia AI Gateway/JWT), `ToolExecutionPort` (MCP git/test/deploy), A2A HTTP (Architecture/Review — ADR-0007). Os endpoints por agente passam a invocar os nós com os ports reais injetados via `build_graph(...)`.

**D9 — Enforcement real de escopos por `client_id`.**
A dependency `require_scope` passa a ler o `client_id` do JWT validado (não do provider mockado). `deploy:execute` só após Eval aprovado (gate); `pr:merge` exclusivo do FDE; `pii:raw` negado a todos.

### Fase C — Multi-tenancy (ADR-0015)

**D10 — Isolamento por tenant em todo endpoint que toca o board.**
`GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`, `POST /intake`: toda leitura/escrita filtra ou valida contra o tenant do JWT. Mismatch → **404** (não 403), prática anti-enumeração. `BoardView` ganha filtro por `tenant_id`.

**D11 — FDE por tenant.**
Cada instituição tem seu(s) próprio(s) FDE(s), autenticado só pro tenant dele. Atributo Keycloak `tenant_id` por usuário (string única, comparação 1:1). Console continua global (uso interno) por ora — filtro de tenant no console deferido.

## Risks / Trade-offs

- [Dependência de infra na Camada 2] → Fases separadas; Camada 1 testável hoje com provider mockado.
- [Sem defesa em profundidade (ADR-0015)] → Enforcement disciplinado em todo endpoint + testes de isolamento; documentado como consequência aceita.
- [Formato OpenAI-compatível vs envelope próprio] → Decidido: OpenAI-compatível (`messages[]`), conforme contrato; trade-off: acoplamento ao shape do OpenAI, mitigado por tradutor fino no handler.
- [Matriz em módulo vs config] → Decidido: módulo `scopes.py` (tipado, testável); trade-off: mudança de escopo exige redeploy, aceitável nesta escala.
- [`act` vs tenant] → `act` não altera tenant efetivo; delegação não burla isolamento.
