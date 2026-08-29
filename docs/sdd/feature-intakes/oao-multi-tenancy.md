# Feature Intake Brief — oao-multi-tenancy

## 1. Feature name

`oao-multi-tenancy`

## 2. Business context

O OAO foi fechado como **produto vendável** (ADR-0015): instituições participantes do Open Finance Brasil contratam a squad. Com a Fase B (auth real OAuth2/Keycloak + JWT) concluída, o `tenant_id` já vive no `BoardState` e é extraído do JWT. Porém, **nenhum endpoint do console filtra por tenant** — `GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`, `POST /intake` e `GET /auditoria` operam globalmente. Isso significa que um FDE de um cliente poderia ver/operar demandas de outro cliente — inaceitável para produto vendável.

Esta rodada implementa a **Fase C (backend)** do plano: isolamento por tenant em todo endpoint que toca o board (D10), `BoardView` com filtro por `tenant_id` (C.2) e auth real no console (o console passa a exigir Bearer token JWT). O login OIDC no frontend fica para uma rodada separada.

## 3. User / persona

- **FDE (Forward Deployed Engineer)** por tenant — autentica no console e opera só as demandas do próprio tenant.
- **Instituição participante** (cliente) — garante que suas demandas não vazam para outro cliente.

## 4. Problem statement

O `tenant_id` existe no `BoardState` e é extraído do JWT, mas os endpoints do console (`/tasks`, `/resume`, `/intake`, `/auditoria`) não filtram nem validam o tenant. `POST /intake` usa `TENANT_DEFAULT` hardcoded. `BoardView` faz full scan sem filtro. Sem isolamento, um FDE de um tenant acessa demandas de outro tenant.

## 5. Feature intention

Habilitar isolamento por tenant no console do FDE:

- `BoardView` filtra por `tenant_id`.
- Todo endpoint que toca o board filtra ou valida contra o tenant do JWT; mismatch → **404** (anti-enumeração, ADR-0015).
- `POST /intake` usa o tenant do JWT (não `TENANT_DEFAULT`).
- O console passa a exigir Bearer token JWT (auth real) nos endpoints de dados.

## 6. Expected user journey

```txt
FDE (tenant X)
→ autentica (OIDC, rodada futura do frontend)
→ chama GET /tasks com Bearer token (claim tenant_id = X)
→ API filtra demandas do tenant X
→ chama GET /tasks/{id} de outro tenant → 404 (não 403)
→ POST /intake cria demanda no tenant X
```

## 7. In scope

- [x] `BoardView` com filtro por `tenant_id` (`all(tenant_id=...)`, `snapshot(thread_id, tenant_id=...)`).
- [x] Isolamento por tenant em `GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`, `POST /intake`, `GET /auditoria` (mismatch → 404).
- [x] `POST /intake` usa o tenant do JWT (não `TENANT_DEFAULT`).
- [x] Auth real no console: dependency `get_current_tenant`/`require_auth` nos endpoints de dados.
- [x] Testes de isolamento por tenant + atualizar `test_api.py` com provider mockado.

## 8. Out of scope

- [x] Login OIDC no frontend (rodada separada).
- [x] FDE por tenant no console (login por usuário) — preparar infra, deferir login.
- [x] Filtro de tenant no console web (telas) — deferido.
- [x] Eval gate real LangSmith (ADR-0018) — frente separada.
- [x] Wire do `ToolExecutionPort` MCP / A2A HTTP — frentes separadas.

## 9. Inputs

- Bearer token JWT (Keycloak) no header `Authorization` dos endpoints do console.
- `tenant_id` da claim do token (via `get_current_tenant`).

## 10. Outputs

- `BoardView` com filtro por `tenant_id`.
- Endpoints do console com isolamento por tenant (404 anti-enumeração).
- `POST /intake` com tenant do JWT.
- Auth real nos endpoints do console.
- Testes de isolamento.
- ADR-0023 (isolamento por tenant + auth no console).

## 11. Existing assets to reuse

- `src/open_agentic_ops/auth.py` — `JWTScopeProvider`, `get_current_tenant`.
- `src/open_agentic_ops/persistence/__init__.py` — `BoardView`.
- `api/main.py` — endpoints do console.
- `api/agents.py` — padrão de dependency `require_scope`.
- `tests/test_api.py` — padrão de teste do console.
- `tests/test_auth.py` — padrão de teste de auth JWT.

## 12. Constraints

- `tenant_id` via claim JWT, nunca do corpo (ADR-0015).
- Mismatch de tenant → **404** (não 403), anti-enumeração.
- Console continua global (uso interno) por ora — filtro de tenant no console deferido.
- PII mascarada na fronteira (ADR-0006).
- Checkpointer = board.
- Testes do console injetam provider mockado (HeaderScopeProvider ou JWT de teste).

## 13. Acceptance criteria

- [ ] `BoardView.all(tenant_id=...)` filtra por tenant.
- [ ] `GET /tasks` retorna só demandas do tenant do JWT.
- [ ] `GET /tasks/{thread_id}` de outro tenant → 404.
- [ ] `POST /resume` de outro tenant → 404.
- [ ] `POST /intake` cria demanda no tenant do JWT.
- [ ] `GET /auditoria` filtra por tenant.
- [ ] Endpoints do console exigem Bearer token JWT (401/403 sem token).
- [ ] `poetry run pytest` verde; `poetry run ruff check .` limpo.

## 14. Risks and ambiguities

- **Testes existentes do console** usam `create_app()` sem auth — precisam injetar provider mockado.
- **`POST /intake` com tenant do JWT** — o console (frontend) ainda não envia token; nesta rodada o backend exige, mas o frontend OIDC fica para a próxima rodada (o console pode quebrar temporariamente até o frontend ser atualizado).
- **Escopos do console** — o FDE (usuário) precisa de escopos para `/tasks`, `/resume`, `/intake`, `/auditoria`; definir a matriz de escopos do FDE.

## 15. Recommended implementation boundaries

- Não mudar o grafo core (nós/arestas/gates).
- Não implementar login OIDC no frontend (rodada separada).
- Não implementar FDE por tenant no console (deferido).
- Não expor PII raw.

## 16. Suggested OpenSpec change name

`oao-multi-tenancy`

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
- docs/sdd/feature-intakes/oao-multi-tenancy.md
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/oao-multi-tenancy.md

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
/opsx:propose oao-multi-tenancy

Use o briefing de:
docs/sdd/feature-intakes/oao-multi-tenancy.md

Crie um novo OpenSpec change para esta feature.

Regras:
- Crie proposal.md, design.md, specs e tasks.md.
- Não implemente código.
- Não mude arquivos de origem.
- Não adicione funcionalidade fora do briefing.
- Respeite AGENTS.md, PROJECT.md e docs/adr/.
- Mantenha escopo alinhado ao feature intake.
- Pare após criar os artefatos OpenSpec.

Após criar o change, resuma:
1. arquivos criados;
2. escopo proposto;
3. premissas;
4. riscos;
5. questões em aberto;
6. próxima ação recomendada.
```
