# HANDOFF — Open Agentic Ops

Estado da sessão para retomada. Gerado ao final de cada sessão (ver `AGENTS.md`). Este documento compacta o que foi feito, as decisões fechadas, os artefatos e os próximos passos.

## Estado atual

**Grafo LangGraph implementado e versionado** (change `squad-open-agentic-ops`, 24/24 tasks, arquivado em `openspec/archive/2026-08-22-squad-open-agentic-ops/`). O repo contém a fundação documental (arquitetura, ADRs, glossário, pipeline SDD/SPDD) e o **código Python funcional** da squad: scaffold Poetry, portas hexagonais, modelo de estado, persistência (checkpointer = board), redação PII, nós e gates, montagem do grafo, observabilidade e testes. **Commitado e pusheado** para `origin/main` (commit `1f2ec8d`).

**Change `fde-console` (console do FDE):** proposta, design, spec e tasks criados (37 tasks). **Grupos 1–7 concluídos (37/37):** runtime (heurística mutável, `classificacao_intake`, BoardView), API FastAPI (`api/main.py`), console Next.js, telas, integração console↔API, skill `frontend-sensedia` e testes/validação (incluindo ADR-0014). **Redesign visual completo (dark-first + glassmorphism) concluído.**

**Evolução do console (sessões recentes) — concluída e validada:**
- **Login simétrico + guard na raiz:** login centralizado simetricamente, redirect pós-login para `/dashboard`; rota raiz `/` com guard client (`components/home-redirect.tsx`) → `/dashboard` ou `/login`.
- **Board → Demandas → Tasks:** rota `/board` renomeada para `/demandas` e depois para `/tasks` (pasta movida), com **redirects de compatibilidade** em `app/(dashboard)/board/` (307 → `/tasks` e `/tasks/[id]`). Sidebar atualizada ("Demandas" + novo item "Loops").
- **Página `/loops` dedicada:** grafo React Flow full-viewport (sem modal), toolbar fixa, `components/content-container.tsx` remove o `max-w-7xl` na rota `/loops`.
- **Filtros por facet (dropdowns):** `components/filter-bar.tsx` reescrito — 3 botões de facet (Origem/Status/Domínio) com `Popover` + `Checkbox`, contador no label, acento de cor quando ativo, botão "Limpar (n)".
- **Kanban read-only:** `components/kanban-board.tsx` — **removido todo o DnD** (`@dnd-kit`), cards são `Link` → detalhe, 9 colunas do `FLUXO` com **colunas vazias auto-colapsáveis** (faixa fina ~48px com label vertical, clique expande temporariamente). Toggle Lista/Kanban persistido em `localStorage` (`fde-visao-demandas`).
- **Metadados no detalhe:** painel lateral sticky (`lg:grid-cols-[minmax(0,1fr)_280px]`) com Criado por, Owner atual, Criado em, Última atualização, Prioridade, Domínio, Origem.
- **Dashboard:** "Eventos recentes" abre expandido por padrão (`defaultOpen`); card do Loop inteiro clicável → `/loops` (removido botão "Expandir" isolado); seção renomeada "Últimas demandas".
- **Ciclo de vida ao vivo:** dot pulsante na etapa ativa (`dot-halo-executando`), barra anima (`transition-[width] duration-400 ease-out`) via polling 4s.
- **`/loops` interativo:** toggle Vertical removido (sempre horizontal); **nós arrastáveis** com persistência em `localStorage` (`fde-loop-node-positions`) + botão "Resetar layout"; arestas fixas pela ordem lógica; **CSS vars do React Flow** (`--xy-*`) sobrescritas para tema claro/dark; **drawer do agente completo** (histórico de eventos cronológico, duração + início, link para demanda). `LoopStage` estendido com `eventos`/`inicio`; `lib/loop-stages.ts` populado com eventos mock por etapa. Fix do build: `useReactFlow()` exige `ReactFlowProvider` → separado `LoopCanvasInner` (hook) do wrapper exportado `LoopCanvas` (provider).
- **Mock populado:** `lib/mock-data.ts` agora tem **23 demandas** (3 originais + 20 novas), cobrindo todos os status do `FLUXO`, origens (cliente/regulatorio/estrategia/sre), domínios (backend/frontend/ambos) e ambiguidades.

**Validação:** `poetry run pytest` → 28 passed; `poetry run ruff check .` → limpo; `uvicorn api.main:app` sobe e responde `/health`, `/tasks`, `/intake`, `/resume`, `/auditoria`, `/auditoria/heuristica`; `npm run lint` e `npm run build` no `frontend/` verdes; `npm test` (vitest) → **12/12 passed**; smoke test das rotas (`/login`, `/dashboard`, `/tasks`, `/loops`, detalhe → 200; `/board` e `/board/[id]` → 307 redirect).

## Trabalho desta sessão (encerramento)

**1. Smoke test E2E completo do console** — subiu API (porta 8000) e frontend (porta 3000) e validou ponta a ponta: `GET /tasks` (lista/detalhe/404), `POST /intake` (cria demanda + valida texto vazio → 422), `GET /auditoria`, `POST /auditoria/heuristica` (add/remove), `POST /resume` (aprova/rejeita HITL), todas as rotas do frontend (200) e redirects `/board` → `/tasks` (307). Tudo verde.

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
- **E1:** **Board → Demandas → Tasks** — rota `/tasks` (redirects de compatibilidade de `/board` e `/demandas`), sidebar e títulos renomeados.
- **E2:** **`/loops` página dedicada** full-viewport (sem modal), toolbar fixa, grafo ocupa o restante da viewport.
- **E3:** **Filtros por facet** — 3 dropdowns (Origem/Status/Domínio) com popover+checkbox, nunca pills expostas.
- **E4:** **Kanban read-only** — sem DnD (FDE intervém só via gate HITL); cards clicáveis → detalhe; colunas vazias auto-colapsáveis; toggle Lista/Kanban em `localStorage`.
- **E5:** **Metadados no detalhe** — painel lateral sticky (Criado por, Owner, Criado em, Atualizado em, Prioridade, Domínio, Origem).
- **E6:** **Dashboard** — eventos expandidos por padrão, card do Loop clicável → `/loops`, seção "Últimas demandas".
- **E7:** **`/loops` interativo** — nós arrastáveis (persistência localStorage + reset), sempre horizontal, controles com tema do design system, drawer do agente com histórico completo + live update (polling 4s).
- **E8:** **Mock populado** — 23 demandas cobrindo todos os status/origens/domínios/ambiguidades.

## Artefatos criados

| Artefato | Conteúdo |
|---|---|
| `opencode.json` | Config do opencode (permissões, MCPs) |
| `AGENTS.md` | Regras do projeto (squad, gates, SDD/SPDD, PII, handoff) |
| `README.md` | Porta de entrada |
| `CONTEXT.md` | Glossário (board, origem, ambiguidade, Guia, worktree, gate, FDE, PII, grafo, loop, resume, redação PII) |
| `ARCHITECTURE.md` | Visão estrutural C4 (contexto, containers, componentes do grafo, board, retomada do FDE) |
| `docs/adr/` | 14 ADRs (template Nygard) |
| `Inicio/HANDOFF-squad-agentica.md` | Handoff original trazido e atualizado com as decisões |
| `openspec/changes/squad-open-agentic-ops/` | Pipeline SDD/SPDD completo (arquivado) |
| `openspec/changes/fde-console/` | Change do console do FDE (37/37 tasks, aguardando archive) |
| `openspec/project.md` | Contexto do projeto (OpenSpec) |
| `openspec/config.yaml` | Config do OpenSpec (schema spec-driven) |
| `PROJECT.md` | Contexto do projeto (raiz) |
| `docs/sdd/feature-start-playbook.md` | Playbook de início de feature (portado/adaptado) |
| `docs/sdd/feature-intake-template.md` | Template de Feature Intake Brief (portado/adaptado) |
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
| `frontend/components/content-container.tsx` | Container que remove `max-w-7xl` na rota `/loops` (full-viewport) |
| `frontend/components/app-sidebar.tsx` | Sidebar com Dashboard/Demandas/Loops/Intake/Auditoria |
| `frontend/app/(dashboard)/tasks/page.tsx` | Tela de Demandas (ex-Board): KPIs, filtros por facet, toggle Lista/Kanban, cards |
| `frontend/app/(dashboard)/tasks/[threadId]/page.tsx` | Detalhe da demanda: ciclo de vida ao vivo, tabs, painel HITL, **metadados sticky** |
| `frontend/app/(dashboard)/board/page.tsx` + `[threadId]/page.tsx` | **Redirects de compatibilidade** (307 → `/tasks`) |
| `frontend/app/(dashboard)/loops/page.tsx` | Página `/loops` full-viewport com `LoopCanvas` |
| `frontend/components/filter-bar.tsx` | Filtros por facet (3 dropdowns popover+checkbox) |
| `frontend/components/kanban-board.tsx` | Kanban read-only, 9 colunas auto-colapsáveis, cards clicáveis |
| `frontend/components/loop-canvas.tsx` | Grafo React Flow interativo (nós arrastáveis, reset, drawer do agente) |
| `frontend/components/loop-status.tsx` | Card do Loop clicável → `/loops`; define `LoopStage` (com `eventos`/`inicio`) |
| `frontend/lib/loop-stages.ts` | `montarStages` (extraído) com eventos mock por etapa |
| `frontend/lib/mock-data.ts` | **23 demandas** mock (3 originais + 20 novas) |
| `frontend/lib/api.ts` | Cliente HTTP do frontend para a API FastAPI |
| `frontend/components/ui/` | Componentes base shadcn (inclui popover, checkbox, sheet, dialog, progress, etc.) |
| `.opencode/skills/frontend-sensedia/SKILL.md` | Skill de frontend (Guia): brand book Sensedia + padrão shadcn/ui |
| `docs/adr/0014-api-layer-and-fde-console.md` | ADR da camada de API + console (radius, dark-first, glassmorphism) |

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
- **Sidebar** (`components/app-sidebar.tsx`): Dashboard, Board (`/tasks`), Graph (`/graph`), Intake, Audit (`/audit`).
- **Loop→Graph na hierarquia**: `loop-status.tsx` ("Squad Graph", "Ver graph completo"), `dashboard/page.tsx` (`/graph`), detalhe da demanda ("Execution loop"), `content-container.tsx` (fullWidth `/graph`).
- **Kanban removido da UI**: `kanban-board.tsx` → `column-board.tsx` (`ColumnBoard`/`ColumnCard`); `tasks/page.tsx` toggle "Lista/Colunas" com ícone `Columns3`.
- **HITL gate no Graph**: `loop-canvas.tsx` — drawer do nó `hitl` mostra Aprovar/Rejeitar (via `aprovarDemanda`); nó `eval` mostra resultado; `LoopStage` estendido com `thread_id`/`resultado_eval`; `lib/loop-stages.ts` popula esses campos.
- **Intake autoria de spec**: `intake/page.tsx` — seção "Autoria de spec (alta ambiguidade)" listando itens aguardando spec do FDE, com textarea + botão "Liberar para o grafo" chamando `autorarSpec` (POST /resume). `lib/api.ts` estendido (`ResumePayload.spec` + `autorarSpec`).
- **Auditoria como calibração**: `audit/page.tsx` reescrito — métricas "% que o FDE manteria" / concordâncias / discordâncias (localStorage), tabela com botões "Manteria"/"Discordo", mantendo correção prospectiva da heurística (RNF-6).

**Testes frontend — resolvidos e ampliados:**
- **Bloqueio do teste de autoria do Intake resolvido** (`intake/page.test.tsx`): a causa raiz era o estado inicial `demandasMock` (com **2 itens** de alta ambiguidade + `spec_autor: "fde"`) renderizando 2 textareas antes do `useEffect` trocar para o mock da API (`[DEMANDA_ALTA]` = 1). Fix: o teste agora usa `waitFor` para aguardar o efeito resolver e conferir exatamente 1 textarea. Também tipado `DEMANDA_ALTA` como `Demanda` (corrige erro TS no build).
- **`audit/page.test.tsx`** — já atualizado para o novo layout de calibração ("Manteria"/"Discordo"); passa.
- **`tasks/page.test.tsx`** — adicionado teste do toggle "Colunas" (clica no botão e verifica que o `ColumnBoard` renderiza a coluna "Triado").
- **Lint limpo**: removido prop `demandas` não utilizado de `loop-canvas.tsx` (e do caller `graph/page.tsx` + import órfão `type { Demanda }`).

**Validação final:** `poetry run pytest` → **30 passed**; `poetry run ruff check .` → limpo; `npm run lint` → limpo; `npm run build` → OK; `npm test` → **15/15 passed**.

**Docs atualizados:** `README.md` e `ARCHITECTURE.md` (telas Graph `/graph` e Audit `/audit`, redirects legados `/loops`→`/graph` e `/auditoria`→`/audit`).

### Estado do git
Working tree **sujo** (mudanças não commitadas). `git status` mostra: backend (`api/main.py`, `src/open_agentic_ops/graph/__init__.py`, `src/open_agentic_ops/state/__init__.py`, `tests/test_api.py`, `tests/test_graph.py`) + frontend (rotas movidas, sidebar, loop-canvas, loop-status, column-board, intake, audit, tasks, api.ts, loop-stages, testes) + docs (`README.md`, `ARCHITECTURE.md`, `HANDOFF.md`). Redirects novos em `app/(dashboard)/loops/` e `app/(dashboard)/auditoria/` (untracked). **Nada commitado ainda.**

## Próximos passos

> **Estado:** grafo implementado e versionado. Change `fde-console` com Grupos 1–7 concluídos (37/37). Redesign + evolução do console (Tasks, /loops, Kanban read-only, filtros por facet, metadados, mock populado) **concluídos e validados**. **SESSÃO ATUAL: tarefa de nomenclatura/jornada do FDE CONCLUÍDA — backend e frontend prontos, testes/lint/build verdes (30 pytest + 15 vitest), docs atualizadas. Falta commitar e arquivar o change `fde-console`.**

1. **Commitar as mudanças da sessão** (nomenclatura Loop→Graph, Board→Colunas, jornada do FDE em Intake/Auditoria, testes, docs) — working tree ainda sujo.
2. **Arquivar o change `fde-console`** no OpenSpec (`/opsx:archive fde-console` → `openspec/archive/<date>-fde-console/`), seguindo o padrão do projeto.
3. **Substituir fallbacks determinísticos por implementações reais** — `LLMProviderPort` concreto (Sensedia AI Gateway/JWT), runner real de evals (PromptFoo + LangSmith), métricas reais de SLO no SRE.
4. **Provisionar infra do checkpointer** (Postgres/Redis) e habilitar os MCPs `postgres`/`redis`.
5. **Definir os Guias concretos** (skills backend/frontend) para o nó Feature Agent.

## Fontes-chave

- Arquitetura: `Inicio/sensedia-open-agentic-ops.md`, `Inicio/diagrama-squad-open-agentic-ops-texto.md`.
- Decisões: `docs/adr/`, `Inicio/HANDOFF-squad-agentica.md`.
- Perfil de Segurança do Open Finance (FAPI-BR): wiki da Área do Desenvolvedor (openfinancebrasil.atlassian.net/wiki/spaces/OF) + GitHub specs-seguranca (em arquivamento).
- LGPD (Lei 13.709/2018) e Resolução CD/ANPD nº 15/2024.
- LangGraph 1.0 GA (out/2025), LangSmith.
- ADR template: Michael Nygard (architecture-decision-record/architecture-decision-record).
