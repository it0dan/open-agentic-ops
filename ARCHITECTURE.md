# ARCHITECTURE.md — Open Agentic Ops

Visão estrutural corrente da squad. Complementa os ADRs (decisões pontuais) com a visão de arquitetura viva. Diagramas em notação C4 (Context / Container / Component). Glossário em `CONTEXT.md`.

## Visão geral

A squad é um **grafo LangGraph** (Graph Engineering) que orquestra agentes que operam o ciclo de vida de Open Finance. Cada agente é um nó do grafo; o loop intra-agente de tool-calling (Loop Engineering) roda dentro de cada nó. O checkpointer do grafo é o board. Um único FDE (humano) garante julgamento onde a ambiguidade exige.

## C4 — Contexto (nível 1)

```
                    ┌──────────────────────────────────────────────────┐
                    │            SQUAD OPEN AGENTIC OPS                │
                    │                                                  │
  [Cliente] ───────▶│  ┌──────────────────────────────────────────┐   │
  [Regulatório] ───▶│  │        GRAFO LANGGRAPH (orquestrador)    │   │
  [Estratégia] ────▶│  │  ┌──────────┐   ┌────────────────────┐   │   │
  [SRE (prod)] ────▶│  │  │  Intake  │──▶│  Board (checkpoint)│   │   │
                    │  │  │  Agent   │   └────────────────────┘   │   │
                    │  │  └──────────┘                            │   │
                    │  └──────────────────────────────────────────┘   │
                    │         ▲                                       │
                    │         └────── loop de fechamento (via Intake) ┘
                    │                                                  │
                    │  [FDE (humano)] — HITL gate, autoria de spec,    │
                    │                  auditoria prospectiva           │
                    └──────────────────────────────────────────────────┘
```

O Intake Agent é um **nó dentro do grafo** (não um componente externo). O board é o checkpointer do grafo. O FDE é humano — conecta-se ao grafo via `POST /resume` (HITL gate e retomada de autoria de spec).

## C4 — Containers (nível 2)

O sistema é um único container lógico (o runtime da squad) com componentes internos. A infraestrutura externa consumida:

| Container externo | Uso | Protocolo |
|---|---|---|
| Sensedia AI Gateway | Autenticação JWT, roteamento de LLM, observabilidade | HTTP (Bearer) |
| LangSmith | Tracing agêntico, avaliação | SDK |
| OTel Collector | Métricas/infra | OTLP gRPC |
| Postgres / Redis | Checkpointer (board) e estado HITL | SQL / RESP |
| Serviços MCP (git/SCM, testes, deploy) | Execução delegada pelos nós X-as-a-Service | MCP |
| Serviços A2A (Review, Architecture) | Diálogo conversacional | A2A (HTTP) |

## C4 — Componentes (nível 3): o grafo

```
                    ┌──────────────────────────────────────────────────────┐
                    │                    GRAFO LANGGRAPH                    │
                    │                                                      │
  [4 origens] ────▶ │  intake_node ──classifica ambiguidade──▶ branch      │
                    │     │                                                │
                    │     ├─ baixa ──▶ rascunha_spec (Intake)              │
                    │     └─ alta ───▶ ESCALA AO FDE (autoria)             │
                    │              └──▶ POST /resume ──▶ spec_pronta       │
                    │                                                      │
                    │  spec_pronta ──▶ fan-out (2 worktrees paralelos)     │
                    │     ├─ feature_backend (nó genérico, Guia=backend)   │
                    │     │     ├─ platform_node (MCP: testes/lint/deploy) │
                    │     │     └─ architecture_node (A2A, se contrato)    │
                    │     └─ feature_frontend (nó genérico, Guia=frontend) │
                    │           └─ platform_node (MCP)                     │
                    │                                                      │
                    │  fan-in ◀── review_node (A2A, por worktree)          │
                    │     │                                                │
                    │     ▼                                                │
                    │  hitl_gate (interrupt → FDE aprova via POST /resume) │
                    │     ▼                                                │
                    │  eval_gate (PromptFoo trajectory eval)               │
                    │     ▼                                                │
                    │  sre_node (monitora SLOs/error budget)               │
                    │     └──▶ gera task ──▶ intake_node (4ª origem)       │
                    │                                                      │
                    │  BOARD (checkpointer) ◀── estado de todos os nós     │
                    │     └──▶ view para o FDE (demandas pendentes)        │
                    └──────────────────────────────────────────────────────┘
```

O **board** (checkpointer) persiste o estado de todos os nós e provê a view que o FDE consulta. O **SRE** realimenta o board como 4ª origem **passando pelo Intake** (mesmo funil das outras 3 origens). A **spec do FDE** (alta ambiguidade) re-entra no grafo via `POST /resume`.

## Componentes do grafo

| Nó | Tipo | Protocolo | Responsabilidade |
|---|---|---|---|
| `intake_node` | Platform (extensão) | MCP | Classifica domínio e ambiguidade das 4 origens (inclui a 4ª origem SRE) |
| `feature_node` | Stream-aligned | — | Nó genérico parametrizado por Guia (skill) — backend/frontend |
| `platform_node` | Platform | MCP | Testes, lint, deploy, observabilidade como serviço |
| `review_node` | Enabling | A2A | Feedback de PR; orienta, não bloqueia |
| `architecture_node` | Complicated-subsystem | A2A | Discussão de contrato/compliance; aconselha, não veta |
| `sre_node` | Platform (extensão) | MCP | Monitora SLOs/error budget; gera task que realimenta o Intake como 4ª origem |
| `hitl_gate` | processo | — | `interrupt()` → FDE aprova via `POST /resume` |
| `eval_gate` | processo | — | PromptFoo trajectory eval antes do deploy |

## Board (checkpointer)

O **board** é o checkpointer do grafo (ADR-0002). Persiste o estado de todos os nós por thread_id (origem, ambiguidade, spec, status). Provê a **view para o FDE** consultar demandas pendentes. Não é um sistema separado.

## Retomada do FDE (`POST /resume`)

O FDE conecta-se ao grafo via `POST /resume` em dois momentos:
- **HITL gate** — aprova/rejeita o merge (ADR-0005).
- **Autoria de spec** (alta ambiguidade) — injeta a spec autorada no estado do grafo, que continua o fluxo (ADR-0009).

## Portas (hexagonal leve — ADR-0004)

- **LLMProviderPort** — troca de modelo/provider sem tocar o harness.
- **ToolExecutionPort** — chamadas MCP.
- **PersistencePort** — checkpointer (Postgres/Redis).
- **NotificationPort** — `POST /resume` do HITL.

## Regras de protocolo (ADR-0007)

- X-as-a-Service/trigger → **MCP** (Intake, Platform, SRE).
- Collaboration/Facilitating → **A2A** (Architecture, Review).
- Processo/humano (HITL, Eval, FDE) → sem protocolo agente-agente.

## Segurança de PII (ADR-0006)

PII mascarada na fronteira de entrada (Intake), ancorada em classificação LGPD. Aplicada em todas as fronteiras: comunicação, checkpointer, telemetria, evals, logs. PII raw nunca entra no sistema.

## Referências

- Arquitetura de referência: `Inicio/sensedia-open-agentic-ops.md`, `Inicio/diagrama-squad-open-agentic-ops-texto.md`.
- Decisões: `docs/adr/`.
- Glossário: `CONTEXT.md`.
