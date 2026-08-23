# Feature Intake Brief — oao-endpoints-auth-scopes

## 1. Feature name

`oao-endpoints-auth-scopes`

## 2. Business context

A oferta foi fechada como **produto vendável** (ADR-0015): instituições participantes do Open Finance Brasil contratam a squad, não só a Sensedia usa internamente. Para isso, o OAO precisa de uma **superfície de integração externa** — um gateway por agente que integradores de cliente (e o próprio runtime, nas chamadas inter-agente) consomem via HTTP com autenticação e autorização por escopo.

O contrato dessa superfície já foi definido em `Inicio/definicoes/oao-endpoints-and-scopes.md`: endpoints OpenAI-compatíveis `/oao/<agent>/chat/completions` para os 7 agentes, auth OAuth2 `client_credentials` (Keycloak), matriz de escopos transversais, delegação via `act` e tenant-scoping. Este change transforma esse contrato em um plano de implementação executável, organizado em camadas.

## 3. User / persona

- **Integrador de cliente** (instituição Open Finance): consome os agentes como serviço (Intake, Feature, Platform, Review, Architecture, SRE).
- **FDE (Forward Deployed Engineer)**: opera o console e, via `act`, delega ações aos agentes em nome do originador.
- **Runtime da squad**: chamadas inter-agente (MCP para Intake/Platform/SRE; A2A para Architecture/Review — ADR-0007).
- **Equipe de operações (SRE)**: realimenta o board como 4ª origem via port `criar_demanda`.

## 4. Problem statement

O contrato em `Inicio/definicoes/oao-endpoints-and-scopes.md` **não tem correspondência no código**:

- A única API existente (`api/main.py`) é o **console do FDE** (humana): `/tasks`, `/resume`, `/intake`, `/auditoria`. Não há endpoints por agente.
- **Auth é mockada** (ADR-0014: `localStorage "fde-auth"` no frontend; API sem verificação). Não há OAuth2, JWT, `client_id` nem escopos.
- **Não existe `tenant_id`** no `BoardState` (ADR-0015 não implementado) — o board é global.
- **Não há delegação `act`** nem enforcement de escopos.
- O protocolo MCP/A2A (ADR-0007) está desenhado, mas sem transporte real (Camada 2).

Ou seja: o contrato-alvo existe em documento, mas nada do que ele descreve está implementado ou testado.

## 5. Feature intention

Habilitar a integração externa do OAO como produto: cada agente exposto como endpoint HTTP autenticado, com autorização por escopo, delegação `act` e isolamento por tenant — de forma incremental (Camada 1 testável hoje → Camada 2 com infra real → multi-tenancy).

## 6. Expected user journey

```txt
Integrador/agente
→ obtém Bearer Token (OAuth2 client_credentials, Keycloak)
→ chama POST /oao/<agent>/chat/completions com Authorization: Bearer <token>
→ gateway valida token (JWT), extrai client_id + tenant_id + scopes
→ valida escopo do agente contra a matriz (403 se negado)
→ valida tenant contra o board (404 se mismatch, anti-enumeração)
→ delega via act (age em nome do originador/agente)
→ executa o agente (nó do grafo) e retorna resposta
```

## 7. In scope

- [ ] Endpoints `/oao/<agent>/chat/completions` para os 7 agentes (Intake, Feature-backend, Feature-frontend, Platform, Review, Architecture, SRE).
- [ ] Auth OAuth2 `client_credentials` + JWT (Keycloak realm único, protocol mapper `tenant_id`).
- [ ] Matriz de escopos transversais (declarativa) e enforcement por `client_id`.
- [ ] Delegação `act` (age em nome do originador/agente).
- [ ] Tenant-scoping (ADR-0015): `tenant_id` no `BoardState`, propagação e isolamento.
- [ ] Protocolo por modo de interação (MCP/A2A — ADR-0007) como transporte real (Camada 2).
- [ ] Testes de integração (scopes negados → 403, tenant mismatch → 404, `act` propagado).

## 8. Out of scope

- [ ] Mudanças no grafo core (nós/arestas/gates) — o grafo já existe; aqui só se expõe.
- [ ] Console do FDE (continua global, uso interno — ADR-0015).
- [ ] `pii:raw` — **negado a todos** (ADR-0006); a API só consome estado já mascarado.
- [ ] Provisionamento real de infra Keycloak/Postgres/gateway (fica como dependência da Camada 2).
- [ ] Novo QA Agent separado (qualidade é do harness).

## 9. Inputs

- Contrato: `Inicio/definicoes/oao-endpoints-and-scopes.md` (endpoints, client_ids, escopos, restrições).
- ADRs: 0004 (portas hexagonais), 0006 (PII), 0007 (protocolo), 0014 (API), 0015 (multi-tenancy), 0016/0019 (Camada 2).
- Código atual: `api/main.py`, `src/open_agentic_ops/ports/`, `src/open_agentic_ops/state.py`, `src/open_agentic_ops/graph/`.

## 10. Outputs

- `docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md` (este briefing).
- Change OpenSpec `openspec/changes/oao-endpoints-auth-scopes/` com `proposal.md`, `design.md`, `specs/oao-endpoints-auth-scopes/spec.md` e `tasks.md` (3 fases).
- Seção "Plano de implementação" em `Inicio/definicoes/oao-endpoints-and-scopes.md` apontando para os artefatos.
- (Rodadas futuras) código: módulo de scopes, endpoints por agente, auth, tenant.

## 11. Existing assets to reuse

- `Inicio/definicoes/oao-endpoints-and-scopes.md` — contrato (matriz de escopos, client_ids, restrições).
- `api/main.py` — padrão FastAPI, `create_app`, `BoardView`, `make_resume_handler`.
- `src/open_agentic_ops/ports/__init__.py` — `LLMProviderPort`, `ToolExecutionPort`, `PersistencePort`, `NotificationPort`.
- `src/open_agentic_ops/state.py` — `BoardState` (ganhará `tenant_id`).
- `src/open_agentic_ops/graph/__init__.py` — `build_graph` (nós por agente).
- `docs/adr/` — 0004, 0006, 0007, 0014, 0015, 0016, 0019.
- `tests/test_api.py`, `tests/test_graph.py` — padrões de teste de integração.

## 12. Constraints

- Stack tudo-Python (LangGraph + LangSmith + FastAPI).
- Hexagonal leve só nas bordas (ADR-0004).
- PII mascarada na fronteira de entrada (LGPD/FAPI-BR, ADR-0006); `pii:raw` negado.
- Protocolo por modo de interação (MCP vs A2A, ADR-0007).
- Gates HITL e Eval obrigatórios (nenhum merge/deploy sem humano + eval).
- Checkpointer = board (ADR-0002); `tenant_id` vive no `BoardState` (ADR-0015).
- Auth mockada hoje (ADR-0014); OIDC/Keycloak é o caminho futuro.

## 13. Acceptance criteria

- [ ] O plano documenta as 3 fases (Camada 1 harness, Camada 2 infra real, multi-tenancy) com decisões técnicas.
- [ ] O plano mapeia cada endpoint/escopo/restrição do contrato para uma task ou decisão.
- [ ] O change OpenSpec valida (`openspec validate --changes` → valid).
- [ ] O doc de endpoints referencia o plano.
- [ ] Nenhuma mudança de código nesta rodada (apenas documentos).

## 14. Risks and ambiguities

- **Dependência de infra:** auth real (Keycloak), Postgres e gateway são pré-requisitos da Camada 2 — não implementáveis isoladamente com o campo morto no estado.
- **Sem defesa em profundidade (ADR-0015):** isolamento por tenant depende de enforcement disciplinado em todo endpoint; um filtro esquecido vaza dados.
- **Formato do payload `/chat/completions`:** OpenAI-compatível vs envelope próprio — decisão técnica a fechar no design.
- **Onde vive a matriz de escopos:** módulo `scopes.py` vs config — decisão técnica a fechar no design.
- **`act` e tenant:** como o `act` interage com o tenant do JWT (delegação não deve burlar isolamento).

## 15. Recommended implementation boundaries

- Não adicionar UI.
- Não mudar o grafo core (nós/arestas/gates) — apenas expor.
- Não adicionar banco separado (checkpointer é o board).
- Não usar dados reais de cliente.
- Não criar QA Agent separado.
- Não implementar `pii:raw` em hipótese alguma.

## 16. Suggested OpenSpec change name

`oao-endpoints-auth-scopes`

## 17. Suggested safe analysis prompt

```txt
Você está trabalhando no repositório Sensedia Open Agentic Ops.

Antes de criar um novo OpenSpec change, analise a feature proposta com segurança.

Importante:
Não crie, edite, delete ou mova arquivos.
Não rode /opsx:propose.
Não implemente código.
Apenas inspecione o repositório e retorne uma análise.

Leia primeiro:
- AGENTS.md
- PROJECT.md
- HANDOFF.md
- README.md
- openspec/project.md
- openspec/specs/*
- docs/adr/*
- docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md
- Inicio/definicoes/oao-endpoints-and-scopes.md
- api/
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md

Retorne apenas:

1. Entendimento da feature proposta
2. Capacidades atuais do repositório que já suportam esta feature
3. Arquivos existentes relevantes
4. Gaps a serem endereçados
5. Riscos e ambiguidades
6. Estrutura sugerida do OpenSpec change
7. Ajustes de escopo sugeridos, se houver
8. Critérios de aceite sugeridos
9. Breakdown de tasks sugerido
10. Recomendação: se é seguro rodar /opsx:propose em seguida

Não modifique arquivos.
```

## 18. Suggested OpenSpec propose prompt

```txt
/opsx:propose oao-endpoints-auth-scopes

Use o briefing de:
docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md

Crie um novo OpenSpec change para esta feature.

Regras:
- Crie proposal.md, design.md, specs e tasks.md.
- Não implemente código.
- Não mude arquivos de origem.
- Não adicione funcionalidade fora do briefing.
- Respeite AGENTS.md, PROJECT.md e docs/adr/.
- Mantenha escopo alinhado ao feature intake.
- Organize o tasks.md em 3 fases (Camada 1, Camada 2, multi-tenancy).
- Pare após criar os artefatos OpenSpec.

Após criar o change, resuma:
1. arquivos criados;
2. escopo proposto;
3. premissas;
4. riscos;
5. questões em aberto;
6. próxima ação recomendada.
```
