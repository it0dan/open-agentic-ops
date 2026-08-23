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

**Sessão atual (refactor + docs):** polling de demandas consolidado no hook `useDemandasPolling` (DRY, `POLL_INTERVAL` único); tela **Board → Registry → Tasks** (rota `/tasks`, redirects 307 de `/board`); decisão pendente sobre topologia real do Graph registrada em `docs/sdd/feature-intakes/graph-topologia-real.md`; bullet de marketing do login corrigido e naming interno alinhado (`TasksPage`, `ColumnTasks`). **Refatoração de nomenclatura concluída: tudo `tasks`/`task` (frontend e backend), página `/intake` removida (criação via modal no Tasks), autoria de spec movida para o detalhe da demanda.** 8 commits aguardando push para `origin/main`.

**Validação (estado atual):** `poetry run pytest` → **47 passed**; `poetry run ruff check .` → limpo; `uvicorn api.main:app` sobe e responde `/health`, `/tasks`, `/intake`, `/resume`, `/auditoria`, `/auditoria/heuristica`; `npm run lint` e `npm run build` no `frontend/` verdes; `npm test` (vitest) → **19/19 passed**.

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

Revisão do documento `Inicio/open-agentic-ops-definicao-oferta (3).md` via grilling (7 rodadas, ordem do documento: Origens → Intake → Feature → Eval/Deploy → HITL → SRE → Board). Todas as decisões `[DECISÃO PENDENTE]` e tensões descobertas ao cruzar com o código foram resolvidas. **Nenhum código alterado — apenas registro em docs.**

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

## Próximos passos

> **Estado:** grafo implementado e versionado. Change `fde-console` com Grupos 1–7 concluídos (37/37), **arquivado** em `openspec/archive/2026-08-22-fde-console/`. Redesign + evolução do console (Tasks, /graph, Colunas, filtros por facet, metadados, mock populado) **concluídos e validados**. Rodada de definição da oferta (Q1–Q30) registrada em ADRs 0015–0019. **Loop goal-based do Feature Agent (ADR-0016) implementado (Camada 1/harness) e arquivado em `openspec/archive/2026-08-23-feature-agent-loop/`.** **Refatoração de nomenclatura concluída: tudo `tasks`/`task` (frontend e backend), página `/intake` removida (criação via modal no Tasks), autoria de spec no detalhe da demanda.** **Item 1 (gates condicionais, ADR-0017) CONCLUÍDO: gates passam a bloquear de fato (HITL rejeitado→END, Eval reprovado→hitl), nó `deploy` stub, `Status` ganhou `rejeitado`, decisão do FDE tipada (`decisao`/`observacao`), fix do modal (ESC/clique-fora).** **Item 2 (SRE real, ADR-0019) CONCLUÍDO: `ResultadoMonitoramento` estruturado + port `criar_demanda` wireado na API, fechando o loop ADR-0010.** Tudo commitado e pusheado para `origin/main`.

1. ~~**Roteamento condicional dos gates (ADR-0017)**~~ — **CONCLUÍDO.** Arestas condicionais HITL (rejeitado→END) e Eval (reprovado→hitl) + nó `deploy` stub + `Status` ganhou `rejeitado` + decisão do FDE tipada (`decisao`/`observacao`, 3 caminhos) + fix do modal de nova demanda (ESC/clique-fora).
2. ~~**SRE real (ADR-0019)**~~ — **CONCLUÍDO.** `ResultadoMonitoramento` estruturado (motivo sempre presente) + port `criar_demanda` wireado na API (fecha o loop ADR-0010). Reasoner real (múltiplos sinais + tendência) fica para quando houver observabilidade + LLM.
3. **Multi-tenancy (ADR-0015)** — frente paralela; ADR já criado, implementação (Keycloak + isolamento + console) depende de infra. **PRÓXIMO PASSO.**
4. **Substituir fallbacks determinísticos por implementações reais** — `LLMProviderPort` concreto (Sensedia AI Gateway/JWT), Eval gate real em duas camadas LangSmith (ADR-0018), métricas reais de SLO no SRE. **Camada 2 do loop goal-based (integração real LLM + ferramentas MCP git/test) depende desta infra.**
5. **Provisionar infra do checkpointer** (Postgres/Redis) e habilitar os MCPs `postgres`/`redis`.
6. **DECISÃO PENDENTE — topologia do Graph:** o `/graph` exibe topologia linear simplificada; a arquitetura real tem fan-out/fan-in dos worktrees backend/frontend em paralelo e aresta de fechamento SRE→Intake (ADR-0010) ainda não visualizados. Registrado como decisão pendente (não bug) em `docs/sdd/feature-intakes/graph-topologia-real.md`. Não implementar nesta rodada.

## Fontes-chave

- Arquitetura: `Inicio/sensedia-open-agentic-ops.md`, `Inicio/diagrama-squad-open-agentic-ops-texto.md`.
- Decisões: `docs/adr/`, `Inicio/HANDOFF-squad-agentica.md`.
- Perfil de Segurança do Open Finance (FAPI-BR): wiki da Área do Desenvolvedor (openfinancebrasil.atlassian.net/wiki/spaces/OF) + GitHub specs-seguranca (em arquivamento).
- LGPD (Lei 13.709/2018) e Resolução CD/ANPD nº 15/2024.
- LangGraph 1.0 GA (out/2025), LangSmith.
- ADR template: Michael Nygard (architecture-decision-record/architecture-decision-record).
