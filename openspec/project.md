# Project Context

## Purpose

Sensedia Open Agentic Ops é uma squad agêntica autônoma que opera o ciclo de vida de Open Finance — de norma regulatória, demanda de cliente ou decisão estratégica até deploy monitorado — com um único FDE (Forward Deployed Engineer) garantindo julgamento humano onde a ambiguidade exige.

O projeto usa OpenSpec para impor um processo spec-driven (SDD/SPDD). Este repo é o **runtime da squad**: um grafo LangGraph que orquestra os agentes.

## Architecture

A squad é um **grafo LangGraph** (Graph Engineering) que orquestra agentes que operam o ciclo de vida de Open Finance. Cada agente é um nó do grafo; o loop intra-agente de tool-calling (Loop Engineering) roda dentro de cada nó. O checkpointer do grafo é o **board**.

### Camadas

1. **Grafo (orquestração)** — LangGraph: nós (agentes), arestas, arestas condicionais, checkpoints
2. **Agentes** — Intake, Feature (backend/frontend), Platform, Review, Architecture, SRE
3. **Gates** — HITL gate (FDE aprova) e Eval gate (PromptFoo)
4. **Portas (hexagonal leve)** — LLMProviderPort, ToolExecutionPort (MCP), PersistencePort (checkpointer), NotificationPort (POST /resume)
5. **Observabilidade** — LangSmith (tracing agêntico) + OTel (infra/métricas)

### Tech Stack

- **Linguagem**: Python 3.12+
- **Orquestração**: LangGraph
- **Observabilidade/avaliação**: LangSmith + OTel
- **Gestor de dependências**: Poetry
- **Checkpointer (board)**: SqliteSaver/InMemorySaver (dev), PostgresSaver (prod)
- **HITL**: interrupt() nativo + Redis/SSE (notificação) + POST /resume (ponte)
- **API**: FastAPI (`api/`)
- **Console do FDE**: Next.js + TypeScript + Tailwind v4 + shadcn/ui (`frontend/`)

## Conventions

- Use o workflow OpenSpec para todo trabalho de feature.
- Defina specs antes da implementação.
- Novas features devem começar com um Feature Intake Brief sob `docs/sdd/feature-intakes/`.
- Rode safe analysis antes de `/opsx:propose`.
- Não implemente código durante o passo de propose.
- Quebre tasks em chunks de no máximo 2 horas.
- Siga conventional commits.
- Mantenha PII mascarada na fronteira de entrada (Intake), ancorada em LGPD/FAPI-BR.
- Mantenha exemplos sintéticos ou anonimizados.

## Feature intake process

Antes de criar um novo OpenSpec change, a intenção da feature deve ser documentada em:

```txt
docs/sdd/feature-intakes/<feature-name>.md
```

O Feature Intake Brief deve ser criado a partir de:

```txt
docs/sdd/feature-intake-template.md
```

O processo de início de feature está documentado em:

```txt
docs/sdd/feature-start-playbook.md
```

### Fluxo requerido

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

### Safe analysis

Antes de `/opsx:propose`, o OpenCode deve inspecionar o repositório e o Feature Intake Brief sem modificar arquivos.

A análise deve retornar:

1. Entendimento da feature proposta
2. Capacidades atuais do repositório que já suportam a feature
3. Arquivos existentes relevantes
4. Gaps a serem endereçados
5. Riscos e ambiguidades
6. Estrutura sugerida do OpenSpec change
7. Ajustes de escopo sugeridos, se houver
8. Critérios de aceite sugeridos
9. Breakdown de tasks sugerido
10. Recomendação sobre se é seguro rodar `/opsx:propose`

### Propose rules

Ao rodar:

```txt
/opsx:propose <feature-name>
```

O agente deve:

- usar o briefing de `docs/sdd/feature-intakes/<feature-name>.md`;
- criar apenas artefatos OpenSpec;
- não implementar código-fonte;
- não mudar comportamento de runtime;
- manter escopo alinhado ao Feature Intake Brief;
- parar após criar proposal, design, specs e tasks.

## OpenSpec structure

Estrutura recomendada:

```txt
openspec/
├── changes/
├── archive/
├── specs/
├── config.yaml
└── project.md
```

Regras:

- `openspec/changes/` contém apenas changes ativos.
- `openspec/archive/` contém changes concluídos.
- Não use `openspec/changes/archive/`.
- `openspec/specs/` contém capacidades atuais/canônicas do sistema.
- Decisões de arquitetura são registradas como ADRs em `docs/adr/` (convenção Nygard).

## Domain

Operação do ciclo de vida de Open Finance: normas regulatórias, demandas de cliente, decisões estratégicas e sinais de produção (SRE), levadas do board ao deploy monitorado.

## Current recommended next feature

```txt
fde-console
```

Expected briefing location:

```txt
docs/sdd/feature-intakes/fde-console.md
```

Feature intention:

Console do FDE (painel de operação da squad): camada de API FastAPI (`api/`) + console web Next.js (`frontend/`) para ver o board, aprovar/rejeitar no HITL, injetar demanda manualmente e auditar/corrigir a heurística do Intake. Change ativo em `openspec/changes/fde-console/` (37/37 tasks concluídas, aguardando archive).

Out of scope para esta feature:

- Autenticação externa (OIDC) — auth mockada no MVP
- Streaming real (SSE/WebSocket) — polling no MVP
- RAG/vector database
- Infra Postgres/Redis em produção (dev usa Sqlite/InMemory)
- Dados reais de cliente
