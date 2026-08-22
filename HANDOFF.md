# HANDOFF — Open Agentic Ops

Estado da sessão para retomada. Gerado ao final de cada sessão (ver `AGENTS.md`). Este documento compacta o que foi feito, as decisões fechadas, os artefatos e os próximos passos.

## Estado atual

**Implementação do grafo LangGraph concluída** (change `squad-open-agentic-ops`, 24/24 tasks). O repo agora contém, além da fundação documental (arquitetura, ADRs, glossário, pipeline SDD/SPDD), o **código Python funcional** da squad: scaffold Poetry, portas hexagonais, modelo de estado, persistência (checkpointer = board), redação PII, todos os nós e gates, montagem do grafo, observabilidade e testes.

**Validação:** `poetry run pytest` → 10 passed; `poetry run ruff check .` → limpo; `poetry run ruff format --check .` → 24 arquivos formatados. Fluxo ponta a ponta do caso-âncora validado (Intake → fan-out 2 worktrees → Architecture/Review → HITL gate com `Command(resume=...)` → Eval → SRE monitora).

**Playbook de desenvolvimento agêntico portado** do `solutions-business-case-agent` (bitbucket): Feature Start Playbook (SDD/SPDD + OpenSpec + OpenCode), template de intake, comandos `/opsx:*` e skills OpenSpec. O `openspec/` foi migrado para o layout canônico (reconhecido pelo CLI `openspec` v1.3.1).

**Versionamento:** o git está inicializado (branch `main`, remoto `origin` → `git@github.com:it0dan/open-agentic-ops.git`), com 1 commit (`first commit`) contendo apenas `README.md`. O corpo documental + código permanece **local/untracked** — ainda não commitado nem pusheado.

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

### Adoção do playbook de desenvolvimento agêntico (esta sessão)
- **P1:** Portar o Feature Start Playbook (SDD/SPDD + OpenSpec + OpenCode) do `solutions-business-case-agent` (bitbucket) como base de desenvolvimento.
- **P2:** Migrar `openspec/` para o layout canônico (`specs/<feature>/spec.md`, `archive/`, `project.md`, `config.yaml`) — reconhecido pelo CLI `openspec` v1.3.1.
- **P3:** ADRs permanecem em `docs/adr/` (convenção Nygard) — **não** migrar para `openspec/architecture/adr/`.
- **P4:** Change atual `squad-open-agentic-ops` tratado como **legado** (migrado sem intake retroativo); playbook completo aplica-se a features futuras.
- **P5:** Gestor de dependências = **Poetry**.
- **P6:** Checkpointer inicial = **SqliteSaver/InMemorySaver** (dev), migrando para PostgresSaver em prod.

## Artefatos criados

| Artefato | Conteúdo |
|---|---|
| `opencode.json` | Config do opencode (permissões, MCPs) |
| `AGENTS.md` | Regras do projeto (squad, gates, SDD/SPDD, PII, handoff) |
| `README.md` | Porta de entrada |
| `CONTEXT.md` | Glossário (board, origem, ambiguidade, Guia, worktree, gate, FDE, PII, grafo, loop, resume, redação PII) |
| `ARCHITECTURE.md` | Visão estrutural C4 (contexto, containers, componentes do grafo, board, retomada do FDE) |
| `docs/adr/` | 13 ADRs (template Nygard) |
| `Inicio/HANDOFF-squad-agentica.md` | Handoff original trazido e atualizado com as decisões |
| `openspec/changes/squad-open-agentic-ops/` | Pipeline SDD/SPDD completo: `proposal.md`, `design.md`, `specs/squad-open-agentic-ops/spec.md`, `tasks.md`, `prompt.md` |
| `openspec/project.md` | Contexto do projeto (OpenSpec) |
| `openspec/config.yaml` | Config do OpenSpec (schema spec-driven) |
| `PROJECT.md` | Contexto do projeto (raiz) |
| `docs/sdd/feature-start-playbook.md` | Playbook de início de feature (portado/adaptado) |
| `docs/sdd/feature-intake-template.md` | Template de Feature Intake Brief (portado/adaptado) |
| `.opencode/commands/opsx-*.md` | Comandos `/opsx:*` (explore, propose, apply, archive) |
| `.opencode/skills/openspec-*/` | Skills OpenSpec (explore, propose, apply-change, archive-change) |
| `.gitignore` | Regras de ignore (pronto para git init) |
| `pyproject.toml` | Config Poetry (deps: langgraph, langchain, langsmith, OTel; extras sqlite/postgres; dev: pytest, ruff) |
| `.env.example` | Variáveis de ambiente (sem secrets) |
| `src/open_agentic_ops/ports/` | Portas hexagonais (LLMProvider, ToolExecution/MCP, Persistence, Notification) — ADR-0004 |
| `src/open_agentic_ops/state/` | Modelo de estado do board (TypedDict + reducers de append) — ADR-0002 |
| `src/open_agentic_ops/persistence/` | Factories de checkpointer (InMemory/Sqlite/Postgres) + BoardView — ADR-0002 |
| `src/open_agentic_ops/pii/` | Redação PII determinística (regex + LGPD/FAPI-BR) — ADR-0006/0012 |
| `src/open_agentic_ops/nodes/` | Nós: intake, guia, feature, platform, architecture, review, sre |
| `src/open_agentic_ops/gates/` | HITL gate (`interrupt()`/`Command`) e Eval gate — ADR-0005/0009/0013 |
| `src/open_agentic_ops/graph/` | Montagem do StateGraph (branch de ambiguidade, fan-out/fan-in, loop SRE→Intake) |
| `src/open_agentic_ops/observability/` | LangSmith + OTel com sanitização de PII — ADR-0008 |
| `tests/` | 10 testes (PII, Intake, integração do caso-âncora) |

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

## Próximos passos

> **Estado:** implementação do grafo concluída e validada (24/24 tasks). Próximo passo: arquivar o change e versionar o repo.

1. **Arquivar o change** — rodar `/opsx:archive squad-open-agentic-ops` para mover `openspec/changes/squad-open-agentic-ops/` para `openspec/archive/<date>-squad-open-agentic-ops/`.
2. **Commitar a fundação documental + código** — o git já está inicializado (remoto `origin` → `it0dan/open-agentic-ops`, 1 commit com só `README.md`); falta versionar e pushar o corpo documental + código. Push requer confirmação explícita.
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
