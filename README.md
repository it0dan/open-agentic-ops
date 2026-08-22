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
| [`docs/adr/`](docs/adr/) | Log de decisões de arquitetura (ADRs) |
| [`openspec/`](openspec/) | Proposal e pipeline spec-driven |

## Stack

Python + LangGraph (orquestração) + LangSmith (observabilidade/avaliação) + OTel (infra/métricas). Hexagonal leve só nas bordas. Ver ADRs em `docs/adr/`.

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
- [ ] `proposal.md` (OpenSpec/SPDD)
- [ ] `design.md → spec.md → tasks.md → prompt.md`
- [ ] Implementação do grafo LangGraph

## Regras

Ver [`AGENTS.md`](AGENTS.md) para as regras de desenvolvimento e os papéis da squad.
# open-agentic-ops
