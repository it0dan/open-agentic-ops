# Sensedia Open Agentic Ops

Squad agêntica autônoma que opera o ciclo de vida de Open Finance — de norma regulatória, demanda de cliente ou decisão estratégica até deploy monitorado — com um único FDE (Forward Deployed Engineer) garantindo julgamento humano onde a ambiguidade exige.

Este repo é o **runtime da squad**. O opencode é a ferramenta usada para desenvolver este projeto.

## Documentação

| Documento | Conteúdo |
|---|---|
| [`Inicio/sensedia-open-agentic-ops.md`](Inicio/sensedia-open-agentic-ops.md) | Arquitetura de referência da squad |
| [`Inicio/diagrama-squad-open-agentic-ops-texto.md`](Inicio/diagrama-squad-open-agentic-ops-texto.md) | Diagrama textual do fluxo |
| [`Inicio/HANDOFF-squad-agentica.md`](Inicio/HANDOFF-squad-agentica.md) | Handoff com decisões de maturação |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Visão estrutural corrente (C4) |
| [`CONTEXT.md`](CONTEXT.md) | Glossário do domínio |
| [`PROJECT.md`](PROJECT.md) | Contexto do projeto |
| [`docs/adr/`](docs/adr/) | Log de decisões de arquitetura (ADRs) |
| [`docs/sdd/feature-start-playbook.md`](docs/sdd/feature-start-playbook.md) | Playbook de início de feature (SDD/SPDD + OpenSpec) |
| [`docs/sdd/feature-intake-template.md`](docs/sdd/feature-intake-template.md) | Template de Feature Intake Brief |
| [`openspec/`](openspec/) | Pipeline spec-driven (proposal/design/spec/tasks) |
| [`api/`](api/) | Camada de API FastAPI do console do FDE |
| [`frontend/`](frontend/) | Console web do FDE (Next.js + shadcn/ui) |

## Desenvolvimento (SDD/SPDD + OpenSpec)

Todo desenvolvimento segue o padrão **Spec-Driven Development (SDD)** e **Spec-Driven Product Development (SPDD)**, orquestrado pelo CLI `openspec` e pelos comandos `/opsx:*` do OpenCode.

**Fluxo de nova feature:**

```txt
Feature Intake Brief
→ Safe Analysis
→ /opsx:propose
→ Review OpenSpec
→ Validate
→ Apply
→ Test
→ Archive
```

- **Feature Intake Brief** em `docs/sdd/feature-intakes/<feature-name>.md` (template em `docs/sdd/feature-intake-template.md`).
- **Safe analysis** antes de propor (sem modificar arquivos).
- **`/opsx:propose <feature-name>`** cria `proposal.md`, `design.md`, `specs/<feature>/spec.md` e `tasks.md`.
- **`/opsx:apply <feature-name>`** implementa as tasks.
- **`/opsx:archive <feature-name>`** arquiva o change concluído em `openspec/archive/<date>-<feature>/`.

O processo completo está em [`docs/sdd/feature-start-playbook.md`](docs/sdd/feature-start-playbook.md).

## Stack

Python + LangGraph (orquestração) + LangSmith (observabilidade/avaliação) + OTel (infra/métricas). Hexagonal leve só nas bordas. Ver ADRs em `docs/adr/`.

## Console do FDE

O console do FDE é composto por duas camadas no mesmo repositório:

- **API** (`api/`): FastAPI expondo o grafo LangGraph. Endpoints: `GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume` (HITL), `POST /intake`, `GET /auditoria`, `POST /auditoria/heuristica`.
- **Console** (`frontend/`): Next.js + TypeScript + Tailwind v4 + shadcn/ui. Telas: Login, Dashboard, Demandas (`/tasks`), Detalhe, Loops, Intake, Auditoria.

Para rodar localmente:

```bash
# API (porta 8000)
poetry run uvicorn api.main:app --host 0.0.0.0 --port 8000

# Console (porta 3000)
cd frontend && npm run dev
```

O console consome a API em `http://localhost:8000` (configurável via `NEXT_PUBLIC_API_URL`), com fallback para dados mock quando a API está indisponível.

## Skills e MCPs

**Skills instaladas** (em `~/.agents/skills/`):
- LangGraph: `langgraph-persistence`, `langgraph-human-in-the-loop`, `langgraph-python-quickstart`, `ecosystem-primer`
- PII: `pii-sanitizer`, `pii-redaction-logging-policy-builder`
- Open Finance: `pluggy-open-finance`

**MCPs configurados** (no `opencode.json` do projeto, open source/free):
- `github` — PRs, issues, worktrees (fluxo Review/HITL). Requer `GITHUB_PERSONAL_ACCESS_TOKEN`.
- `postgres` — inspecionar o checkpointer/board. Requer `DATABASE_URL`.
- `redis` — estado HITL/notificação. Requer `REDIS_URL`.

> Os MCPs `postgres` e `redis` dependem de infraestrutura que será provisionada na implementação do grafo. Defina as variáveis de ambiente (`GITHUB_PERSONAL_ACCESS_TOKEN`, `DATABASE_URL`, `REDIS_URL`) antes de usar.

## Estado

- [x] Configuração do opencode (`opencode.json`, `AGENTS.md`)
- [x] Arquitetura de referência e diagrama
- [x] Decisões de maturação (Graph Engineering, PII, stack, hexagonal)
- [x] ADRs, glossário, visão de arquitetura
- [x] Playbook de desenvolvimento agêntico (SDD/SPDD + OpenSpec) portado
- [x] `proposal.md`, `design.md`, `spec.md`, `tasks.md`, `prompt.md` (OpenSpec/SPDD)
- [x] Scaffold do projeto Python (Poetry)
- [x] Implementação do grafo LangGraph (24/24 tasks, testes verdes)
- [x] Camada de API FastAPI do console do FDE (`api/`)
- [x] Console web do FDE (`frontend/`) — Next.js + shadcn/ui
- [x] Change `fde-console` (37/37 tasks) commitado e pusheado

## Regras

Ver [`AGENTS.md`](AGENTS.md) para as regras de desenvolvimento e os papéis da squad.
