# HANDOFF — Open Agentic Ops

Estado da sessão para retomada. Gerado ao final de cada sessão (ver `AGENTS.md`). Este documento compacta o que foi feito, as decisões fechadas, os artefatos e os próximos passos.

## Estado atual

**Grafo LangGraph implementado e versionado** (change `squad-open-agentic-ops`, 24/24 tasks, arquivado em `openspec/archive/2026-08-22-squad-open-agentic-ops/`). O repo contém a fundação documental (arquitetura, ADRs, glossário, pipeline SDD/SPDD) e o **código Python funcional** da squad: scaffold Poetry, portas hexagonais, modelo de estado, persistência (checkpointer = board), redação PII, nós e gates, montagem do grafo, observabilidade e testes. **Commitado e pusheado** para `origin/main` (commit `1f2ec8d`).

**Loop goal-based do Feature Agent implementado** (change `feature-agent-loop`, ADR-0016, arquivado em `openspec/archive/2026-08-23-feature-agent-loop/`). O `feature_node` agora opera como goal-based loop: itera até test/lint passarem (goal determinístico) ou até o teto de iterações, com PII como hook determinístico sobre a saída e o contexto realimentado, e o `Guia` expondo `ferramentas` + `checklist`. Camada 1 (harness) implementada e testável com stubs; Camada 2 (integração real LLM/MCP) depende de infra. **Validado: 38 passed, ruff limpo.**

**Change `fde-console` (console do FDE):** proposta, design, spec e tasks criados (37 tasks). **Grupos 1–7 concluídos (37/37):** runtime (heurística mutável, `classificacao_intake`, BoardView), API FastAPI (`api/main.py`), console Next.js, telas, integração console↔API, skill `frontend-sensedia` e testes/validação (incluindo ADR-0014). **Redesign visual completo (dark-first + glassmorphism) concluído.** **Arquivado em `openspec/archive/2026-08-22-fde-console/` e pusheado para `origin/main`.**

**Evolução do console (sessões recentes) — concluída e validada:**
- **Login simétrico + guard na raiz:** login centralizado simetricamente, redirect pós-login para `/dashboard`; rota raiz `/` com guard client (`components/home-redirect.tsx`) → `/dashboard` ou `/login`.
- **Board → Demandas → Tasks → Registry → Tasks:** rota final **`/tasks`** (e `/tasks/[id]`), com **redirect de compatibilidade** em `app/(dashboard)/board/` (307 → `/tasks` e `/tasks/[id]`). Sidebar atualizada ("Tasks" + item "Loops"). A rota `/registry` foi renomeada para `/tasks` na refatoração de nomenclatura (frontend e backend alinhados em `tasks`/`task`).
- **Página `/loops` dedicada:** grafo React Flow full-viewport (sem modal), toolbar fixa, `components/content-container.tsx` remove o `max-w-7xl` na rota `/loops`.
- **Filtros por facet (dropdowns):** `components/filter-bar.tsx` reescrito — 3 botões de facet (Origem/Status/Domínio) com `Popover` + `Checkbox`, contador no label, acento de cor quando ativo, botão "Limpar (n)".
- **Kanban read-only:** `components/kanban-board.tsx` — **removido todo o DnD** (`@dnd-kit`), cards são `Link` → detalhe, 9 colunas do `FLUXO` com **colunas vazias auto-colapsáveis** (faixa fina ~48px com label vertical, clique expande temporariamente). Toggle Lista/Kanban persistido em `localStorage` (`fde-visao-demandas`).
- **Metadados no detalhe:** painel lateral sticky (`lg:grid-cols-[minmax(0,1fr)_280px]`) com Criado por, Owner atual, Criado em, Última atualização, Prioridade, Domínio, Origem.
- **Dashboard:** "Eventos recentes" abre expandido por padrão (`defaultOpen`); card do Loop inteiro clicável → `/loops` (removido botão "Expandir" isolado); seção renomeada "Últimas demandas".
- **Ciclo de vida ao vivo:** dot pulsante na etapa ativa (`dot-halo-executando`), barra anima (`transition-[width] duration-400 ease-out`) via polling 4s.
- **`/loops` interativo:** toggle Vertical removido (sempre horizontal); **nós arrastáveis** com persistência em `localStorage` (`fde-loop-node-positions`) + botão "Resetar layout"; arestas fixas pela ordem lógica; **CSS vars do React Flow** (`--xy-*`) sobrescritas para tema claro/dark; **drawer do agente completo** (histórico de eventos cronológico, duração + início, link para demanda). `LoopStage` estendido com `eventos`/`inicio`; `lib/loop-stages.ts` populado com eventos mock por etapa. Fix do build: `useReactFlow()` exige `ReactFlowProvider` → separado `LoopCanvasInner` (hook) do wrapper exportado `LoopCanvas` (provider).
- **Mock populado:** `lib/mock-data.ts` agora tem **23 demandas** (3 originais + 20 novas), cobrindo todos os status do `FLUXO`, origens (cliente/regulatorio/estrategia/sre), domínios (backend/frontend/ambos) e ambiguidades.

**Sessão atual (refactor + docs):** polling de demandas consolidado no hook `useDemandasPolling` (DRY, `POLL_INTERVAL` único); tela **Board → Registry → Tasks** (rota `/tasks`, redirects 307 de `/board`); decisão pendente sobre topologia real do Graph registrada em `docs/sdd/feature-intakes/graph-topologia-real.md`; bullet de marketing do login corrigido e naming interno alinhado (`TasksPage`, `ColumnTasks`). **Refatoração de nomenclatura concluída: tudo `tasks`/`task` (frontend e backend), página `/intake` removida (criação via modal no Tasks), autoria de spec movida para o detalhe da demanda.**

**Sessão atual (Feature Agent — Review estruturado):** decisões 3–7 da seção 7 implementadas como Camada 1 (harness + testes): `FeedbackReview` estruturado (`motivo` + `ambiguidade_sugerida`), `review_node` com contexto real e caminho para discordar, payload do HITL com `review_discordancia` + motivos, `origem_discordancia` na Audit, docstring do Architecture corrigido. Change OpenSpec `review-discordancia-estruturada` arquivado em `openspec/archive/2026-08-23-review-discordancia-estruturada/`. **68 passed, ruff limpo.**

**Sessão atual (Feature Agent — gatilho dinâmico do Architecture, decisão 2 da seção 7):** acionamento condicional do Architecture por demanda implementado como Camada 1 (harness + testes): heurística `_toca_contrato_externo(spec)` no `feature_node`, campo `toca_contrato_externo` no `BoardState`, aresta condicional `fan_in → {architecture | review}` no grafo, **flag global `architecture_enabled` removida**. Change OpenSpec `feature-architecture-gatilho-dinamico` arquivado em `openspec/archive/2026-08-23-feature-architecture-gatilho-dinamico/`. **71 passed, ruff limpo.**

**Validação (estado atual):** `poetry run pytest` → **71 passed**; `poetry run ruff check .` → limpo; `uvicorn api.main:app` sobe e responde `/health`, `/tasks`, `/intake`, `/resume`, `/auditoria`, `/auditoria/heuristica`, `/auditoria/ambigua`; `npm run lint` e `npm run build` no `frontend/` verdes; `npm test` (vitest) → **19/19 passed**.

## Trabalho desta sessão (Fase B — auth real OAuth2/Keycloak + JWT + LLM real)

**Tarefa:** implementar a **Fase B (Camada 2)** do plano `oao-endpoints-auth-scopes` — auth real OAuth2 `client_credentials` + JWT (Keycloak) na superfície `/oao/*` (D7), wire do `LLMProviderPort` real (Sensedia AI Gateway) (D8) e enforcement real de escopos por `client_id` do JWT (D9). Seguiu o playbook SDD/SPDD (Feature Intake Brief → safe analysis → `/opsx:propose` → Apply). **Implementado, validado e arquivado.**

### ✅ Concluído

**Feature Intake Brief** — `docs/sdd/feature-intakes/oao-auth-real.md` (template do projeto).

**Change OpenSpec `oao-auth-real`** — criado via CLI `openspec`, **validado** (`openspec validate --changes` → valid) e **arquivado** em `openspec/archive/2026-08-29-oao-auth-real/`:
- `proposal.md` — por que implementar auth real.
- `design.md` — decisões D12–D17 (Keycloak via docker-compose, JWTScopeProvider, get_current_tenant, SensediaAIGatewayProvider, wire do LLM, enforcement de escopos).
- `specs/oao-auth-real/spec.md` — 4 requirements (ADDED), sincronizada em `openspec/specs/oao-auth-real/spec.md`.
- `tasks.md` — 6 grupos, 19 tasks (todas completas).

**Infra (Keycloak):**
- `docker-compose.yml` — serviço `keycloak` (imagem `quay.io/keycloak/keycloak:26.0`, porta 8080, management 9000, `start-dev`, volume de import). **Healthcheck corrigido** para a porta de management (9000) — o `/health/ready` do Keycloak fica na 9000, não na 8080.
- `infra/keycloak/realm-export.json` — realm `oao` com clientes `oa-intake`, `oa-feature-backend`, `oa-feature-frontend`, `oa-platform`, `oa-review`, `oa-architecture`, `oa-sre` (confidential, `client_credentials`) e usuário FDE de teste com atributo `tenant_id`.
- **Keycloak validado:** realm importado, JWKS disponível, token obtido via `client_credentials`.

**Dependência JWT:** `PyJWT` + `cryptography` adicionados ao `pyproject.toml` (via `poetry add`).

**Auth real (`src/open_agentic_ops/auth.py`):**
- `JWTScopeProvider` (implementa `ScopeProvider`): valida Bearer token JWT via JWKS (`jwt.PyJWKClient`), extrai `client_id` (claim `azp`/`client_id`) e claim `tenant_id`. Sem token válido → `client_id` vazio (403/401).
- `get_current_tenant` — dependency FastAPI que retorna o `tenant_id` do JWT (formaliza o acesso para a Fase C).
- `api/main.py` — `_provider_default()` seleciona `JWTScopeProvider` (default) ou `HeaderScopeProvider` (dev/teste) via `OAO_AUTH_MODE`.

**LLM real (`src/open_agentic_ops/providers/ai_gateway.py`):**
- `SensediaAIGatewayProvider` (implementa `LLMProviderPort`): OAuth2 `client_credentials` + chat (OpenAI-compatível), com **degradação graciosa** para o fallback determinístico sem credenciais ou em falha.
- `api/main.py` — `_llm_default()` wirea o provider no `build_graph(llm=...)` quando credenciais presentes.

**Enforcement real de escopos (B.3/D9):** `require_scope` lê o `client_id` do `JWTScopeProvider` (do token, não do header mockado). `pii:raw` negado a todos por construção; `deploy:execute`/`pr:merge` permanecem como restrições de processo declaradas.

**Testes:**
- `tests/test_auth.py` — 7 testes (token válido extrai client_id/tenant, sem token, token inválido → 401, expirado → 401, endpoint com JWT → 200, escopo negado → 403, sem token → 403).
- `tests/test_agents_api.py` — atualizado para injetar `HeaderScopeProvider` explicitamente (testes da Camada 1 preservados).
- `tests/test_ai_gateway_provider.py` — 4 testes (degradação sem credenciais, token + chat, falha na chamada, falha no token).

**Validação:** `poetry run pytest` → **96 passed**; `poetry run ruff check .` → limpo; frontend `npm run lint`/`build` verdes. **Smoke test E2E real com Keycloak:** token `oa-intake` → 200 no `/oao/intake`; sem token → 403; token `oa-review` no `/oao/intake` → 403 (escopo negado); token `oa-review` no `/oao/review` → 200.

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Modificados: `docker-compose.yml`, `.env.example`, `pyproject.toml`, `poetry.lock`, `api/main.py`, `tests/test_agents_api.py`, `HANDOFF.md` (esta seção).
- Novos: `infra/keycloak/realm-export.json`, `src/open_agentic_ops/auth.py`, `src/open_agentic_ops/providers/`, `tests/test_auth.py`, `tests/test_ai_gateway_provider.py`, `docs/sdd/feature-intakes/oao-auth-real.md`, `docs/adr/0022-oauth2-jwt-auth-and-ai-gateway-provider.md`, `openspec/archive/2026-08-29-oao-auth-real/`, `openspec/specs/oao-auth-real/`.

### Próxima ação recomendada
Commitar (conventional commits coesos) e pushar. Depois, **Fase C (multi-tenancy, ADR-0015)** — isolamento por tenant em todo endpoint (404 anti-enumeração), `BoardView` filtrado, FDE por tenant. O smoke test real do AI Gateway fica condicionado ao cadastro de scopes/credenciais no gateway (feito pelo usuário).

## Trabalho desta sessão (Fase C — multi-tenancy no console do FDE)

**Tarefa:** implementar a **Fase C (backend)** do plano `oao-endpoints-auth-scopes` — isolamento por tenant no console do FDE (D10) e auth real no console. Seguiu o playbook SDD/SPDD (Feature Intake Brief → safe analysis → `/opsx:propose` → Apply). **Implementado, validado e arquivado.**

### ✅ Concluído

**Feature Intake Brief** — `docs/sdd/feature-intakes/oao-multi-tenancy.md` (template do projeto).

**Change OpenSpec `oao-multi-tenancy`** — criado via CLI `openspec`, **arquivado** em `openspec/archive/2026-08-29-oao-multi-tenancy/`:
- `proposal.md` — por que isolar por tenant (produto vendável, ADR-0015).
- `design.md` — decisões D18–D21 (BoardView filtrado, isolamento 404 anti-enumeração, auth real no console, intake com tenant do JWT).
- `specs/oao-multi-tenancy/spec.md` — 3 requirements (ADDED), sincronizada em `openspec/specs/oao-multi-tenancy/spec.md`.
- `tasks.md` — 5 grupos, 16 tasks (todas completas).

**`BoardView` com filtro por `tenant_id`** (`src/open_agentic_ops/persistence/__init__.py`):
- `all(tenant_id=None)` — filtra snapshots cujo `tenant_id` coincide; `None` mantém o comportamento global (uso interno).
- `snapshot(thread_id, tenant_id=None)` — retorna `None` se o thread não pertencer ao tenant (endpoint responde 404).
- `pending(tenant_id=None)` — delega o filtro a `all`.

**Isolamento por tenant nos endpoints do console** (`api/main.py`):
- `GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`, `POST /intake`, `GET /auditoria` — filtram/validam contra o tenant do JWT; mismatch → **404** (anti-enumeração, ADR-0015).
- `POST /intake` usa o tenant do JWT (não `TENANT_DEFAULT`).

**Auth real no console** (`src/open_agentic_ops/auth.py`):
- `JWTScopeProvider.tenant_id_autenticado(request)` — exige token válido (401 se ausente/inválido).
- `get_current_tenant` — dependency FastAPI que exige Bearer token JWT nos endpoints de dados do console; `HeaderScopeProvider` permanece como provider de dev/teste (injetável via `create_app(scope_provider=...)`).

**Infra (Keycloak):** `infra/keycloak/realm-export.json` — novo client público `oao-console` (OIDC, redirect `http://localhost:3000/*`, protocol mapper `tenant_id`).

**Testes:**
- `tests/test_multi_tenancy.py` — 6 testes (tasks filtrada por tenant, detalhe de outro tenant → 404, resume de outro tenant → 404, intake no tenant do JWT, auditoria filtrada por tenant).
- `tests/test_auth.py` — 2 novos testes (console sem token → 401, console com JWT válido → 200).
- `tests/test_api.py` e `tests/test_review_discordancia.py` — injetam `HeaderScopeProvider` no fixture (provider mockado).

**ADR-0023** — `docs/adr/0023-multi-tenancy-console-isolation.md` (isolamento por tenant no console + auth real).

**Validação:** `poetry run pytest` → **103 passed**; `poetry run ruff check .` → limpo.

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Modificados: `api/main.py`, `src/open_agentic_ops/auth.py`, `src/open_agentic_ops/persistence/__init__.py`, `infra/keycloak/realm-export.json`, `tests/test_api.py`, `tests/test_auth.py`, `tests/test_review_discordancia.py`, `README.md`, `ARCHITECTURE.md`, `HANDOFF.md` (esta seção).
- Novos: `tests/test_multi_tenancy.py`, `docs/sdd/feature-intakes/oao-multi-tenancy.md`, `docs/adr/0023-multi-tenancy-console-isolation.md`, `openspec/archive/2026-08-29-oao-multi-tenancy/`, `openspec/specs/oao-multi-tenancy/`.

### Próxima ação recomendada
Commitar (conventional commits coesos) e pushar. Depois, **FDE por tenant no console (login OIDC no frontend)** — o console passa a exigir Bearer token JWT nos endpoints de dados, mas o frontend ainda não envia token (transição documentada); o login OIDC fica para a próxima rodada. Smoke test real do AI Gateway condicionado ao cadastro de scopes/credenciais no gateway.

## Trabalho desta sessão (OIDC no console — login real no frontend)

**Tarefa:** implementar o **login OIDC real no frontend** (Auth.js/next-auth + Keycloak) para fechar o isolamento por tenant no console. O backend (Fase C) exige Bearer token JWT nos endpoints de dados, mas o frontend ainda tinha login mockado (`fde-auth=mock`) e não enviava token — toda chamada à API retornava 401 e o frontend caía em **modo demo** (dados sintéticos). Seguiu o playbook SDD/SPDD (Feature Intake Brief → safe analysis → `/opsx:propose` → Apply). **Implementado, validado e arquivado.**

### ✅ Concluído

**Diagnóstico do modo demo:** os serviços estão rodando (backend uvicorn na 8000, frontend next dev, Keycloak healthy, Postgres healthy). O modo demo é o fallback do frontend quando a API retorna 401 — o frontend chama `GET /tasks` sem Bearer token e a API (Fase C) responde 401, ativando `usandoMock=true` em `frontend/hooks/use-demandas-polling.ts`. Reiniciar serviços não resolve; é preciso o frontend autenticar.

**Feature Intake Brief** — `docs/sdd/feature-intakes/oao-console-oidc.md` (template do projeto).

**Change OpenSpec `oao-console-oidc`** — criado via CLI `openspec`, **validado** (`openspec validate --changes` → valid):
- `proposal.md` — por que implementar OIDC no console.
- `design.md` — decisões D22–D26 (Auth.js + Keycloak, expor access_token/tenant_id, guard via proxy.ts + auth(), lib/api.ts com Bearer, login com signIn).
- `specs/oao-console-oidc/spec.md` — 3 requirements (ADDED).
- `tasks.md` — 6 grupos, 18 tasks.

**Dependência instalada:** `next-auth@5.0.0-beta.32` (v5, Auth.js) no frontend (`frontend/package.json` + `package-lock.json`).

**Implementação (Apply):**
- `frontend/auth.ts` — provider Keycloak (client `oao-console`, issuer `http://localhost:8080/realms/oao`), callbacks `jwt`/`session` expondo `access_token` + `tenant_id`.
- `frontend/app/api/auth/[...nextauth]/route.ts` — handlers GET/POST.
- `frontend/.env.local` — `AUTH_SECRET`, `AUTH_KEYCLOAK_ID`, `AUTH_KEYCLOAK_ISSUER`, `AUTH_TRUST_HOST`, `NEXT_PUBLIC_API_URL` (não commitado, gitignore).
- `frontend/types/next-auth.d.ts` — augmentation de `Session`/`JWT` (em `@auth/core/types`, pois `getSession`/`useSession` tipam por esse módulo).
- `frontend/proxy.ts` (Next 16, substitui `middleware.ts`) — optimistic check via cookie de sessão; não-autenticados → `/login`.
- `app/(dashboard)/layout.tsx` — guard server-side via `auth()` + `redirect` (defesa em profundidade).
- `app/login/page.tsx` — botão `signIn("keycloak")`; removido form mockado e `localStorage fde-auth`.
- `app/page.tsx` — redirect da raiz no **servidor** via `auth()` + `redirect()` (substitui o `HomeRedirect` client, que causava hydration mismatch).
- `components/auth-provider.tsx` + `app/layout.tsx` — `SessionProvider` no root.
- `lib/api.ts` — injeta `Authorization: Bearer <access_token>` no `request()` (ponto único, cobre todas as funções de fetch).

**Testes e validação:**
- `app/login/page.test.tsx` reescrito para o fluxo OIDC (mocka `signIn`).
- `npm run lint` → limpo; `npm test` → **18 passed**; `npm run build` → verde (proxy reconhecido como "ƒ Proxy (Middleware)").
- **E2E com Keycloak:** token via password grant (`oao-console` + `fde-tenant-a`) com claims `tenant_id=tenant-a` e `azp=oao-console` → `GET /tasks` com Bearer → **200**; sem token → **401**. Confirma o fluxo OIDC completo (frontend autentica → envia Bearer → backend isola por tenant).

**Correção de hydration (pós-commit):** o `HomeRedirect` client (que usava `useSession` e fazia `router.replace` no `useEffect`) causava **hydration mismatch** na rota raiz (`/`) — o servidor renderizava `null` mas o client divergia. Corrigido movendo o redirect para o **servidor**: `app/page.tsx` agora é um server component que usa `auth()` + `redirect()` (rota `/` passou de estática para dinâmica). O `components/home-redirect.tsx` foi removido. O aviso "Encountered a script tag while rendering React component" vem do `next-themes` (script de tema) e é benigno (recoverable).

**ADR-0024** — `docs/adr/0024-console-oidc-login.md` (login OIDC no console).

**Change OpenSpec `oao-console-oidc`** — **arquivado** em `openspec/archive/2026-08-29-oao-console-oidc/` (spec sincronizada em `openspec/specs/oao-console-oidc/spec.md`).

### Estado do git
**Working tree limpo.** 3 commits na branch `main` (2 à frente de `origin/main`):
- `453982c` feat(console): login OIDC real via Keycloak (ADR-0024)
- `a0a1c27` docs: ADR-0024, change oao-console-oidc arquivado e docs atualizados
- `bc1d02a` fix(console): redirect da raiz no servidor via auth() (hydration)

`frontend/.env.local` não é commitado (gitignore).

### Próxima ação recomendada
- **Push** dos 3 commits para `origin/main` (após confirmação).
- **E2E completo do login via browser** (`http://localhost:3000`, usuário `fde-tenant-a` / `fde-password`): confirmar redirect para Keycloak, callback, sessão e dados reais por tenant (sem modo demo).
- **Smoke test real do AI Gateway** (condicionado ao cadastro de scopes/credenciais no gateway).

## Trabalho desta sessão (Intake Agent — decisão 1: fallback de ambiguidade)

**Tarefa:** maturar o próximo agente/sessão do documento de definições (`Inicio/definicoes/open-agentic-ops-definicao-oferta (3).md`) — o **Intake Agent** (seção 6). A seção 6 já tinha 4 decisões fechadas; esta sessão focou na **decisão 1 (inverter o fallback de ambiguidade)**, seguindo o playbook SDD/SPDD (Feature Intake Brief → safe analysis → `/opsx:propose` → Apply). **Implementado e arquivado.**

### ✅ Concluído

**Feature Intake Brief** — `docs/sdd/feature-intakes/intake-fallback-ambiguidade.md` (template `docs/sdd/feature-intake-template.md`):
- Contexto de negócio: fail-safe em sistema regulado (silêncio da heurística ≠ simplicidade).
- In scope: inverter fallback + justificativa vazia sinaliza "escalado por ausência de reconhecimento".
- Out of scope: decisões 2/3/4 da seção 6 (similaridade semântica pgvector, PII conta/agência/Pix, novo motivo de discordância na Audit).
- Critérios de aceite + riscos (quebra de testes, sobrecarga do FDE).

**Safe analysis** (sem modificar arquivos): código atual (`intake.py:143` retorna `"baixa", []`), 4 testes afetados, ADRs 0006/0012 revisados. Confirmou que é seguro rodar `/opsx:propose`.

**Change OpenSpec `intake-fallback-ambiguidade`** — criado via CLI `openspec` (v1.3.1), **validado** (`openspec validate` → valid) e **arquivado** em `openspec/archive/2026-08-23-intake-fallback-ambiguidade/`:
- `proposal.md` — por que inverter o fallback.
- `design.md` — decisões D1 (inverter fallback), D2 (keyword de `baixa_ambiguidade`), D3 (teste novo do fallback).
- `specs/intake-fallback-ambiguidade/spec.md` — 1 requirement (ADDED) com 3 cenários.
- `tasks.md` — 3 grupos (implementação, testes, validação).

**Implementação (Apply):** `classificar_ambiguidade` (`src/open_agentic_ops/nodes/intake.py`) ganhou precedência de 3 níveis:
1. Keyword de `alta_ambiguidade` → `alta` (justificativa preenchida).
2. Keyword de `baixa_ambiguidade` → `baixa` (justificativa preenchida) — **nova lista** em `intake.py` e `heuristica.json` (13 keywords: dashboard, botao, tela, formulario, melhoria, bug, ajuste, correcao, visual, layout, componente, ux, ui).
3. Nenhum reconhecimento → `alta` (fallback invertido, justificativa vazia) — escala ao FDE por ausência de reconhecimento.

**Evolução do design durante o Apply:** a inversão pura faria todo texto sem keyword de alta virar `alta`, eliminando o caminho de baixa. Para preservá-lo, adicionou-se a lista `baixa_ambiguidade` de keywords positivas — demandas claramente simples continuam rascunhadas pelo Intake; apenas o que a heurística não reconhece escala ao FDE. (Alternativa inicial de adicionar keyword de alta aos testes de baixa foi rejeitada por ser auto-contraditória.)

**Testes:** novo `test_fallback_ambiguidade_sem_keyword_escala_fde` em `tests/test_intake.py`; demais testes apenas reformatados (sem mudança de comportamento). **48 passed, ruff limpo.**

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Fallback de ambiguidade: `src/open_agentic_ops/nodes/intake.py`, `src/open_agentic_ops/nodes/heuristica.json`, `tests/test_intake.py`, `tests/test_graph.py`, `tests/test_api.py`, `tests/test_runtime_ext.py`, `docs/sdd/feature-intakes/intake-fallback-ambiguidade.md`, `openspec/archive/2026-08-23-intake-fallback-ambiguidade/`, `HANDOFF.md` (esta seção).
- Frontend (trabalho separado): `frontend/components/column-tasks.tsx` (badges de ambiguidade + prioridade nos cards).

### Próxima ação recomendada
Commitar em 2 commits separados (fallback de ambiguidade + frontend). Depois, as decisões 2/3/4 da seção 6 (similaridade semântica pgvector, PII conta/agência/Pix, novo motivo de discordância na Audit).

## Trabalho desta sessão (Intake Agent — decisão 3: PII financeiro)

**Tarefa:** implementar a decisão 3 da seção 6 do documento de definições — cobrir padrões de PII específicos de Open Finance (chave Pix aleatória/UUID e conta/agência bancária) no módulo `pii/__init__.py`, priorizando over-redaction. Seguiu o playbook SDD/SPDD (Feature Intake Brief → safe analysis → `/opsx:propose` → Apply). **Implementado e arquivado.**

### ✅ Concluído

**Feature Intake Brief** — `docs/sdd/feature-intakes/intake-pii-financeiro.md` (template do projeto).

**Change OpenSpec `intake-pii-financeiro`** — criado via CLI `openspec`, **validado** e **arquivado** em `openspec/archive/2026-08-23-intake-pii-financeiro/`:
- `proposal.md` — por que cobrir PII financeira agora.
- `design.md` — decisões D1 (chave Pix UUID), D2 (conta/agência permissivo com separador), D3 (testes novos).
- `specs/intake-pii-financeiro/spec.md` — 3 requirements (ADDED).
- `tasks.md` — 3 grupos (implementação, testes, validação).

**Implementação (Apply):** `src/open_agentic_ops/pii/__init__.py` ganhou 2 novos `PadraoPII`:
- `CHAVE_PIX` — regex UUID, categoria `sensivel`, substituição `[CHAVE_PIX]`. Os outros 3 formatos de Pix (CPF, CNPJ, e-mail, telefone) já eram cobertos.
- `CONTA_BANCARIA` — regex permissivo com separador (hífen/barra), categoria `sensivel`, substituição `[CONTA]`. Captura `ag 1234-5 conta 56789-0`, `agência 0123-4`, `1234-5/56789-0`; não captura "v7.0" nem "1.2.3".

**Ajuste de ordem:** `CHAVE_PIX` foi ordenado **antes** de `TELEFONE` na tupla `PADROES` — o regex de telefone capturava a parte final do UUID (`426614174000` → `[TELEFONE]`) antes do UUID completo ser mascarado. Reordenação resolveu o conflito.

**Testes:** 3 novos em `tests/test_pii.py` (redação de chave Pix, redação de conta/agência, classificação `sensivel`). **51 passed, ruff limpo.**

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- `src/open_agentic_ops/pii/__init__.py`, `tests/test_pii.py`, `docs/sdd/feature-intakes/intake-pii-financeiro.md`, `openspec/archive/2026-08-23-intake-pii-financeiro/`, `HANDOFF.md` (esta seção).

### Próxima ação recomendada
Commitar. Depois, as decisões 2 (similaridade semântica pgvector — depende de infra) e 4 (novo motivo de discordância na Audit) da seção 6.

## Trabalho desta sessão (Intake Agent — decisão 4: novo motivo de discordância na Audit)

**Tarefa:** implementar a decisão 4 da seção 6 do documento de definições — adicionar o segundo motivo de discordância "ambíguo demais para keyword" na Audit, como sinal qualitativo (contador) para evoluir a heurística para LLM. Seguiu o playbook SDD/SPDD (Feature Intake Brief → safe analysis → `/opsx:propose` → Apply). **Implementado e arquivado.**

### ✅ Concluído

**Feature Intake Brief** — `docs/sdd/feature-intakes/intake-audit-motivo-ambiguidade.md` (template do projeto).

**Change OpenSpec `intake-audit-motivo-ambiguidade`** — criado via CLI `openspec`, **validado** e **arquivado** em `openspec/archive/2026-08-23-intake-audit-motivo-ambiguidade/`:
- `proposal.md` — por que adicionar o sinal qualitativo.
- `design.md` — decisões D1 (contador em memória), D2 (novo endpoint), D3 (segundo motivo na UI).
- `specs/intake-audit-motivo-ambiguidade/spec.md` — 3 requirements (ADDED).
- `tasks.md` — 3 grupos (backend, frontend, testes/validação).

**Backend (`api/main.py`):**
- Contador em memória `_contador_ambig_nao_keyword` + model `AmbiguidadeBody`.
- `GET /auditoria/ambigua` (leitura do contador) e `POST /auditoria/ambigua` (incrementa, **não** toca a `heuristica.json`).

**Frontend:**
- `frontend/lib/api.ts`: funções `registrarAmbiguidadeKeyword` e `obterContadorAmbiguidade`.
- `frontend/app/(dashboard)/audit/page.tsx`: card de métrica "Ambíguo demais p/ keyword" (contador), botão "Ambíguo" por classificação na tabela, função `registrarAmbiguidade` com toast.
- `frontend/app/(dashboard)/audit/page.test.tsx`: mock das novas funções adicionado.

**Testes:** 2 novos em `tests/test_api.py` (incrementa contador; não altera heurística). **53 passed, ruff limpo; frontend 19 passed, lint/build verdes.**

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- `api/main.py`, `tests/test_api.py`, `frontend/lib/api.ts`, `frontend/app/(dashboard)/audit/page.tsx`, `frontend/app/(dashboard)/audit/page.test.tsx`, `docs/sdd/feature-intakes/intake-audit-motivo-ambiguidade.md`, `openspec/archive/2026-08-23-intake-audit-motivo-ambiguidade/`, `HANDOFF.md` (esta seção).

### Próxima ação recomendada
Commitar e pushar. Depois, resta a decisão 2 (similaridade semântica pgvector — depende de infra Postgres/pgvector/embeddings; só design possível até provisionar infra).

## Encerramento da sessão (docs + commits)

**Tarefa:** finalizar a sessão — atualizar todos os docs (HANDOFF, README, ARCHITECTURE, CONTRIBUTING, referências ao arquivo de definição movido) e commitar o trabalho concluído.

### ✅ Concluído

**Commits criados (aguardando push para `origin/main`):**
- `d9ef63b` — `feat(runtime)`: gates condicionais (ADR-0017) e SRE real (ADR-0019)
- `fbdf286` — `fix(console)`: modal fecha por ESC/clique-fora e decisão do FDE tipada
- `867d596` — `docs`: HANDOFF, ADR-0017 e reorganização do arquivo de definição

**Docs atualizados:**
- `HANDOFF.md` — seções de trabalho desta sessão (gates + SRE), estado atual, próximos passos (itens 1 e 2 concluídos), referência ao arquivo de definição movido.
- `README.md` — seção "Estado" com itens concluídos (loop goal-based, gates condicionais, SRE real); tabela de documentação ganhou `CONTRIBUTING.md`.
- `ARCHITECTURE.md` — diagrama do grafo atualizado (nó `deploy`, roteamento condicional HITL/Eval); tabela de componentes com `deploy_node` e descrições dos gates; seção "Retomada do FDE" com os 3 caminhos de decisão tipada.
- `CONTRIBUTING.md` — **novo**: guia de contribuição (SDD/SPDD + OpenSpec, estrutura canônica, padrões de código, validação, commits, encerramento de sessão).
- `openspec/project.md` — referências ao arquivo de definição movido para `Inicio/definicoes/`.

**Reorganização:** `Inicio/open-agentic-ops-definicao-oferta (3).md` movido para `Inicio/definicoes/` (conteúdo idêntico, git detectou como rename).

### Estado do git
Working tree com mudanças de docs não commitadas (aguardando commit). 3 commits de código/docs anteriores aguardando push para `origin/main`.

## Trabalho desta sessão (gates condicionais + decisão tipada do FDE + fix do modal)

**Tarefa:** implementar o item 1 dos próximos passos — roteamento condicional dos gates (ADR-0017) — corrigindo o bug "gates não gateiam", com a decisão do FDE tipada (naming melhor que `com_ressalvas`) e o fix do modal de nova demanda (não fechava por ESC/clique-fora).

### ✅ Concluído

**Backend (Python):**
- `src/open_agentic_ops/state/__init__.py` — `Status` ganhou `"rejeitado"` (terminal); novo tipo `DecisaoFDE = Literal["aprovado", "aprovado_com_ressalvas", "rejeitado"]`; `DecisaoHitl` reescrito de `{aprovado, comentario}` para `{decisao, observacao}` (elimina flags booleanas paralelas e o estado inconsistente).
- `src/open_agentic_ops/gates/hitl_gate.py` — lê `decisao` do payload do `interrupt()`; retorna `status: "rejeitado"` se rejeitado, senão `"aprovado"` (corrige o rótulo obsoleto `aguardando_hitl` no branch reprovado).
- `src/open_agentic_ops/gates/eval_gate.py` — branch reprovado agora seta `status: "aguardando_hitl"` (volta ao gate), em vez de `"em_revisao"`.
- `src/open_agentic_ops/graph/__init__.py` — novo nó `deploy` (factory `make_deploy_node`, chama tool `deploy` via `ToolExecutionPort`, stub); rotas `route_by_hitl_decision` e `route_by_eval_result`; arestas condicionais `hitl → {aprovado: eval, rejeitado: END}` e `eval → {aprovado: deploy, reprovado: hitl}`; `deploy → sre`; `build_graph` ganhou `eval_runner` injetável (para testes de reprovação).
- `api/main.py` — `ResumeBody` trocou `aprovado`/`comentario` por `decisao`/`observacao` (**contrato quebrado**, decisão alinhada com o usuário); `resume_endpoint` valida `decisao` no caminho HITL; `_FLUXO_STATUS` e `_AGENTE_POR_STATUS` ganharam `rejeitado` (agente "FDE").

**Frontend (Next.js):**
- `frontend/lib/mock-data.ts` — `Status`/`STATUS_LABEL` ganharam `rejeitado`; `DecisaoHitl` reescrito para `{decisao, observacao}`; 9 mocks `decisao_hitl` atualizados.
- `frontend/lib/api.ts` — `ResumePayload` com `decisao`/`observacao`.
- `frontend/components/column-tasks.tsx` e `app/(dashboard)/tasks/[threadId]/page.tsx` — `rejeitado` no `FLUXO`; painel HITL com **3 botões** (Aprovar / Aprovar com ressalvas + campo de observação / Rejeitar); badge de decisão por `decisao` (3 estados, com observação).
- `frontend/components/loop-canvas.tsx` — contrato `aprovarDemanda` atualizado.
- `frontend/components/status-badge.tsx` — estilo de `rejeitado`.

**Fix do modal de nova demanda (bug):**
- `frontend/components/resizable-dialog.tsx` — **causa raiz:** o `ResizableDialogContent` era um `div` avulso dentro do `DialogPortal`, sem usar o `DialogPrimitive.Content` do Radix; por isso o Radix não interceptava ESC nem clique-fora. Troquei o elemento base de `div` para `DialogPrimitive.Content` (mantendo o resize), conectando o dismiss ao `onOpenChange`.

**Testes:**
- `tests/test_graph.py` — novos: HITL rejeitado termina o grafo (não chega a eval); aprovado com ressalvas segue ao eval; eval reprovado volta ao HITL (via `eval_runner` injetado) e re-aprovação segue ao deploy.
- `tests/test_api.py` — atualizados para `decisao`/`observacao`; novos: rejeita demanda, aprova com ressalvas.
- `frontend/components/nova-demanda-modal.test.tsx` — novos: fecha por ESC e por clique no overlay (via `userEvent.pointer`).

**Validação:** `poetry run pytest` → **45 passed**; `poetry run ruff check .` → limpo; `npm run lint` → limpo; `npm run build` → OK; `npm test` → **19/19 passed**.

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Modificados: `src/open_agentic_ops/state/__init__.py`, `gates/hitl_gate.py`, `gates/eval_gate.py`, `graph/__init__.py`, `api/main.py`, `tests/test_graph.py`, `tests/test_api.py`, `frontend/lib/mock-data.ts`, `frontend/lib/api.ts`, `frontend/components/column-tasks.tsx`, `frontend/components/loop-canvas.tsx`, `frontend/components/status-badge.tsx`, `frontend/components/resizable-dialog.tsx`, `frontend/components/nova-demanda-modal.test.tsx`, `frontend/app/(dashboard)/tasks/[threadId]/page.tsx`, `HANDOFF.md`
- Novos: (nenhum arquivo novo nesta sessão)

## Trabalho desta sessão (SRE real — ADR-0019)

**Tarefa:** implementar o item 2 dos próximos passos — SRE real (ADR-0019): `ResultadoMonitoramento` estruturado + port `criar_demanda` wireado na API, fechando estruturalmente o loop ADR-0010.

### ✅ Concluído

**Backend (Python):**
- `src/open_agentic_ops/state/__init__.py` — novo `ResultadoMonitoramento` (`task_gerada`, `motivo`, `descricao_task`, `metricas_brutas`); `BoardState` trocou `sre_task_gerada: bool` por `resultado_monitoramento: ResultadoMonitoramento`.
- `src/open_agentic_ops/nodes/sre_node.py` — reescrito: reasoner `julgar(metricas)` produz o `ResultadoMonitoramento` estruturado com `motivo` **sempre presente** (mesmo quando não gera task, sustentando a auditoria de "não agir"); novo port `criar_demanda: Callable[[str], str] | None` que realimenta o Intake quando `task_gerada=True`. Reasoner real (múltiplos sinais + tendência) fica para quando houver observabilidade + LLM (ADR-0016 camada 2).
- `src/open_agentic_ops/graph/__init__.py` — `build_graph` ganhou `criar_demanda` e `monitorar` (injetáveis para testes), repassados ao `make_sre_node`.
- `api/main.py` — `create_app()` wirea o port `criar_demanda` (closure que gera `thread_id` e invoca o grafo com `origem="sre"`, mesmo caminho do `POST /intake`); `_detalhe` expõe `resultado_monitoramento`.

**Testes:**
- `tests/test_graph.py` — novos: SRE registra `resultado_monitoramento` estruturado no fluxo feliz (task_gerada=False, motivo presente); SRE gera task e dispara o port `criar_demanda` (via `monitorar` injetado com `slo_ok=False`). Assert do teste de rejeição atualizado (`sre_task_gerada` → `resultado_monitoramento`).

**Validação:** `poetry run pytest` → **47 passed**; `poetry run ruff check .` → limpo. Frontend não requer mudanças (usa mock; status `monitorado` já existia).

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Modificados: `src/open_agentic_ops/state/__init__.py`, `nodes/sre_node.py`, `graph/__init__.py`, `api/main.py`, `tests/test_graph.py`, `HANDOFF.md`

## Trabalho desta sessão (campos estruturados na criação de demanda)

**Tarefa:** destrinchar a criação de demanda (hoje só `origem` + `texto`) e adicionar campos que façam sentido para a triagem e o contexto de negócio. Decisões alinhadas com o usuário: escopo = **Título + origem_subtipo + prioridade**; `origem_subtipo` como **campo adicional** (fecha a pendência Q1, preserva as 4 origens); **prioridade de negócio capturada** (independente da ambiguidade técnica).

**Backend (Python):**
- `src/open_agentic_ops/state/__init__.py` — novos types `OrigemSubtipo` (pedido/incidente/norma/instrucao_normativa/nova_funcionalidade/melhoria/bug/performance) e `Prioridade` (alta/media/baixa); `BoardState` ganha `origem_subtipo`, `prioridade`, `titulo`.
- `src/open_agentic_ops/nodes/intake_node.py` — nó Intake propaga `origem_subtipo`, `prioridade` (default `media`) e `titulo` no retorno (pass-through; **não** influencia a heurística de classificação).
- `api/main.py` — `IntakeBody` ganha `origem_subtipo`, `prioridade`, `titulo` (todos opcionais); `intake_endpoint` repassa; `_resumo`/`_detalhe` expõem os três campos.

**Frontend (Next.js):**
- `frontend/lib/mock-data.ts` — types `OrigemSubtipo`/`Prioridade`; campos na interface `Demanda`; labels `ORIGEM_SUBTIPO_LABEL`, `PRIORIDADE_LABEL` e presets `ORIGEM_SUBTIPOS` por origem.
- `frontend/lib/api.ts` — `IntakePayload` com `origem_subtipo`, `prioridade`, `titulo`.
- `frontend/components/nova-demanda-modal.tsx` — **redesenhado como Dialog central largo e redimensionável** (glassmorphism): campos **Título** (obrigatório), **Origem** (segmented control com ícones, default **regulatório**), **Subtipo** (cards de progressive disclosure, default primeiro da origem), **Prioridade** (cards destacados, default **média**) e **Descrição** (textarea menor, sem barra de rolagem). **Todos os campos obrigatórios** — botão de envio desabilitado sem título e descrição. Microcopy contextual em cada campo. Substitui o modal central pequeno com comboboxes.
- `frontend/components/resizable-dialog.tsx` — novo componente `ResizableDialogContent` que permite **redimensionar o modal** arrastando o handle no canto inferior-direito (pointer events, limites min/max de largura e altura). O elemento é **centralizado** (`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`), então permanece centralizado ao redimensionar (o translate é aplicado ao próprio elemento que muda de tamanho, não ao pai).
- `frontend/components/segmented-control.tsx` — novo componente reutilizável de segmented control (rótulos + ícones, `role="radiogroup"`), usado para Origem no lugar de combobox.
- `frontend/components/column-tasks.tsx` e `frontend/app/(dashboard)/tasks/page.tsx` — card/lista exibem `titulo || spec`.
- `frontend/app/(dashboard)/tasks/[threadId]/page.tsx` — painel de metadados ganha **Título** e **Subtipo**; helper `prioridade` usa o campo capturado com fallback para a derivação por ambiguidade.

**Testes:** `tests/test_api.py` — 2 novos testes (roundtrip dos campos estruturados no intake/detalhe; defaults quando omitidos). `frontend/components/nova-demanda-modal.test.tsx` — 4 testes (renderiza os campos; origem default regulatório e troca de subtipos; envia payload com título/subtipo/prioridade; botão desabilitado sem título).

**Docs:** `CONTEXT.md` — termos `Título` e `Prioridade` adicionados ao glossário (Título marcado como obrigatório no console). `docs/adr/0020-structured-demand-creation-fields.md` — ADR novo registrando a decisão (fecha a pendência Q1), atualizado com as decisões finais (todos os campos obrigatórios no console, origem default regulatório, prioridade default média).

**Validação:** `poetry run pytest` → **40 passed**; `poetry run ruff check .` → limpo; `npm run lint` → limpo; `npm run build` → OK; `npm test` → **16/16 passed**.

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Modificados: `src/open_agentic_ops/state/__init__.py`, `nodes/intake_node.py`, `api/main.py`, `tests/test_api.py`, `frontend/lib/mock-data.ts`, `frontend/lib/api.ts`, `frontend/components/nova-demanda-modal.tsx`, `frontend/components/column-tasks.tsx`, `frontend/app/(dashboard)/tasks/page.tsx`, `frontend/app/(dashboard)/tasks/[threadId]/page.tsx`, `CONTEXT.md`, `HANDOFF.md`
- Novos: `frontend/components/nova-demanda-modal.test.tsx`, `frontend/components/segmented-control.tsx`, `frontend/components/resizable-dialog.tsx`, `docs/adr/0020-structured-demand-creation-fields.md`

## Trabalho desta sessão (encerramento)

**1. Smoke test E2E completo do console** — subiu API (porta 8000) e frontend (porta 3000) e validou ponta a ponta: `GET /tasks` (lista/detalhe/404), `POST /intake` (cria demanda + valida texto vazio → 422), `GET /auditoria`, `POST /auditoria/heuristica` (add/remove), `POST /resume` (aprova/rejeita HITL), todas as rotas do frontend (200) e redirects `/board` e `/tasks` → `/registry` (307). Tudo verde.

**2. Renomeação do recurso REST `/demandas` → `/tasks`** (boas práticas REST):
- API: `GET /demandas` → `GET /tasks`; `GET /demandas/{thread_id}` → `GET /tasks/{thread_id}` (`api/main.py`).
- Frontend: pasta `app/(dashboard)/demandas/` → `app/(dashboard)/tasks/`; cliente HTTP (`lib/api.ts`) e links de navegação atualizados; redirects de compatibilidade `/board` → `/tasks` mantidos.
- Testes (`tests/test_api.py`) atualizados.
- `/demandas` e `/board` agora retornam **404** na API (mortos); `/board` e `/demandas` no frontend são redirects 307 → `/tasks`.

**3. Commit e push do change `fde-console`** — 4 commits coesos pusheados para `origin/main`:
- `3f5eb37` — runtime (heurística mutável, classificação auditável, BoardView dinâmico)
- `673b26b` — camada de API FastAPI (`/tasks`, `/resume`, `/intake`, `/auditoria`)
- `2eb5385` — console Next.js + shadcn/ui (83 arquivos)
- `1664f07` — docs (ADR-0014, change OpenSpec, HANDOFF)

**4. Revisão e atualização de documentação** — commit `9c35708` pusheado:
- README (seção "Console do FDE", execução local, estado), ARCHITECTURE (seção do console + containers), HANDOFF, ADR-0014 (endpoints `/tasks`), `openspec/project.md` (next feature `fde-console`, out of scope, tech stack), artefatos do change `fde-console` (proposal/design/spec/tasks refletem `/tasks`).

**5. Serviços no ar ao final da sessão:** API FastAPI em `http://127.0.0.1:8000` e console Next.js em `http://localhost:3000` (ambos com o código atualizado).

## Trabalho desta sessão (refactor + docs)

**1. Extração do hook compartilhado de polling** — commit `fc92915` (`refactor(console)`):
- Novo `frontend/hooks/use-demandas-polling.ts` com `useDemandasPolling()` retornando `{ demandas, usandoMock, carregando }` e exportando `POLL_INTERVAL = 4000` (definição única).
- Removeu a lógica duplicada (fetch + fallback `demandasMock` + `simularTick`) de `dashboard`, `graph` e `tasks` (~150 linhas eliminadas).
- `tasks/[threadId]` (polling de demanda única) reutiliza `POLL_INTERVAL` importado do hook.

**2. Decisão pendente sobre topologia do Graph** — commit `fbeb664` (`docs`):
- Criado `docs/sdd/feature-intakes/graph-topologia-real.md` registrando o gap entre o `/graph` linear e a arquitetura real (fan-out/fan-in dos worktrees + aresta SRE→Intake, ADR-0010) como decisão pendente, não bug.
- Nota adicionada em "Próximos passos" (item 4).

**3. Rename Board → Registry** — commit `a7ad887` (`refactor(console)`):
- Rota `/tasks` → `/registry` (página, `[threadId]`, testes) via `git mv`.
- `/tasks` e `/board` viram stubs de redirect 307 → `/registry` e `/registry/[id]`.
- Sidebar (`/registry`, label "Registry"), links internos, título da página e nota de desambiguação no `CONTEXT.md` atualizados.

**4. Docs refletindo `/registry`** — commit `eb1a093` (`docs`):
- `README.md` e `ARCHITECTURE.md` atualizados (tela Registry `/registry`, rotas legadas `/loops`, `/auditoria`, `/tasks`, `/board` → 307). Endpoints da API (`GET /tasks`) mantidos intactos.

**5. Fix do login + naming interno** — commit `9ff0c83` (`fix(console)`):
- Bullet de marketing do login: "Board unificado de demandas" → "Registry unificado de demandas" (texto visível ao usuário).
- Naming interno: `BoardPage` → `RegistryPage`; `ColumnBoard` → `ColumnRegistry` (arquivo `column-registry.tsx`); teste atualizado.

**Validação:** `npm run lint` limpo; `npm run build` OK (rotas `/registry` reais, `/tasks`/`/board` como redirects); `npm test` → **15/15 passed**. Working tree limpo, tudo commitado e pusheado para `origin/main`.

## Trabalho desta sessão (loop goal-based do Feature Agent)

**Tarefa:** implementar o harness do loop goal-based do Feature Agent (ADR-0016), seguindo o playbook SDD.

### ✅ Concluído

**Playbook SDD:**
- `docs/sdd/feature-intakes/feature-agent-loop.md` — Feature Intake Brief criado.
- Change OpenSpec `feature-agent-loop` criado e validado (`proposal.md`, `design.md`, `specs/feature-agent-loop/spec.md`, `tasks.md`), **arquivado** em `openspec/archive/2026-08-23-feature-agent-loop/` (padrão do projeto, não `openspec/changes/archive/`). Spec principal criada em `openspec/specs/feature-agent-loop/spec.md`.

**Implementação (Camada 1 — harness):**
- `src/open_agentic_ops/nodes/guia.py` — `Guia` estendido com `ferramentas` e `checklist` por domínio (backend/frontend/fullstack).
- `src/open_agentic_ops/state/__init__.py` — `Worktree` ganhou `iteracoes` e `historico` (resultado de test/lint por tentativa).
- `src/open_agentic_ops/nodes/feature_node.py` — reescrito como **goal-based loop**: itera até test/lint passarem (goal determinístico) ou até `max_iteracoes` (default 3); PII como hook determinístico (`redigir_texto`) sobre a saída e o contexto realimentado; `tools` e `max_iteracoes` como parâmetros; fallbacks determinísticos mantidos.
- `src/open_agentic_ops/graph/__init__.py` — `build_graph` repassa `tools` aos dois feature nodes.

**Bug corrigido durante a implementação:** o campo `pii_encontrada_no_loop` adicionado ao `BoardState` causava `InvalidUpdateError` (escrito por 2 nós em paralelo no fan-out, sem reducer Annotated). Removido do retorno e do estado — a informação já vive no `historico` do worktree (campo `Annotated` com append).

**Testes:** `tests/test_feature_loop.py` — 8 testes do harness (goal na 1ª tentativa, goal após correções, teto respeitado, PII na saída, PII no contexto realimentado, Guia com ferramentas/checklist, worktree com metadados, fallback sem providers).

**Validação:** `poetry run pytest` → **38 passed**; `poetry run ruff check .` → limpo.

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Modificados: `src/open_agentic_ops/graph/__init__.py`, `nodes/feature_node.py`, `nodes/guia.py`, `state/__init__.py`
- Novos: `docs/sdd/feature-intakes/feature-agent-loop.md`, `openspec/archive/2026-08-23-feature-agent-loop/`, `openspec/specs/`, `tests/test_feature_loop.py`

## Trabalho desta sessão (fixes do console + HITL)

**Tarefa:** validar o console no navegador e corrigir problemas de UX/fluxo encontrados no teste manual.

### ✅ Concluído

**Backend:**
- **CORS na API** (`api/main.py`): o frontend (localhost:3000) fazia requisições cross-origin para a API (127.0.0.1:8000) e o preflight `OPTIONS` retornava 405. Adicionado `CORSMiddleware` permitindo as origens locais do console.
- **Nó `marcar_hitl`** (`graph/__init__.py`): o `hitl_gate` pausa via `interrupt()` antes de setar o status, então durante a pausa o status permanecia `em_revisao` (do `_fan_in`) — o painel HITL do frontend (que usa `status === "aguardando_hitl"`) não aparecia. Adicionado nó de transição que seta `aguardando_hitl` antes do gate, no mesmo padrão de `_escala_fde` → `_autoria_spec`. Aresta: `review → marcar_hitl → hitl`.

**Frontend:**
- **Status `aguardando_autoria`**: adicionado ao tipo `Status`, `STATUS_LABEL`, `StatusBadge` e ao `FLUXO` do detalhe. Demanda de alta ambiguidade parada na autoria de spec não fica mais "presa" em 0%.
- **Indicador de modo demo** no Registry: banner âmbar quando a API está indisponível (dados sintéticos).
- **Botão "Nova demanda" removido** do Registry (criação fica só no Intake). *Nota: revertido na sessão seguinte — o botão voltou no Tasks via `NovaDemandaModal` e a página `/intake` foi removida (ver seção "Refatoração de nomenclatura + UX do console").*
- **Fix "not found" no detalhe**: estado de carregamento (skeletons) antes de `notFound()`, para demandas criadas (não presentes no mock).
- **Textos HITL esclarecidos**: painel HITL e Intake agora comunicam que o gate revisa o **resultado** da implementação (worktrees/ADRs/feedbacks), não a criação da demanda.

**Validação:** `poetry run pytest` → **38 passed**; `poetry run ruff check .` → limpo; `npm run lint` → limpo; `npm run build` → OK; `npm test` → **15/15 passed**.

### Estado do git
Commits coesos criados nesta sessão:
- `b86cf74` — `feat(runtime)`: loop goal-based do Feature Agent (ADR-0016)
- `79addd7` — `fix(api)`: habilitar CORS para o console do FDE
- `6e13bfe` — `fix(console)`: representar aguardando_autoria, modo demo e corrigir detalhe

## Trabalho desta sessão (refatoração de nomenclatura + UX do console)

**Tarefa:** validar o console no navegador, corrigir problemas de UX/fluxo e unificar a nomenclatura frontend/backend em `tasks`/`task`.

### ✅ Concluído

**Backend:**
- **`_resumo` enriquecido** (`api/main.py`): `GET /tasks` agora retorna `spec` (texto completo), `criado_em` (timestamp do `classificacao_intake`), `progresso` (posição do status no fluxo), `agente_atual` (mapeado por status) e `erros` (worktrees com status `falhou`). Alinha a API com os campos ricos que o mock já exibia (barra de completude do ciclo de vida, agente em tempo real).

**Frontend — nomenclatura `/registry` → `/tasks`:**
- Páginas movidas de `app/(dashboard)/registry/` → `app/(dashboard)/tasks/` (lista + detalhe + testes).
- Componente `ColumnRegistry` → `ColumnTasks`; `RegistryPage` → `TasksPage`.
- Links atualizados: dashboard, sidebar, board (redirects), login.
- Sidebar: "Registry" → "Tasks"; item "Intake" removido.
- Rotas antigas `/registry` e `/intake` agora retornam **404**; `/board` → 307 → `/tasks`.

**Frontend — página `/intake` removida:**
- Novo componente `NovaDemandaModal` (`components/nova-demanda-modal.tsx`): Dialog shadcn com formulário origem + texto, chama `POST /intake`.
- Botão "Nova demanda" no Tasks abre o modal.
- **Autoria de spec** (alta ambiguidade) movida do Intake para o **detalhe da demanda** (painel quando status = `aguardando_autoria`).

**Validação:** `poetry run pytest` → **38 passed**; `poetry run ruff check .` → limpo; `npm run lint` → limpo; `npm run build` → OK (rotas `/tasks`); `npm test` → **12/12 passed** (3 testes do intake removidos junto com a página).

### Estado do git
Commits coesos criados nesta sessão (aguardando push):
- `f1c6004` — `fix(console)`: exibir spec e ordenar registry por criacao
- `dd0acc6` — `feat(api)`: enriquecer lista de demandas com progresso, agente e erros
- `c3d6900` — `refactor(console)`: unificar nomenclatura tasks e remover pagina intake

## Decisões fechadas

### Maturação (Rodada 0)
1. **Graph Engineering** = eixo inter-agente (topologia da squad); Loop Engineering = intra-agente. "Squad = grafo de loops."
2. **PII** ancorado em classificação LGPD (dado pessoal vs. sensível), informado pelo FAPI-BR.
3. **Stack:** tudo Python + LangGraph + LangSmith.
4. **Arquitetura:** hexagonal leve só nas bordas (LLMProviderPort, ToolExecutionPort/MCP, PersistencePort/checkpointer, NotificationPort/HITL).

### Arquitetura do grafo (Rodadas 1–2)
- **Q1:** LangGraph = orquestrador/board único (grafo supervisor).
- **Q2:** checkpointer = board (sem board separado).
- **Q3:** Intake/Platform/SRE = nós do grafo que delegam via MCP.
- **Q4:** Review/Architecture = nós do grafo que chamam A2A via HTTP.
- **Q5:** 1 nó genérico "Feature Agent" parametrizado por Guia.
- **Q6:** git via ToolExecutionPort/MCP.
- **Q7:** HITL = `interrupt()` nativo + Redis/SSE só para notificar o FDE; `POST /resume` como ponte.
- **Q8:** LangSmith (tracing agêntico) + OTel (infra/métricas).
- **Q9/Q10:** mascaramento na fronteira (Intake) + sanitização de telemetria; PII em todas as fronteiras.
- **Q11:** citar wiki da Área do Desenvolvedor do Open Finance Brasil (vigente) + GitHub specs-seguranca (histórico, em arquivamento).

### Grilling de revisão (G1–G8)
- **G1:** MCPs `postgres`/`redis` desabilitados até a infra existir; `github` habilitado.
- **G2:** MCP `sensedia-ai-gateway` desabilitado no projeto (global quebrado).
- **G3:** contagem canônica = **6 agentes** + 2 gates.
- **G4:** spec do FDE re-entra via `POST /resume` + escrita em `openspec/`.
- **G5:** SRE realimenta o board passando pelo Intake (4ª origem, mesmo funil).
- **G6:** Guia = skill (SKILL.md) carregada pelo nó Feature Agent.
- **G7:** PII = skill (`pii-sanitizer`) como guia + módulo de redação determinístico.
- **G8:** Eval gate = portar `run_all_evals.sh` + integrar LangSmith.

### Adoção do playbook de desenvolvimento agêntico
- **P1:** Portar o Feature Start Playbook (SDD/SPDD + OpenSpec + OpenCode) do `solutions-business-case-agent` (bitbucket) como base de desenvolvimento.
- **P2:** Migrar `openspec/` para o layout canônico (`specs/<feature>/spec.md`, `archive/`, `project.md`, `config.yaml`) — reconhecido pelo CLI `openspec` v1.3.1.
- **P3:** ADRs permanecem em `docs/adr/` (convenção Nygard) — **não** migrar para `openspec/architecture/adr/`.
- **P4:** Change atual `squad-open-agentic-ops` tratado como **legado** (migrado sem intake retroativo); playbook completo aplica-se a features futuras.
- **P5:** Gestor de dependências = **Poetry**.
- **P6:** Checkpointer inicial = **SqliteSaver/InMemorySaver** (dev), migrando para PostgresSaver em prod.

### Console do FDE (grilling — change `fde-console`)
- **F1:** Escopo = console do FDE (painel de operação da squad), não o produto Open Finance entregue.
- **F2:** Objetivo = design/spec → protótipo → skill (em etapas).
- **F3:** Stack = Next.js (App Router) + React + TS + shadcn/ui (new-york) + Radix + Tailwind v4 + next-themes.
- **F4:** Integração = via FastAPI adicionada ao runtime (`api/`).
- **F5:** Funcionalidade MVP = Board + HITL + Intake manual + Auditoria.
- **F6:** Brand book = design tokens + componentes **e** skill de frontend.
- **F7:** Tema = dark/light toggle.
- **F8:** Auditoria = registrar classificação + justificativa **e** correção prospectiva da heurística via API (RNF-6).
- **F9:** Registro = novo campo `classificacao_intake` no `BoardState`.
- **F10:** Localização = mesmo repo: `frontend/` + `api/` na raiz.
- **F11:** Auth = mockada no MVP, tela de login desenhada, OIDC como caminho futuro.
- **F12:** Tokens = paleta completa do brand book como CSS variables; tipografia Montserrat + Roboto Mono; corners ≤7pt. **→ REVISADO no redesign:** corners aumentados para `0.9375rem` (15px) + glassmorphism + dark-first (quebra o brand book; decisão registrada no ADR-0014 e na skill `frontend-sensedia`).

### Redesign do console
- **R1:** Direção visual = **dark-first + glassmorphism** (inspiração Vercel/Monday), preservando identidade Sensedia (roxo/laranja).
- **R2:** **Radius aumentado** para `0.9375rem` (15px) — quebra deliberada do brand book ≤7pt, registrada como ADR.
- **R3:** **Sidebar lateral** (desktop) + Sheet (mobile) substitui o header/nav superior.
- **R4:** Todas as telas + design system redesenhados (Login, Board, Detalhe, Intake, Auditoria).
- **R5:** Toasts via `sonner` (richColors, bottom-right); `TooltipProvider` no root layout.
- **R6:** Redesign é **visual/UX** — lógica de dados (API, mock, estados) permanece intacta.

### Evolução do console (sessões recentes)
- **E1:** **Board → Demandas → Tasks → Registry** — rota `/registry` (redirects de compatibilidade de `/board`, `/demandas` e `/tasks`), sidebar e títulos renomeados.
- **E2:** **`/loops` página dedicada** full-viewport (sem modal), toolbar fixa, grafo ocupa o restante da viewport.
- **E3:** **Filtros por facet** — 3 dropdowns (Origem/Status/Domínio) com popover+checkbox, nunca pills expostas.
- **E4:** **Kanban read-only** — sem DnD (FDE intervém só via gate HITL); cards clicáveis → detalhe; colunas vazias auto-colapsáveis; toggle Lista/Kanban em `localStorage`.
- **E5:** **Metadados no detalhe** — painel lateral sticky (Criado por, Owner, Criado em, Atualizado em, Prioridade, Domínio, Origem).
- **E6:** **Dashboard** — eventos expandidos por padrão, card do Loop clicável → `/loops`, seção "Últimas demandas".
- **E7:** **`/loops` interativo** — nós arrastáveis (persistência localStorage + reset), sempre horizontal, controles com tema do design system, drawer do agente com histórico completo + live update (polling 4s).
- **E8:** **Mock populado** — 23 demandas cobrindo todos os status/origens/domínios/ambiguidades.
- **E9:** **Nomenclatura alinhada ao CONTEXT.md** — Loop→Graph (`/loops`→`/graph`), Auditoria→Audit (`/auditoria`→`/audit`), Kanban→Colunas (`kanban-board.tsx`→`column-board.tsx`, toggle "Lista/Colunas"); redirects 307 de compatibilidade; jornada do FDE completada (autoria de spec no Intake via `POST /resume`, HITL gate no Graph, Audit como calibração).
- **E10:** **Unificação de nomenclatura em `tasks`/`task`** — `/registry` → `/tasks` (frontend e backend alinhados); página `/intake` removida, criação de demanda via `NovaDemandaModal` no Tasks (chama `POST /intake`); autoria de spec movida para o detalhe da demanda (status `aguardando_autoria`); `/registry` e `/intake` retornam 404, `/board` → 307 → `/tasks`.

### Rodada de definição da oferta (grilling — 30 decisões, Q1–Q30)

Revisão do documento `Inicio/definicoes/open-agentic-ops-definicao-oferta (3).md` via grilling (7 rodadas, ordem do documento: Origens → Intake → Feature → Eval/Deploy → HITL → SRE → Board). Todas as decisões `[DECISÃO PENDENTE]` e tensões descobertas ao cruzar com o código foram resolvidas. **Nenhum código alterado — apenas registro em docs.**

- **Origens (§5):** `origem_subtipo` como campo genérico (Q1); vínculo demanda↔cliente = `tenant_id` (Q2, deferido p/ §11); canais de Cliente adiados p/ Fase 2 com PII uniforme (Q3); detecção regulatória = spike pendente (Q4); Audit do SRE deferida (Q5).
- **Intake (§6):** fallback→alta **acoplado** à similaridade semântica por precedente (Q6/Q7 — não isolado, senão quebra o caso de baixa mais comum); PII chave Pix + conta/agência com regex conservador agora (Q8); novo motivo de discordância na Audit deferido (Q9).
- **Feature (§7):** loop goal-based em duas camadas — harness agora + integração real depois (Q10); loop mínimo (test/lint) primeiro (Q11); PII como hook determinístico agora (Q12); Architecture dinâmico deferido (Q13); Review estrutural agora + contexto real deferido (Q14).
- **Eval/Deploy (§8):** roteamento condicional + nó deploy stub agora (Q15); risco de loop de re-aprovação aceito (Q16); Eval real deferido, esqueleto das duas camadas agora (Q17); tudo volta ao `hitl` (Q18).
- **HITL (§9):** `Status` ganha `rejeitado` + `pending()` inclui `aguardando_autoria` agora (Q19); `com_ressalvas` no estado/API agora, botão depois (Q20); `impacta_classificacao` marcado pelo FDE, deferido (Q21); ADR-0005 atualizado (Q22).
- **SRE (§10):** `ResultadoMonitoramento` estruturado agora (Q23); port `criar_demanda` agora (Q24); auditoria estendida deferida (Q25); limitação de cobertura registrada (Q26).
- **Board (§11):** multi-tenancy como frente paralela, ADR primeiro (Q27); escopo do ADR (Q28); filtro de tenant no console deferido (Q29); `tenant_id` não implementado isolado (Q30).

**Artefatos criados nesta rodada:** ADRs 0015–0019, ADR-0005 atualizado, ADR-0013 marcado como superseded, `CONTEXT.md` (termo `origem_subtipo`), `openspec/project.md` (próxima feature + decisões registradas).

## Artefatos criados

| Artefato | Conteúdo |
|---|---|
| `opencode.json` | Config do opencode (permissões, MCPs) |
| `AGENTS.md` | Regras do projeto (squad, gates, SDD/SPDD, PII, handoff) |
| `README.md` | Porta de entrada |
| `CONTEXT.md` | Glossário (board, origem, ambiguidade, Guia, worktree, gate, FDE, PII, grafo, loop, resume, redação PII) |
| `ARCHITECTURE.md` | Visão estrutural C4 (contexto, containers, componentes do grafo, board, retomada do FDE) |
| `docs/adr/` | 20 ADRs (template Nygard) — 0015–0019 da rodada de definição da oferta, 0020 da criação de demanda |
| `Inicio/HANDOFF-squad-agentica.md` | Handoff original trazido e atualizado com as decisões |
| `openspec/changes/squad-open-agentic-ops/` | Pipeline SDD/SPDD completo (arquivado) |
| `openspec/changes/fde-console/` | Change do console do FDE (37/37 tasks, aguardando archive) |
| `openspec/project.md` | Contexto do projeto (OpenSpec) |
| `openspec/config.yaml` | Config do OpenSpec (schema spec-driven) |
| `PROJECT.md` | Contexto do projeto (raiz) |
| `docs/sdd/feature-start-playbook.md` | Playbook de início de feature (portado/adaptado) |
| `docs/sdd/feature-intake-template.md` | Template de Feature Intake Brief (portado/adaptado) |
| `docs/sdd/feature-intakes/graph-topologia-real.md` | Intake registrando a decisão pendente sobre a topologia real do Graph (fan-out/fan-in + SRE→Intake) |
| `docs/sdd/feature-intakes/feature-agent-loop.md` | Intake do loop goal-based do Feature Agent (ADR-0016) |
| `openspec/archive/2026-08-23-feature-agent-loop/` | Change do loop goal-based do Feature Agent (arquivado) |
| `openspec/specs/feature-agent-loop/spec.md` | Spec principal do loop goal-based (6 requisitos) |
| `tests/test_feature_loop.py` | Testes do harness do loop goal-based (8 testes) |
| `.opencode/commands/opsx-*.md` | Comandos `/opsx:*` (explore, propose, apply, archive) |
| `.opencode/skills/openspec-*/` | Skills OpenSpec (explore, propose, apply-change, archive-change) |
| `src/open_agentic_ops/` | Código Python da squad (ports, state, persistence, pii, nodes, gates, graph, observability) |
| `api/main.py` | Camada FastAPI do console do FDE: tasks, detalhe, resume (HITL), intake, auditoria, heurística |
| `tests/` | Testes Python (PII, Intake, integração, API) |
| `frontend/` | Console Next.js 16 + TS + Tailwind v4 + next-themes + shadcn/ui (radix-nova) |
| `frontend/app/globals.css` | Design tokens Sensedia (dark-first + glassmorphism) + **CSS vars do React Flow** (`--xy-*`) para tema claro/dark |
| `frontend/app/layout.tsx` | Root layout com Montserrat + Roboto Mono + ThemeProvider + Toaster (sonner) + TooltipProvider + `defaultTheme="dark"` |
| `frontend/app/page.tsx` | Rota raiz — renderiza guard `HomeRedirect` |
| `frontend/components/home-redirect.tsx` | Guard client: logado → `/dashboard`, senão → `/login` |
| `frontend/app/login/page.tsx` | Login split-screen simétrico, redirect → `/dashboard` |
| `frontend/app/(dashboard)/layout.tsx` | Layout do dashboard (sidebar + topbar) usando `ContentContainer` |
| `frontend/components/content-container.tsx` | Container que remove `max-w-7xl` na rota `/graph` (full-viewport) |
| `frontend/components/app-sidebar.tsx` | Sidebar com Dashboard/Tasks/Graph/Audit |
| `frontend/app/(dashboard)/tasks/page.tsx` | Tela de Tasks (ex-Registry/Board): KPIs, filtros por facet, toggle Lista/Colunas, cards, botão "Nova demanda" (modal) |
| `frontend/app/(dashboard)/tasks/[threadId]/page.tsx` | Detalhe da demanda: ciclo de vida ao vivo, tabs, painel HITL, **painel de autoria de spec** (status `aguardando_autoria`), metadados sticky |
| `frontend/components/nova-demanda-modal.tsx` | Dialog central redimensionável de criação de demanda (Título, Origem, Subtipo, Prioridade, Descrição) → `POST /intake` |
| `frontend/components/segmented-control.tsx` | Segmented control reutilizável (rótulos + ícones) para Origem |
| `frontend/components/resizable-dialog.tsx` | `ResizableDialogContent` — modal redimensionável via handle de arraste (canto inferior-direito) |
| `frontend/app/(dashboard)/board/page.tsx` + `[threadId]/page.tsx` | **Redirects de compatibilidade** (307 → `/tasks`) |
| `frontend/app/(dashboard)/graph/page.tsx` | Página `/graph` full-viewport com `LoopCanvas` |
| `frontend/app/(dashboard)/loops/page.tsx` | **Redirect de compatibilidade** (307 → `/graph`) |
| `frontend/app/(dashboard)/auditoria/page.tsx` | **Redirect de compatibilidade** (307 → `/audit`) |
| `frontend/components/filter-bar.tsx` | Filtros por facet (3 dropdowns popover+checkbox) |
| `frontend/components/column-tasks.tsx` | Colunas read-only (ex-Kanban/Registry), 9 colunas auto-colapsáveis, cards clicáveis |
| `frontend/components/loop-canvas.tsx` | Grafo React Flow interativo (nós arrastáveis, reset, drawer do agente, HITL gate) |
| `frontend/components/loop-status.tsx` | Card do Loop clicável → `/graph`; define `LoopStage` (com `eventos`/`inicio`) |
| `frontend/lib/loop-stages.ts` | `montarStages` (extraído) com eventos mock por etapa |
| `frontend/lib/mock-data.ts` | **23 demandas** mock (3 originais + 20 novas) |
| `frontend/lib/api.ts` | Cliente HTTP do frontend para a API FastAPI |
| `frontend/hooks/use-demandas-polling.ts` | Hook compartilhado de polling de demandas (`useDemandasPolling`, `POLL_INTERVAL` único) |
| `frontend/components/ui/` | Componentes base shadcn (inclui popover, checkbox, sheet, dialog, progress, etc.) |
| `.opencode/skills/frontend-sensedia/SKILL.md` | Skill de frontend (Guia): brand book Sensedia + padrão shadcn/ui |
| `docs/adr/0014-api-layer-and-fde-console.md` | ADR da camada de API + console (radius, dark-first, glassmorphism) |
| `docs/adr/0015-multi-tenancy-and-client-isolation.md` | ADR multi-tenancy e isolamento por cliente (tenant_id, Keycloak, FDE por tenant) |
| `docs/adr/0016-goal-based-feature-agent-loop.md` | ADR loop goal-based do Feature Agent (Loop Engineering) |
| `docs/adr/0017-conditional-gate-routing-and-deploy-node.md` | ADR roteamento condicional dos gates + nó de deploy |
| `docs/adr/0018-eval-gate-two-layer-langsmith.md` | ADR Eval gate em duas camadas LangSmith (supera 0013) |
| `docs/adr/0019-sre-agent-resultado-monitoramento-and-create-demand-port.md` | ADR SRE real (ResultadoMonitoramento + port criar_demanda) |
| `docs/adr/0020-structured-demand-creation-fields.md` | ADR campos estruturados na criação de demanda (titulo, origem_subtipo, prioridade) — fecha a pendência Q1 |
| `docs/sdd/feature-intakes/feature-architecture-gatilho-dinamico.md` | Intake do gatilho dinâmico do Architecture (decisão 2 da seção 7) |
| `openspec/archive/2026-08-23-feature-architecture-gatilho-dinamico/` | Change do gatilho dinâmico do Architecture (arquivado) |
| `openspec/specs/feature-architecture-gatilho-dinamico/spec.md` | Spec principal do gatilho dinâmico do Architecture (2 requisitos) |

## Skills instaladas (em `~/.agents/skills/`)

- **LangGraph:** `langgraph-persistence`, `langgraph-human-in-the-loop`, `langgraph-python-quickstart`, `ecosystem-primer`
- **PII:** `pii-sanitizer`, `pii-redaction-logging-policy-builder`
- **Open Finance:** `pluggy-open-finance`

## MCPs configurados (no `opencode.json`)

| MCP | Estado | Requer |
|---|---|---|
| `github` | habilitado | `GITHUB_PERSONAL_ACCESS_TOKEN` |
| `postgres` | desabilitado (aguarda infra) | `DATABASE_URL` |
| `redis` | desabilitado (aguarda infra) | `REDIS_URL` |
| `sensedia-ai-gateway` | desabilitado (global quebrado) | — |

## Trabalho em execução (sessão atual — CONCLUÍDO)

**Tarefa:** "Fix: Alinhar nomenclatura ao CONTEXT.md, corrigir Loop vs Grafo, Board vs Kanban, validar jornada do FDE em Intake/Auditoria, unificar visual."

### ✅ Concluído nesta sessão

**Backend (Python) — completo e verde:**
- **Grafo pausa na autoria de spec** (`src/open_agentic_ops/graph/__init__.py`): novo nó `autoria_spec` com `interrupt()` (ADR-0009); `_escala_fde` seta `status: aguardando_autoria`; aresta `escala_fde → autoria_spec → fan_out`.
- **Novo status** `aguardando_autoria` em `src/open_agentic_ops/state/__init__.py`.
- **API** (`api/main.py`): `POST /resume` aceita `spec` opcional e distingue HITL (`aprovado`) vs autoria (`spec`), com validação de cada caso.
- **Testes** (`tests/test_graph.py`, `tests/test_api.py`): ajustados + novos testes de autoria.
- **Validação:** `poetry run pytest` → **30 passed**; `poetry run ruff check .` → limpo.

**Frontend (Next.js) — completo e verde:**
- **Rotas movidas** (git mv): `loops/` → `graph/`, `auditoria/` → `audit/`; redirects de compatibilidade criados (`/loops`→`/graph`, `/auditoria`→`/audit`).
- **Sidebar** (`components/app-sidebar.tsx`): Dashboard, Registry (`/registry`), Graph (`/graph`), Intake, Audit (`/audit`).
- **Loop→Graph na hierarquia**: `loop-status.tsx` ("Squad Graph", "Ver graph completo"), `dashboard/page.tsx` (`/graph`), detalhe da demanda ("Execution loop"), `content-container.tsx` (fullWidth `/graph`).
- **Kanban removido da UI**: `kanban-board.tsx` → `column-registry.tsx` (`ColumnRegistry`/`ColumnCard`); `registry/page.tsx` toggle "Lista/Colunas" com ícone `Columns3`.
- **HITL gate no Graph**: `loop-canvas.tsx` — drawer do nó `hitl` mostra Aprovar/Rejeitar (via `aprovarDemanda`); nó `eval` mostra resultado; `LoopStage` estendido com `thread_id`/`resultado_eval`; `lib/loop-stages.ts` popula esses campos.
- **Intake autoria de spec**: `intake/page.tsx` — seção "Autoria de spec (alta ambiguidade)" listando itens aguardando spec do FDE, com textarea + botão "Liberar para o grafo" chamando `autorarSpec` (POST /resume). `lib/api.ts` estendido (`ResumePayload.spec` + `autorarSpec`).
- **Auditoria como calibração**: `audit/page.tsx` reescrito — métricas "% que o FDE manteria" / concordâncias / discordâncias (localStorage), tabela com botões "Manteria"/"Discordo", mantendo correção prospectiva da heurística (RNF-6).

**Testes frontend — resolvidos e ampliados:**
- **Bloqueio do teste de autoria do Intake resolvido** (`intake/page.test.tsx`): a causa raiz era o estado inicial `demandasMock` (com **2 itens** de alta ambiguidade + `spec_autor: "fde"`) renderizando 2 textareas antes do `useEffect` trocar para o mock da API (`[DEMANDA_ALTA]` = 1). Fix: o teste agora usa `waitFor` para aguardar o efeito resolver e conferir exatamente 1 textarea. Também tipado `DEMANDA_ALTA` como `Demanda` (corrige erro TS no build).
- **`audit/page.test.tsx`** — já atualizado para o novo layout de calibração ("Manteria"/"Discordo"); passa.
- **`registry/page.test.tsx`** — adicionado teste do toggle "Colunas" (clica no botão e verifica que o `ColumnRegistry` renderiza a coluna "Triado").
- **Lint limpo**: removido prop `demandas` não utilizado de `loop-canvas.tsx` (e do caller `graph/page.tsx` + import órfão `type { Demanda }`).

**Validação final:** `poetry run pytest` → **30 passed**; `poetry run ruff check .` → limpo; `npm run lint` → limpo; `npm run build` → OK; `npm test` → **15/15 passed**.

**Docs atualizados:** `README.md` e `ARCHITECTURE.md` (telas Graph `/graph` e Audit `/audit`, redirects legados `/loops`→`/graph` e `/auditoria`→`/audit`).

### Estado do git
Working tree **limpo**. Tudo commitado e pusheado para `origin/main` em 3 commits coesos:
- `4191eb1` — `feat(runtime)`: pausar grafo na autoria de spec e distinguir HITL de autoria no resume
- `c953d56` — `refactor(console)`: alinhar nomenclatura ao CONTEXT.md e completar jornada do FDE
- `45aa19b` — `docs`: arquivar change fde-console e atualizar rotas `/graph` e `/audit`

## Trabalho desta sessão (Intake Agent — decisão 2: similaridade semântica pgvector)

**Tarefa:** Implementar a decisão 2 da seção 6 (substituir a keyword literal "sem precedente" por busca por similaridade semântica via pgvector), com stack toda opensource (embeddings via Sentence-Transformers local; LLM via AI Gateway só para texto).

### ✅ Concluído nesta sessão

**SDD/SPDD:**
- **Feature Intake Brief** criado em `docs/sdd/feature-intakes/intake-similaridade-semantica.md`.
- **Safe analysis** realizada (somente leitura): mapeou `intake_node` como função pura sem DI, ausência de camada de conexão Postgres reutilizável, campo `domino` (typo), multi-tenancy fora de escopo.
- **Change OpenSpec** `intake-similaridade-semantica` criado em `openspec/changes/intake-similaridade-semantica/` com `proposal.md`, `design.md`, `specs/intake-similaridade-semantica/spec.md`, `tasks.md`. `openspec validate` → **válido**; status 4/4 artefatos completos.

**Infra opensource:**
- **`docker-compose.yml`** criado (Postgres + `pgvector/pgvector:pg16`, volume persistente, healthcheck). Postgres **validado** (`docker compose up -d` → healthy).
- **`.env.example`** atualizado com `DATABASE_URL`, `SIMILARIDADE_THRESHOLD=0.75`, `SIMILARIDADE_N=5`.

**Dependências:**
- `pyproject.toml` + `poetry.lock` atualizados com `sentence-transformers`, `pgvector`, `psycopg[binary]`. `poetry install` concluído (torch, transformers, sentence-transformers, pgvector, psycopg instalados).

**Implementação (backend):**
- **`src/open_agentic_ops/embeddings/__init__.py`** — lazy-load do SentenceTransformer (`paraphrase-multilingual-MiniLM-L12-v2`) + `gerar_embedding(texto)`.
- **`src/open_agentic_ops/similaridade/__init__.py`** — conector pgvector (psycopg), migração SQL (extensão `vector` + tabela `precedentes`), `buscar_precedentes`, `registrar_precedente`, `inicializar_schema`, degradação graciosa. Query corrigida para `status_terminal = ANY(%s)`.
- **`src/open_agentic_ops/nodes/intake_node.py`** — transformado em factory `make_intake_node(buscar_precedentes=...)`; busca precedentes, reforça baixa/fallback de alta, referencia `thread_id` na justificativa; `route_by_ambiguity` preservada.
- **`src/open_agentic_ops/nodes/sre_node.py`** — `make_sre_node` aceita `registrar_precedente` e registra precedente quando a demanda atinge `monitorado`.
- **`src/open_agentic_ops/state/__init__.py`** — adicionado campo `thread_id` ao `BoardState`.
- **`src/open_agentic_ops/graph/__init__.py`** — `build_graph` aceita `buscar_precedentes`/`registrar_precedente`; usa `make_intake_node`.
- **`api/main.py`** — wirea `buscar_precedentes`/`registrar_precedente` no `build_graph`; injeta `thread_id` no estado inicial do `POST /intake` e `criar_demanda`.

**Testes:**
- Novos: `tests/test_embeddings.py` (mock do modelo), `tests/test_similaridade.py` (mock do conector), testes de integração no intake (mock da busca de precedentes) em `tests/test_intake.py`.
- Atualizados: `test_intake.py` e `test_runtime_ext.py` usam `make_intake_node()`.
- **Validação:** `poetry run pytest` → **61 passed**; `poetry run ruff check .` → limpo; frontend `npm run lint` → limpo, `npm test` → **19 passed**, `npm run build` → OK.
- **Infra validada:** `inicializar_schema()` + `registrar_precedente` + `buscar_precedentes` testados contra o Postgres real (precedente similar retorna `thread-test` score 1.0; texto diferente retorna vazio).

### ✅ Finalizado (encerramento da sessão)

- **ADR-0021** — `docs/adr/0021-use-pgvector-for-semantic-precedent-search.md` revisado e confirmado (Accepted).
- **Extra `langgraph-checkpoint-postgres`** — resolvido: `langgraph-checkpoint-postgres@^2.0.25` (compatível com LangGraph 0.2.x) adicionado ao extra `postgres` no `pyproject.toml` + `poetry.lock`; `poetry install --extras postgres` concluído; `import langgraph.checkpoint.postgres` OK.
- **Arquivado** — change movido para `openspec/archive/2026-08-23-intake-similaridade-semantica/` (padrão correto). 26/26 tasks completas.
- **"Próximos passos"** — decisão 2 marcada como concluída (ver abaixo).
- **Commit** — conventional commit (`feat(intake): ...`). Push somente após confirmação do usuário (regra AGENTS.md).

### Estado do git
Working tree **com mudanças não commitadas** (decisão 2 implementada, ainda não arquivada/commitada):
- Modificados: `.env.example`, `api/main.py`, `poetry.lock`, `pyproject.toml`, `src/open_agentic_ops/graph/__init__.py`, `src/open_agentic_ops/nodes/intake_node.py`, `src/open_agentic_ops/nodes/sre_node.py`, `src/open_agentic_ops/state/__init__.py`, `tests/test_intake.py`, `tests/test_runtime_ext.py`.
- Novos (untracked): `docker-compose.yml`, `docs/adr/0021-use-pgvector-for-semantic-precedent-search.md`, `docs/sdd/feature-intakes/intake-similaridade-semantica.md`, `openspec/changes/`, `src/open_agentic_ops/embeddings/`, `src/open_agentic_ops/similaridade/`, `tests/test_embeddings.py`, `tests/test_similaridade.py`.
- Branch: `main`; último commit `e50f350`.

## Trabalho desta sessão (Feature Agent — decisões 3–7: Review estruturado + discordância na Audit)

**Tarefa:** implementar as decisões 3–7 da seção 7 do documento de definições (Review Agent), como Camada 1 (harness + testes), seguindo o playbook SDD/SPDD. **Implementado, validado e arquivado.**

### ✅ Concluído

**Feature Intake Brief** — `docs/sdd/feature-intakes/review-discordancia-estruturada.md` (template do projeto).

**Change OpenSpec `review-discordancia-estruturada`** — criado via CLI `openspec`, **validado** (`openspec validate --changes` → valid) e **arquivado** em `openspec/archive/2026-08-23-review-discordancia-estruturada/`:
- `proposal.md` — por que estruturar a discordância do Review.
- `design.md` — decisões D1–D5 (FeedbackReview estruturado, contexto real, payload HITL, origem_discordancia, docstring Architecture).
- `specs/review-discordancia/spec.md` — 5 requirements (ADDED), sincronizada em `openspec/specs/review-discordancia/spec.md`.
- `tasks.md` — 7 grupos, 18 tasks (todas completas).

**Implementação (Apply):**
- `state/__init__.py` — `FeedbackReview` ganhou `motivo: str | None` e `ambiguidade_sugerida: Ambiguidade | None`; novo tipo `OrigemDiscordancia = Literal["review", "fde_auditoria", "fde_hitl"]`; `BoardState` ganhou `origem_discordancia`.
- `review_node.py` — reescrito: `_revisar(contexto)` recebe branch + diff + spec + checklist; fallback determinístico detecta PII em claro no resultado (via `detectar_pii`) quando o checklist exige "sem PII" e produz discordância estruturada (`motivo` + `ambiguidade_sugerida`); `make_review_node` aceita `revisar` injetável; registra `origem_discordancia: "review"` quando discorda.
- `hitl_gate.py` — payload do `interrupt()` ganha `review_discordancia: True` + `review_motivos` quando há discordância no lote.
- `architecture_node.py` — docstring corrigido (removida a promessa de "pausa e escala ao FDE"; papel puramente consultivo).
- `graph/__init__.py` — `build_graph` aceita `revisar` injetável (DI para testes).
- `api/main.py` — `create_app` aceita `revisar` injetável; `_detalhe` expõe `origem_discordancia`; `/auditoria` expõe `origem_discordancia` + `discordancias_review` quando há discordância.

**Testes:** `tests/test_review_discordancia.py` — 7 testes (review discorda com motivo/ambiguidade, review concorda sem motivo, callable injetado, payload HITL com/sem discordância, origem_discordancia na Audit, docstring Architecture). **68 passed, ruff limpo.**

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Modificados: `api/main.py`, `src/open_agentic_ops/gates/hitl_gate.py`, `src/open_agentic_ops/graph/__init__.py`, `src/open_agentic_ops/nodes/architecture_node.py`, `src/open_agentic_ops/nodes/review_node.py`, `src/open_agentic_ops/state/__init__.py`, `HANDOFF.md` (esta seção).
- Novos: `docs/sdd/feature-intakes/review-discordancia-estruturada.md`, `openspec/archive/2026-08-23-review-discordancia-estruturada/`, `openspec/specs/review-discordancia/`, `tests/test_review_discordancia.py`.

### Próxima ação recomendada
Commitar (conventional commits coesos) e pushar, incluindo o commit pendente `dc41b7d` (similaridade pgvector). Depois, resta a decisão 2 da seção 7 (Architecture Agent como subagent no loop do Feature Agent) e o item 7 dos próximos passos (multi-tenancy, ADR-0015).

## Trabalho desta sessão (Feature Agent — decisão 2 da seção 7: gatilho dinâmico do Architecture)

**Tarefa:** implementar a decisão 2 da seção 7 do documento de definições — acionamento condicional do Architecture Agent por demanda (o Feature Agent decide se a spec toca contrato externo), como Camada 1 (harness + testes), seguindo o playbook SDD/SPDD. **Implementado, validado e arquivado.**

### ✅ Concluído

**Feature Intake Brief** — `docs/sdd/feature-intakes/feature-architecture-gatilho-dinamico.md` (template do projeto).

**Safe analysis** (sem modificar arquivos): verificou todos os call sites do `build_graph` (API + testes) — nenhum passa `architecture_enabled=False`, então a remoção da flag é segura; confirmou que o caso-âncora (spec regulatória com "portabilidade"/"Manual de Escopo"/"Instrução Normativa") é coberto pelas keywords da heurística.

**Change OpenSpec `feature-architecture-gatilho-dinamico`** — criado via CLI `openspec`, **validado** (`openspec validate` → valid) e **arquivado** em `openspec/archive/2026-08-23-feature-architecture-gatilho-dinamico/`:
- `proposal.md` — por que acionar o Architecture por demanda.
- `design.md` — decisões D1 (heurística determinística), D2 (campo `toca_contrato_externo`), D3 (aresta condicional).
- `specs/feature-architecture-gatilho-dinamico/spec.md` — 2 requirements (ADDED), sincronizada em `openspec/specs/feature-architecture-gatilho-dinamico/spec.md`.
- `tasks.md` — 3 grupos, 10 tasks (todas completas).

**Implementação (Apply):**
- `feature_node.py` — heurística `_toca_contrato_externo(spec)` + constante `_CONTRATO_EXTERNO_KEYWORDS` (`contrato externo`, `fapi-br`, `endpoint externo`, `schema`, `manual de apis`, `manual de escopo`, `portabilidade`, `instrucao normativa`, `oauth`, `token`); `feature_node` retorna `toca_contrato_externo: bool` no estado (domínio backend/ambos).
- `state/__init__.py` — campo `toca_contrato_externo: bool` no `BoardState`.
- `graph/__init__.py` — função `route_by_architecture` + aresta condicional `fan_in → {architecture | review}`; **flag global `architecture_enabled` removida** do `build_graph`.

**Testes:** 3 novos em `tests/test_graph.py` (Architecture acionado quando spec toca contrato externo; não acionado em spec rotineira; frontend não toca contrato). Caso-âncora validado (Architecture ainda acionado na spec regulatória). **71 passed, ruff limpo.**

**Nota de implementação:** a spec de teste de contrato externo precisou ser de **baixa ambiguidade** (ex.: "Adicionar endpoint externo de consulta de saldo no dashboard.") — specs com "fapi-br"/"contrato externo" disparam alta ambiguidade no Intake e pausam na autoria de spec, impedindo o teste do acionamento condicional sem passar pelo FDE.

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Modificados: `src/open_agentic_ops/nodes/feature_node.py`, `src/open_agentic_ops/state/__init__.py`, `src/open_agentic_ops/graph/__init__.py`, `tests/test_graph.py`, `HANDOFF.md` (esta seção).
- Novos: `docs/sdd/feature-intakes/feature-architecture-gatilho-dinamico.md`, `openspec/archive/2026-08-23-feature-architecture-gatilho-dinamico/`, `openspec/specs/feature-architecture-gatilho-dinamico/`.

### Próxima ação recomendada
Committar (conventional commit coeso). Depois, continuar o fechamento do fluxo fim-a-fim (Camada 1): **Change 2** (wirear notifier do HITL), **Change 3** (topologia real do Graph no console — fan-out/fan-in + SRE→Intake), **Change 4** (cobertura de testes do fluxo por origem: `estrategia` com subtipo e `sre` via `criar_demanda`). Multi-tenancy (ADR-0015) permanece adiado.

## Trabalho desta sessão (Change 2 — wirear notifier do HITL)

**Tarefa:** fechar o fluxo fim-a-fim (Camada 1) — wirear um `notifier` concreto no `make_resume_handler` (hoje `None`), de modo que `NotificationPort.notify` passe a ser chamado no `POST /resume`. Seguiu o playbook SDD/SPDD (Feature Intake Brief → safe analysis → `/opsx:propose` → Apply). **Implementado, validado e arquivado.**

### ✅ Concluído

**Feature Intake Brief** — `docs/sdd/feature-intakes/hitl-notifier-wire.md` (template do projeto).

**Change OpenSpec `hitl-notifier-wire`** — criado via CLI `openspec`, **validado** (`openspec validate --changes` → valid) e **arquivado** em `openspec/archive/2026-08-23-hitl-notifier-wire/`:
- `proposal.md` — por que wirear o canal de notificação do HITL.
- `design.md` — decisões D1 (notifier = log estruturado, Camada 1), D2 (sanitização via `sanitize_for_telemetry`), D3 (teste via injeção de notifier no `create_app`).
- `specs/hitl-notifier/spec.md` — 1 requirement (ADDED) com 2 cenários, sincronizada em `openspec/specs/hitl-notifier/spec.md`.
- `tasks.md` — 3 grupos, 7 tasks (todas completas).

**Implementação (Apply):**
- `api/main.py` — `create_app` ganhou parâmetro `notifier` injetável (default = `_notifier_log`, log estruturado via `logging.getLogger("open_agentic_ops.hitl")`); `make_resume_handler(notifier=notifier or _notifier_log)` wireado; `_notifier_log` sanitiza o payload com `sanitize_for_telemetry` antes de logar (sem PII raw, ADR-0006).

**Testes:** 2 novos em `tests/test_api.py` — `POST /resume` (caminho HITL) dispara o notifier injetado com `{status: "resumed", decision: {...}}`; `_notifier_log` mascara PII na `observacao` (ex.: `[CPF]`). **73 passed, ruff limpo.**

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Modificados: `api/main.py`, `tests/test_api.py`, `HANDOFF.md` (esta seção).
- Novos: `docs/sdd/feature-intakes/hitl-notifier-wire.md`, `openspec/archive/2026-08-23-hitl-notifier-wire/`, `openspec/specs/hitl-notifier/`.

### Próxima ação recomendada
Commitar (conventional commit coeso). Depois, **Change 3** (topologia real do Graph no console — fan-out/fan-in + SRE→Intake, fecha a decisão pendente de `docs/sdd/feature-intakes/graph-topologia-real.md`) e **Change 4** (cobertura de testes do fluxo por origem). Multi-tenancy (ADR-0015) permanece adiado.

## Trabalho desta sessão (Change 3 — topologia real do Graph no console)

**Tarefa:** fechar o fluxo fim-a-fim (Camada 1) — representar no `/graph` a topologia real do grafo: fan-out/fan-in dos worktrees backend/frontend em paralelo e a aresta de fechamento SRE→Intake (ADR-0010). Implementa a decisão pendente registrada em `docs/sdd/feature-intakes/graph-topologia-real.md` (item 13 dos próximos passos). Seguiu o playbook SDD/SPDD (Feature Intake Brief → safe analysis → `/opsx:propose` → Apply). **Implementado, validado e arquivado.**

### ✅ Concluído

**Feature Intake Brief** — `docs/sdd/feature-intakes/graph-topologia-real.md` (atualizado de registro de decisão pendente para briefing de implementação).

**Change OpenSpec `graph-topologia-real`** — criado via CLI `openspec`, **validado** (`openspec validate --changes` → valid) e **arquivado** em `openspec/archive/2026-08-23-graph-topologia-real/`:
- `proposal.md` — por que representar a topologia real no `/graph`.
- `design.md` — decisões D1 (dividir `feature` em backend/frontend), D2 (codificar topologia no canvas por ids), D3 (posições com paralelismo + aresta de fechamento com curva).
- `specs/graph-topologia-real/spec.md` — 3 requirements (ADDED), sincronizada em `openspec/specs/graph-topologia-real/spec.md`.
- `tasks.md` — 2 grupos, 6 tasks (todas completas).

**Implementação (Apply):**
- `frontend/lib/loop-stages.ts` — stage `feature` dividido em `feature_backend` e `feature_frontend` (worktrees paralelos, com labels/agentes/eventos próprios).
- `frontend/components/loop-canvas.tsx` — `posicaoPadrao` mapeia por id com backend/frontend em paralelo (y distinto); nova constante `TOPOLOGIA` com fan-out (`intake → feature_backend`, `intake → feature_frontend`), fan-in (`feature_backend → review`, `feature_frontend → review`), linear (`review → hitl → eval → deploy → monitor`) e ciclo (`monitor → intake`, ADR-0010); aresta de fechamento com `smoothstep`, tracejada e label "SRE → Intake".

**Validação:** `npm run lint` limpo; `npm run build` OK; `npm test` → **19/19 passed**; smoke test `/graph` e `/dashboard` → 200.

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Modificados: `docs/sdd/feature-intakes/graph-topologia-real.md`, `frontend/components/loop-canvas.tsx`, `frontend/lib/loop-stages.ts`, `HANDOFF.md` (esta seção).
- Novos: `openspec/archive/2026-08-23-graph-topologia-real/`, `openspec/specs/graph-topologia-real/`.

### Próxima ação recomendada
Commitar (conventional commit coeso). Depois, **Change 4** (cobertura de testes do fluxo por origem: `estrategia` com subtipo e `sre` via `criar_demanda`). Multi-tenancy (ADR-0015) permanece adiado.

## Trabalho desta sessão (Change 4 — cobertura de testes do fluxo por origem)

**Tarefa:** fechar o fluxo fim-a-fim (Camada 1) com cobertura de testes de integração por origem no `tests/test_graph.py`: `estrategia` (com subtipo `nova_funcionalidade`/`melhoria`) e `sre` (via port `criar_demanda` → nova execução `origem=sre`), percorrendo o ciclo completo até `monitorado`. **Implementado, validado e commitado (`3102eb8`).**

### ✅ Concluído

Somente `tests/test_graph.py` (nenhuma mudança de produção):

- **Helper `_levar_ate_monitorado(app, thread_id, spec, *, origem, origem_subtipo)`** — generaliza o driver do fluxo feliz até `monitorado`, lidando com os dois caminhos de ambiguidade: alta escala ao FDE (autoria da spec via resume); baixa segue direto ao fan_out. Em ambos, o HITL é aprovado e o fluxo percorre Eval → deploy → SRE.
- **`test_fluxo_estrategia_nova_funcionalidade_ate_monitorado`** — `origem=estrategia`, `origem_subtipo=nova_funcionalidade` ("Lançar onboarding digital..."). Alta ambiguidade → autoria FDE → HITL → `monitorado`. Asserts: `origem`, `origem_subtipo`, `ambiguidade=="alta"`, `spec_autor=="fde"`, `status=="monitorado"`.
- **`test_fluxo_estrategia_melhoria_ate_monitorado`** — `origem=estrategia`, `origem_subtipo=melhoria` ("Melhorar o tempo de resposta do dashboard..."). Baixa ambiguidade (keyword `dashboard`) → intake rascunha → HITL → `monitorado`. Asserts: `ambiguidade=="baixa"`, `spec_autor=="intake"`, `status=="monitorado"`.
- **`test_fluxo_sre_via_criar_demanda_ate_monitorado`** — port `criar_demanda` que **realmente invoca o grafo compilado** com `origem="sre"` (espelhando `api/main.py`), retornando o novo `thread_id`; `monitorar` força `task_gerada=True`. Dirige a thread original até o SRE, recupera a thread gerada via checkpointer e a leva até `monitorado`. Asserts: `task_gerada is True`, `origem=="sre"`, `ambiguidade=="alta"`, `spec_autor=="fde"`, `status=="monitorado"`.

### Validação
`poetry run pytest -q` → **76 passed** (73 + 3 novos); `poetry run ruff check .` → limpo.

### Estado do git
Commitado: `3102eb8` — `test(graph): cobertura do fluxo por origem ate monitorado (Change 4)` (1 arquivo, +121 linhas). Untracked `Inicio/definicoes/oao-endpoints-and-scopes.md` deixado de fora (não relacionado).

### Próxima ação recomendada
Atualizar este HANDOFF (item 14 marcado como CONCLUÍDO). Depois, **Multi-tenancy (ADR-0015)** permanece como próximo passo principal; Camada 2 (integração real LLM/MCP) depende de infra.

## Trabalho desta sessão (plano de endpoints/auth/scopes — `oao-endpoints-auth-scopes`)

**Tarefa:** transformar o contrato de integração externa (`Inicio/definicoes/oao-endpoints-and-scopes.md`) em um **plano de implementação executável** — endpoints por agente, auth OAuth2/Keycloak, matriz de escopos, delegação `act` e tenant-scoping (ADR-0015) — organizado em 3 fases, com decisões técnicas detalhadas. **Apenas documentos (sem código).**

### ✅ Concluído

**Feature Intake Brief** — `docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md` (template do projeto): business context (produto vendável, ADR-0015), personas, problem statement (contrato sem correspondência no código), in/out of scope, acceptance criteria, riscos.

**Change OpenSpec `oao-endpoints-auth-scopes`** — `openspec/changes/oao-endpoints-auth-scopes/`, **validado** (`openspec validate --changes` → valid):
- `proposal.md` — por que e o que muda (rodada de documentação/planejamento).
- `design.md` — **decisões técnicas D1–D11** em 3 fases:
  - **Fase A (Camada 1, testável hoje):** `tenant_id` no `BoardState` (D1), tenant via claim JWT nunca do corpo (D2), matriz declarativa em `scopes.py` (D3), endpoints `/oao/<agent>/chat/completions` OpenAI-compatível com `require_scope` mockado (D4), `act` como metadado sem burlar tenant (D5), testes 403/404 (D6).
  - **Fase B (Camada 2, infra):** auth OAuth2/Keycloak + `get_current_tenant` (D7), wire dos ports reais LLM/MCP/A2A (D8), enforcement real de escopos (D9).
  - **Fase C (multi-tenancy):** isolamento por tenant com 404 anti-enumeração (D10), FDE por tenant (D11).
- `specs/oao-endpoints-auth-scopes/spec.md` — 3 requirements com cenários.
- `tasks.md` — Fase 0 (docs, concluída) + Fases A/B/C de implementação.

**Doc de endpoints** — `Inicio/definicoes/oao-endpoints-and-scopes.md` ganhou seção "4. Plano de implementação" com tabela de fases e links para os artefatos.

### Validação
`openspec validate --changes` → valid. Nenhuma mudança de código.

### Estado do git
Untracked (aguardando commit): `Inicio/definicoes/oao-endpoints-and-scopes.md`, `docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md`, `openspec/changes/oao-endpoints-auth-scopes/`.

### Próxima ação recomendada
Commitar os docs do plano. Depois, **implementar a Fase A (Camada 1)** do plano — `tenant_id` no `BoardState`, `scopes.py`, endpoints por agente com validação em memória, `act`, testes 403/404. Multi-tenancy (ADR-0015) e Camada 2 dependem de infra.

## Trabalho desta sessão (Fase A — Camada 1 do `oao-endpoints-auth-scopes`)

**Tarefa:** implementar a **Fase A (Camada 1, harness)** do plano de integração externa — a superfície `/oao/<agent>/chat/completions` testável hoje, sem infra. Cobriu as decisões D1–D6 do `design.md`. O grafo core **não mudou** — apenas se expôs. **Implementado, testado e arquivado.**

### ✅ Concluído

**A.1 — `tenant_id` no `BoardState` (D1):** campo `tenant_id: str` adicionado em `src/open_agentic_ops/state/__init__.py`. Roundtrip automático via `channel_values`; `thread_id` continua `uuid4()` puro (sem namespace, ADR-0015).

**A.2 — `scopes.py` (D3):** novo `src/open_agentic_ops/scopes.py` com a matriz declarativa `ESCOPOS_POR_CLIENT_ID` (7 client_ids do contrato), `ESCOPOS_NEGADOS` (`pii:raw` negado a todos por construção), `TENANT_DEFAULT="default"` e helpers `escopos_do_client`/`tem_escopo`.

**A.3/A.4/A.5 — `api/agents.py` (D4/D5):** novo router com endpoints `POST /oao/<agent>/chat/completions` para os 7 agentes (Intake, Feature-backend, Feature-frontend, Platform, Review, Architecture, SRE), payload OpenAI-compatível (`messages[]`). Cada endpoint traduz a mensagem para um `BoardState` mínimo e invoca a factory do nó correspondente de forma **isolada** (harness puro). Dependency `require_scope(scope)` valida o `client_id` do `ScopeProvider` contra a matriz (403 se negado). Delegação `act` como metadado de contexto auditável — **não** altera o tenant efetivo.

**A.4/A.6 — Wire no `api/main.py` (D2):** `create_app` ganhou parâmetro `scope_provider` (default `HeaderScopeProvider`, que lê `X-OAO-Client-Id`/`X-OAO-Tenant-Id` de headers) registrado em `app.state.scope_provider`; router `agents_router` incluído. `POST /intake` do console usa `TENANT_DEFAULT` (console global, ADR-0015). Port `criar_demanda` do SRE agora recebe `(texto, tenant_id)` e propaga o tenant da execução corrente (exceção D2) — assinatura do port atualizada em `sre_node.py` e `graph/__init__.py`.

**A.7 — `tests/test_agents_api.py` (D6):** 9 testes — endpoint por agente responde (200), escopo negado → 403, client_id desconhecido → 403, sem client_id → 403, `pii:raw` negado a todos, `act` propagado, `tenant_id` propagado ao estado, `act` não altera tenant efetivo.

### Validação
`poetry run pytest` → **85 passed** (76 anteriores + 9 novos); `poetry run ruff check .` → limpo; app sobe com os 7 endpoints `/oao/*` registrados; `openspec validate` → valid (antes de arquivar).

### Estado do git
Commitado em `a86464e` (`feat(api): superficie de integracao externa por agente (Fase A, Camada 1)`), 13 arquivos (520+/19-), incluindo o rename do change para o archive. Working tree limpo. Branch `main` à frente de `origin/main` (push pendente).

### Próxima ação recomendada
Push (após confirmação). Depois, **Fase B (Camada 2)** — auth real OAuth2/Keycloak + `get_current_tenant` (D7), wire dos ports reais LLM/MCP/A2A (D8), enforcement real de escopos (D9) — e **Fase C (multi-tenancy, ADR-0015)** — isolamento por tenant com 404 anti-enumeração (D10), FDE por tenant (D11). Ambas dependem de infra (Keycloak, Postgres, gateway).

## Trabalho desta sessão (expor o tenant_id no console do FDE)

**Tarefa:** fechar o gap de visibilidade do multi-tenancy no console — o `tenant_id` estava na sessão Auth.js (auth.ts) e tipado, mas não era exibido em lugar nenhum, então o FDE não sabia em qual tenant operava. **Implementado e validado.**

### ✅ Concluído

- **Diagnóstico:** o backend **já isola por tenant corretamente** via JWT (claim `tenant_id` do Keycloak → `get_current_tenant` em `api/main.py`). O gap era de **visibilidade/UX**, não de segurança.
- **`components/tenant-badge.tsx`** (novo) — badge reutilizável `TenantBadge` (recebe `tenantId` como prop; renderiza `null` se ausente). Funciona em server e client.
- **Header do dashboard** (`app/(dashboard)/layout.tsx`) — badge ao lado de "Console · Operação da squad", usando `session.tenant_id` (server component já tinha a sessão).
- **Footer da sidebar** (`components/app-sidebar.tsx`) — badge sob "Forward Deployed Engineer", via `useSession()` do `next-auth/react` (client component).
- **Teste** `components/tenant-badge.test.tsx` (novo) — exibe o tenant quando presente; não renderiza quando ausente.

### Validação
`npm run lint` limpo; `npm test` → **20 passed** (19 + 1 novo); `npm run build` verde.

### Estado do git
Working tree com mudanças não commitadas (aguardando commit):
- Novos: `frontend/components/tenant-badge.tsx`, `frontend/components/tenant-badge.test.tsx`.
- Modificados: `frontend/app/(dashboard)/layout.tsx`, `frontend/components/app-sidebar.tsx`, `HANDOFF.md` (esta seção).

### Próxima ação recomendada
Commitar (conventional commits coesos). Depois, seguir as pendências do item 8 (substituir fallbacks determinísticos por implementações reais) e item 9 (provisionar infra do checkpointer Postgres/Redis e habilitar os MCPs).

## Trabalho desta sessão (LLM real em todos os agentes + AI-GATEWAY-PROMPTS.md)

**Tarefa:** wirear LLM real (Sensedia AI Gateway) em todos os agentes, com um par de credenciais por agente, e criar na raiz um documento de prompt enrichment para o usuário configurar o gateway. **Implementado e validado.**

### ✅ Concluído

- **`AI-GATEWAY-PROMPTS.md`** (raiz, novo) — prompt enrichment (system prompt) dos **7 agentes** (Intake, Feature Backend, Feature Frontend, Platform, Review, Architecture, SRE), cada um com identidade (client_id, endpoint, escopos), system prompt para colar no gateway, contexto de entrada e formato de saída. Inclui regras transversais (PII/FAPI-BR/LGPD) e checklist de configuração.
- **Provider multi-agente** (`providers/ai_gateway.py`) — `provider_para(agente)` resolve credenciais por agente via env `AI_GATEWAY_<AGENT>_*`; `mapa_por_agente()` cobre os 7; degradação graciosa por agente; construtor atual mantido (compatibilidade).
- **Wire no grafo** (`graph/__init__.py` + `api/main.py`) — `build_graph` aceita `llm_por_dominio` (backend/frontend), mantendo `llm` único como fallback; `_llm_por_dominio_default()` e `_llm_por_agente_default()`.
- **Wire nos endpoints `/oao/*`** (`api/agents.py` + `api/main.py`) — invocadores passam `llm` do agente; `create_app` aceita `llm_por_agente` e injeta em `app.state`.
- **`.env.example`** — vars por agente (modo multi-agente) documentadas.
- **Testes** — 8 novos: provider multi-agente (4), wire por domínio no grafo (3, `test_llm_wire.py`), endpoint `/oao/feature-backend` usa LLM do agente (1).

### Validação
`poetry run pytest` → **111 passed** (103 + 8 novos); `poetry run ruff check .` limpo.

### ✅ Validação real do AI Gateway (LLM real confirmado)
- **`.env` criado pelo usuário** com credenciais reais dos 7 agentes (client_id/client_secret/chat_endpoint).
- **Diagnóstico:** as rotas estavam **disponíveis** no gateway, mas o `.env` apontava para URLs com sufixo `-agent` (`/oao/intake-agent/chat/completions`) → **404**. Corrigido para `/oao/<agent>/chat/completions` (sem `-agent`), conforme o contrato.
- **Smoke test real:** **7/7 agentes respondem 200 OK** (intake, feature-backend, feature-frontend, platform, review, architecture, sre).
- **Provider real:** `SensediaAIGatewayProvider.provider_para('feature-backend')` retorna resposta do LLM (não o fallback `[implementado]`).
- **Wire no runtime:** `create_app` carrega os 7 providers em `app.state.llm_por_agente`; `/oao/feature-backend/chat/completions` retorna worktree com `resultado: 'OK'` (LLM real).
- **Nota de segurança:** o `.env` contém secrets reais — **não commitado** (confirmado no `.gitignore`).

### Estado do git
**Commits pushados para `origin/main`:**
- `6ff5278` — `feat(llm): wirear LLM real por agente no AI Gateway (multi-agente)` (10 arquivos, +672/-19).
- `eced5da` — `docs(ai-gateway): adicionar lista completa de scopes e matriz de associação por agente` (+85).

Working tree **limpo** (`.env` local não versionado). Branch `main` sincronizada com `origin/main`.

### Próxima ação recomendada
**Item 1 (checkpointer Postgres)** — trocar `build_dev_checkpointer()` por `build_postgres_checkpointer(DATABASE_URL)` (já existe em `persistence/__init__.py`), com fallback para dev; habilitar o MCP `postgres` no `opencode.json`. Menor risco, destrava persistência real do board e habilita o MCP. Depois, **item 2 (Eval gate real, ADR-0018)** — gate não-negociável antes de deploy.

## Próximos passos

> **Estado:** grafo implementado e versionado. Change `fde-console` com Grupos 1–7 concluídos (37/37), **arquivado** em `openspec/archive/2026-08-22-fde-console/`. Redesign + evolução do console (Tasks, /graph, Colunas, filtros por facet, metadados, mock populado) **concluídos e validados**. Rodada de definição da oferta (Q1–Q30) registrada em ADRs 0015–0019. **Loop goal-based do Feature Agent (ADR-0016) implementado (Camada 1/harness) e arquivado em `openspec/archive/2026-08-23-feature-agent-loop/`.** **Refatoração de nomenclatura concluída: tudo `tasks`/`task` (frontend e backend), página `/intake` removida (criação via modal no Tasks), autoria de spec no detalhe da demanda.** **Item 1 (gates condicionais, ADR-0017) CONCLUÍDO: gates passam a bloquear de fato (HITL rejeitado→END, Eval reprovado→hitl), nó `deploy` stub, `Status` ganhou `rejeitado`, decisão do FDE tipada (`decisao`/`observacao`), fix do modal (ESC/clique-fora).** **Item 2 (SRE real, ADR-0019) CONCLUÍDO: `ResultadoMonitoramento` estruturado + port `criar_demanda` wireado na API, fechando o loop ADR-0010.** **Intake Agent (decisão 1, fallback de ambiguidade): change OpenSpec `intake-fallback-ambiguidade` IMPLEMENTADO e ARQUIVADO em `openspec/archive/2026-08-23-intake-fallback-ambiguidade/` (precedência alta→baixa→fallback `alta`, lista `baixa_ambiguidade`, 48 passed).** **Intake Agent (decisão 3, PII financeiro): change OpenSpec `intake-pii-financeiro` IMPLEMENTADO e ARQUIVADO em `openspec/archive/2026-08-23-intake-pii-financeiro/` (CHAVE_PIX UUID + CONTA_BANCARIA, 51 passed).** **Intake Agent (decisão 4, novo motivo de discordância na Audit): change OpenSpec `intake-audit-motivo-ambiguidade` IMPLEMENTADO e ARQUIVADO em `openspec/archive/2026-08-23-intake-audit-motivo-ambiguidade/` (contador 'ambíguo demais para keyword' via `POST /auditoria/ambigua`, 53 passed).** **Intake Agent (decisão 2, similaridade semântica pgvector): change OpenSpec `intake-similaridade-semantica` IMPLEMENTADO e ARQUIVADO em `openspec/archive/2026-08-23-intake-similaridade-semantica/` (Sentence-Transformers local + pgvector, `make_intake_node` com DI, extra `langgraph-checkpoint-postgres@^2.0.25` resolvido, 61 passed).** **Feature Agent (decisão 2 da seção 7, gatilho dinâmico do Architecture): change OpenSpec `feature-architecture-gatilho-dinamico` IMPLEMENTADO e ARQUIVADO em `openspec/archive/2026-08-23-feature-architecture-gatilho-dinamico/` (heurística `_toca_contrato_externo` no `feature_node`, aresta condicional `fan_in → {architecture | review}`, flag `architecture_enabled` removida, 71 passed).** **Change 4 (cobertura de testes do fluxo por origem) CONCLUÍDO: `tests/test_graph.py` com testes de integração para `estrategia` (subtipo `nova_funcionalidade`/`melhoria`) e `sre` (via port `criar_demanda` → nova execução `origem=sre`) até `monitorado`, helper `_levar_ate_monitorado`, 76 passed, ruff limpo, commit `3102eb8`.** **Plano de implementação da superfície de integração externa (endpoints por agente, auth OAuth2/Keycloak, escopos, `act`, tenant) DOCUMENTADO: Feature Intake Brief `docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md` + change OpenSpec `openspec/changes/oao-endpoints-auth-scopes/` (3 fases, D1–D11) + seção '4. Plano de implementação' em `Inicio/definicoes/oao-endpoints-and-scopes.md`; `openspec validate` → valid.** **Fase A (Camada 1) do `oao-endpoints-auth-scopes` IMPLEMENTADA e ARQUIVADA em `openspec/archive/2026-08-28-oao-endpoints-auth-scopes/`: `tenant_id` no `BoardState`, `scopes.py` (matriz declarativa), endpoints `/oao/<agent>/chat/completions` para os 7 agentes com `require_scope` em memória, delegação `act`, port `criar_demanda` com tenant; 85 passed, ruff limpo, commit `a86464e`.** Commitado; push para `origin/main` pendente (branch à frente).

1. ~~**Intake Agent — decisão 1 (fallback de ambiguidade)**~~ — **CONCLUÍDO.** Change OpenSpec `intake-fallback-ambiguidade` implementado e arquivado em `openspec/archive/2026-08-23-intake-fallback-ambiguidade/`. `classificar_ambiguidade` com precedência de 3 níveis (alta → baixa → fallback `alta`), nova lista `baixa_ambiguidade` em `intake.py`/`heuristica.json`, teste novo do fallback. **48 passed, ruff limpo.**
2. ~~**Intake Agent — decisão 3 (PII financeiro)**~~ — **CONCLUÍDO.** Change OpenSpec `intake-pii-financeiro` implementado e arquivado em `openspec/archive/2026-08-23-intake-pii-financeiro/`. `pii/__init__.py` ganhou 2 novos `PadraoPII`: `CHAVE_PIX` (UUID, categoria sensível) e `CONTA_BANCARIA` (permissivo com separador, categoria sensível). `CHAVE_PIX` ordenado antes de `TELEFONE` para evitar conflito de regex. **51 passed, ruff limpo.**
3. ~~**Intake Agent — decisão 4 (novo motivo de discordância na Audit)**~~ — **CONCLUÍDO.** Change OpenSpec `intake-audit-motivo-ambiguidade` implementado e arquivado em `openspec/archive/2026-08-23-intake-audit-motivo-ambiguidade/`. Contador em memória "ambíguo demais para keyword" via `POST /auditoria/ambigua` (não toca a heurística), card de métrica + botão "Ambíguo" na tela Audit. **53 passed, ruff limpo; frontend 19 passed.**
4. ~~**Intake Agent — decisão 2 (similaridade semântica pgvector)**~~ — **CONCLUÍDO.** Change OpenSpec `intake-similaridade-semantica` implementado e arquivado em `openspec/archive/2026-08-23-intake-similaridade-semantica/`. Substitui a keyword literal "sem precedente" por busca por similaridade semântica (Sentence-Transformers local + pgvector). `make_intake_node(buscar_precedentes=...)` com DI, `registrar_precedente` no nó SRE, `thread_id` na justificativa, degradação graciosa. Extra `langgraph-checkpoint-postgres@^2.0.25` resolvido. **61 passed, ruff limpo; frontend 19 passed.**
5. ~~**Roteamento condicional dos gates (ADR-0017)**~~ — **CONCLUÍDO.** Arestas condicionais HITL (rejeitado→END) e Eval (reprovado→hitl) + nó `deploy` stub + `Status` ganhou `rejeitado` + decisão do FDE tipada (`decisao`/`observacao`, 3 caminhos) + fix do modal de nova demanda (ESC/clique-fora).
6. ~~**SRE real (ADR-0019)**~~ — **CONCLUÍDO.** `ResultadoMonitoramento` estruturado (motivo sempre presente) + port `criar_demanda` wireado na API (fecha o loop ADR-0010). Reasoner real (múltiplos sinais + tendência) fica para quando houver observabilidade + LLM.
7. ~~**Multi-tenancy (ADR-0015)**~~ — **Fase C (backend) CONCLUÍDA.** Change OpenSpec `oao-multi-tenancy` implementado e **arquivado** em `openspec/archive/2026-08-29-oao-multi-tenancy/`. Isolamento por tenant no console do FDE: `BoardView` filtrado por `tenant_id`, endpoints (`/tasks`, `/tasks/{thread_id}`, `/resume`, `/intake`, `/auditoria`) com 404 anti-enumeração, `POST /intake` com tenant do JWT, auth real (Bearer JWT) nos endpoints de dados. ADR-0023. **103 passed, ruff limpo.** **FDE por tenant no console (login OIDC no frontend) — EM ANDAMENTO (change `oao-console-oidc`).**
8. **Substituir fallbacks determinísticos por implementações reais** — `LLMProviderPort` concreto (Sensedia AI Gateway/JWT) **CONCLUÍDO E VALIDADO nesta sessão**: provider multi-agente + wire no grafo e nos endpoints `/oao/*` + `AI-GATEWAY-PROMPTS.md` + smoke test real (7/7 agentes 200 OK, LLM real confirmado). **Pendente:** Eval gate real em duas camadas LangSmith (ADR-0018), métricas reais de SLO no SRE, reasoners LLM nos nós intake/review/architecture/sre (hoje determinísticos). **Camada 2 do loop goal-based (integração real LLM + ferramentas MCP git/test) depende desta infra.**
9. **Provisionar infra do checkpointer** (Postgres/Redis) e habilitar os MCPs `postgres`/`redis`. **Estado:** Postgres + Keycloak provisionados e **healthy** (docker-compose); MCPs `postgres`/`redis` ainda `enabled: false` no `opencode.json`; checkpointer ainda `InMemorySaver` (board volátil). **Próximo passo recomendado (item 1):** trocar por `build_postgres_checkpointer(DATABASE_URL)` e habilitar o MCP `postgres`.
10. **DECISÃO PENDENTE — topologia do Graph:** o `/graph` exibe topologia linear simplificada; a arquitetura real tem fan-out/fan-in dos worktrees backend/frontend em paralelo e aresta de fechamento SRE→Intake (ADR-0010) ainda não visualizados. Registrado como decisão pendente (não bug) em `docs/sdd/feature-intakes/graph-topologia-real.md`. Não implementar nesta rodada.
11. ~~**Feature Agent — decisão 2 da seção 7 (Architecture Agent como subagent no loop do Feature)**~~ — **CONCLUÍDO (Camada 1).** Change OpenSpec `feature-architecture-gatilho-dinamico` implementado e arquivado em `openspec/archive/2026-08-23-feature-architecture-gatilho-dinamico/`. Acionamento condicional do Architecture por demanda via heurística determinística `_toca_contrato_externo(spec)` no `feature_node` + aresta condicional `fan_in → {architecture | review}`; flag global `architecture_enabled` removida. **71 passed, ruff limpo.** *Nota: a chamada tipo subagent com contexto isolado (desenho completo da decisão 7.3) fica para Camada 2; nesta rodada o Architecture continua como nó do grafo, só com acionamento condicional.*
12. ~~**Fechar o fluxo/loop fim-a-fim (Camada 1) — Change 2: wirear notifier do HITL.**~~ — **CONCLUÍDO.** Change OpenSpec `hitl-notifier-wire` implementado e arquivado em `openspec/archive/2026-08-23-hitl-notifier-wire/`. `create_app` wirea um `notifier` concreto (log estruturado via `_notifier_log`, sanitizado com `sanitize_for_telemetry`) no `make_resume_handler`; `NotificationPort.notify` passa a ser chamado no `POST /resume`. **73 passed, ruff limpo.** Polling ~4s continua como fonte de verdade; Redis/SSE real fica para Camada 2.
13. ~~**Fechar o fluxo/loop fim-a-fim (Camada 1) — Change 3: topologia real do Graph no console.**~~ — **CONCLUÍDO.** Change OpenSpec `graph-topologia-real` implementado e arquivado em `openspec/archive/2026-08-23-graph-topologia-real/`. `loop-stages.ts` divide `feature` em `feature_backend`/`feature_frontend`; `loop-canvas.tsx` representa fan-out/fan-in dos worktrees e a aresta de fechamento SRE→Intake (ADR-0010). Fecha a decisão pendente registrada em `docs/sdd/feature-intakes/graph-topologia-real.md`. **lint/build/test verdes (19/19).**
14. ~~**Fechar o fluxo/loop fim-a-fim (Camada 1) — Change 4: cobertura de testes do fluxo por origem.**~~ — **CONCLUÍDO.** Novos testes em `tests/test_graph.py` para `estrategia` (com subtipo `nova_funcionalidade`/`melhoria`) e `sre` (via port `criar_demanda` → nova execução `origem=sre`) percorrendo o ciclo completo até `monitorado`. Helper `_levar_ate_monitorado` generaliza o driver para os dois caminhos de ambiguidade. **76 passed, ruff limpo.** Commit `3102eb8`.
15. ~~**Implementar a superfície de integração externa (plano `oao-endpoints-auth-scopes`)**~~ — **Fase A (Camada 1) CONCLUÍDA.** Change OpenSpec `oao-endpoints-auth-scopes` implementado (D1–D6) e **arquivado** em `openspec/archive/2026-08-28-oao-endpoints-auth-scopes/`. `tenant_id` no `BoardState`, `scopes.py` (matriz declarativa), endpoints `/oao/<agent>/chat/completions` com `require_scope` em memória, delegação `act`, port `criar_demanda` com tenant. **85 passed, ruff limpo.** **Fases B (auth real OAuth2/Keycloak + ports reais) e C (multi-tenancy, ADR-0015) dependem de infra — PRÓXIMO PASSO.**
16. ~~**Fase B do `oao-endpoints-auth-scopes` (auth real OAuth2/Keycloak + JWT + LLM real)**~~ — **CONCLUÍDA.** Change OpenSpec `oao-auth-real` implementado (D12–D17) e **arquivado** em `openspec/archive/2026-08-29-oao-auth-real/`. Keycloak provisionado no docker-compose (realm `oao`, clientes `oa-*`, healthcheck na porta 9000), `JWTScopeProvider` (validação via JWKS, extração `client_id` + `tenant_id`), `get_current_tenant`, `SensediaAIGatewayProvider` (LLM real com degradação graciosa), enforcement real de escopos por `client_id` do JWT. **96 passed, ruff limpo.** Smoke test E2E real com Keycloak validado (200/403/401). **Fase C (multi-tenancy, ADR-0015) CONCLUÍDA — ver item 7.** Smoke test real do AI Gateway condicionado ao cadastro de scopes/credenciais no gateway.
17. ~~**Fase C do `oao-endpoints-auth-scopes` (multi-tenancy no console do FDE)**~~ — **CONCLUÍDA.** Change OpenSpec `oao-multi-tenancy` implementado (D18–D21) e **arquivado** em `openspec/archive/2026-08-29-oao-multi-tenancy/`. Isolamento por tenant no console do FDE (BoardView filtrado, 404 anti-enumeração, intake com tenant do JWT, auth real Bearer JWT nos endpoints de dados). ADR-0023. **103 passed, ruff limpo.** **FDE por tenant no console (login OIDC no frontend) — PRÓXIMO PASSO.**
18. ~~**Login OIDC no console (FDE por tenant)**~~ — **CONCLUÍDO.** Change OpenSpec `oao-console-oidc` implementado e **arquivado** em `openspec/archive/2026-08-29-oao-console-oidc/`. Auth.js/next-auth + Keycloak: sessão com `access_token` + `tenant_id`, guard via `proxy.ts` + `auth()`, `lib/api.ts` com Bearer, fim do modo demo. ADR-0024. **Gap de visibilidade do tenant fechado nesta sessão:** `TenantBadge` exibido no header do dashboard e no footer da sidebar (o backend já isolava via JWT).

## Fontes-chave

- Arquitetura: `Inicio/sensedia-open-agentic-ops.md`, `Inicio/diagrama-squad-open-agentic-ops-texto.md`.
- Decisões: `docs/adr/`, `Inicio/HANDOFF-squad-agentica.md`.
- Perfil de Segurança do Open Finance (FAPI-BR): wiki da Área do Desenvolvedor (openfinancebrasil.atlassian.net/wiki/spaces/OF) + GitHub specs-seguranca (em arquivamento).
- LGPD (Lei 13.709/2018) e Resolução CD/ANPD nº 15/2024.
- LangGraph 1.0 GA (out/2025), LangSmith.
- ADR template: Michael Nygard (architecture-decision-record/architecture-decision-record).
