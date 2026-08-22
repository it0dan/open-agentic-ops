# Design — Squad Open Agentic Ops

Detalhamento arquitetural do grafo LangGraph que orquestra a squad. Segue o `proposal.md` (OpenSpec/SPDD) e consolida as decisões dos ADRs em `docs/adr/`. Este documento descreve a estrutura do grafo — nós, arestas, estado, portas e contratos — sem entrar em implementação de código.

## 1. Visão geral

A squad é um **grafo LangGraph** (Graph Engineering) que orquestra agentes que operam o ciclo de vida de Open Finance. Cada agente é um nó do grafo; o loop intra-agente de tool-calling (Loop Engineering) roda dentro de cada nó. O checkpointer do grafo é o **board** (ADR-0002). Um único FDE (humano) é o ponto de julgamento onde a ambiguidade exige.

O grafo é um **supervisor único** (ADR-0001): um `StateGraph` que encadeia os nós e usa arestas condicionais para ramificar por ambiguidade e fazer fan-out/fan-in dos worktrees paralelos.

## 2. Modelo de estado (board)

O estado do grafo é o board. Cada execução do grafo corresponde a **um item de demanda** e é identificada por um `thread_id` (ADR-0002). O estado é um schema tipado com os seguintes campos:

| Campo | Tipo | Descrição |
|---|---|---|
| `origem` | enum | Uma das 4 origens: `cliente`, `regulatorio`, `estrategia`, `sre` |
| `ambiguidade` | enum | `baixa` ou `alta`, atribuído pelo Intake |
| `spec_autor` | enum | `intake` ou `fde` — quem autorou a spec |
| `spec` | string | Texto da spec aprovada (SDD/SPDD) |
| `status` | enum | Progresso do item no ciclo (ex.: `triado`, `spec_pronta`, `em_implementacao`, `em_revisao`, `aguardando_hitl`, `aprovado`, `em_eval`, `deployado`, `monitorado`) |
| `domino` | enum | `backend`, `frontend` ou ambos — derivado da classificação do Intake |
| `worktrees` | lista | Worktrees paralelos (backend/frontend) com seus respectivos estados |
| `feedback_review` | lista (accumulate) | Feedback do Review Agent por worktree |
| `adrs` | lista (accumulate) | ADRs registrados pelo Architecture Agent |
| `pii_masked` | boolean | Indica que a PII foi mascarada na fronteira de entrada |
| `decisao_hitl` | objeto | Decisão do FDE no HITL gate (aprovado/rejeitado + comentário) |
| `resultado_eval` | objeto | Resultado do Eval gate (PromptFoo) |

Campos acumulativos (`feedback_review`, `adrs`) usam reducers de append para acumular contribuições de múltiplos nós/worktrees.

## 3. Nós do grafo

| Nó | Tipo (Team Topologies) | Protocolo | Responsabilidade |
|---|---|---|---|
| `intake_node` | Platform (extensão) | MCP | Recebe as 4 origens, mascara PII na fronteira (ADR-0006/0012), classifica domínio e ambiguidade. Baixa + precedente → rascunha spec; alta → escala ao FDE |
| `feature_node` | Stream-aligned | — | Nó genérico parametrizado por Guia (skill) — backend/frontend (ADR-0011). Roda o loop de implementação no worktree |
| `platform_node` | Platform | MCP | Testes, lint, deploy, observabilidade como serviço — instância única, agnóstica de stack |
| `review_node` | Enabling | A2A | Feedback de PR contra padrões do time; orienta, não bloqueia. Discordância de classificação → pausa e escala ao FDE |
| `architecture_node` | Complicated-subsystem | A2A | Discussão síncrona em contrato de API externo/compliance; registra ADR; aconselha, não veta. Discordância de classificação → pausa e escala ao FDE |
| `sre_node` | Platform (extensão) | MCP | Monitora SLOs/error budget; gera task que realimenta o board como 4ª origem, passando pelo Intake (ADR-0010) |
| `hitl_gate` | processo | — | `interrupt()` → FDE aprova via `POST /resume` (ADR-0005) |
| `eval_gate` | processo | — | PromptFoo trajectory eval antes do deploy (ADR-0013) |

## 4. Arestas e arestas condicionais

```
[4 origens] ──▶ intake_node ──classifica ambiguidade──▶ branch
                     │
                     ├─ baixa ──▶ rascunha_spec (Intake) ──▶ spec_pronta
                     └─ alta ───▶ ESCALA AO FDE (autoria) ──▶ POST /resume ──▶ spec_pronta

spec_pronta ──▶ fan-out (2 worktrees paralelos)
                     ├─ feature_backend (nó genérico, Guia=backend)
                     │     ├─ platform_node (MCP: testes/lint/deploy)
                     │     └─ architecture_node (A2A, se contrato externo/compliance)
                     └─ feature_frontend (nó genérico, Guia=frontend)
                           └─ platform_node (MCP)

fan-in ◀── review_node (A2A, por worktree)
                     │
                     ▼
hitl_gate (interrupt → FDE aprova via POST /resume)
                     ▼
eval_gate (PromptFoo trajectory eval)
                     ▼
sre_node (monitora SLOs/error budget)
                     └──▶ gera task ──▶ intake_node (4ª origem)
```

### Ramificação por ambiguidade
Após o `intake_node`, uma aresta condicional decide o caminho:
- **baixa** → o Intake rascunha a spec e segue direto ao fan-out.
- **alta** → o grafo pausa e escala ao FDE para autoria da spec; a spec re-entra via `POST /resume` (ADR-0009) e segue ao fan-out.

### Fan-out / fan-in dos worktrees
A spec pronta dispara **dois worktrees paralelos** (backend e frontend), cada um rodando uma instância do `feature_node` com seu Guia. Os worktrees convergem num fan-in antes do `review_node`. Cada worktree é um subgrafo com namespace isolado (padrão de persistência para subgrafos paralelos), evitando conflito de checkpoints.

### Loop de fechamento do SRE
O `sre_node` gera uma task que **realimenta o board passando pelo Intake** (ADR-0010) — mesma triagem das outras 3 origens. Fecha o loop pelas duas pontas: Intake = fora→dentro, SRE = dentro→fora que volta a entrar.

## 5. Portas (hexagonal leve — ADR-0004)

Formalizadas apenas as bordas reais de troca com o mundo externo:

| Porta | Uso | Implementação |
|---|---|---|
| `LLMProviderPort` | Troca de modelo/provider sem tocar o harness | Sensedia AI Gateway (JWT) |
| `ToolExecutionPort` | Chamadas MCP (git/SCM, testes, deploy) | MCP |
| `PersistencePort` | Checkpointer (board) | SqliteSaver/InMemorySaver (dev), PostgresSaver (prod) |
| `NotificationPort` | `POST /resume` do HITL | HTTP |

Sem camadas de use-case/domain service — a lógica é prompt-driven por desenho.

## 6. Persistência (board — ADR-0002)

- O **checkpointer é o board**; não há board separado.
- **Dev:** `SqliteSaver` ou `InMemorySaver` (decisão de início de implementação — infra Postgres/Redis ainda não provisionada).
- **Prod:** `PostgresSaver` (checkpointer) + Redis (notificação HITL).
- Cada item de demanda = um `thread_id`; o estado persiste entre pausas/retomadas.
- O board provê a **view para o FDE** consultar demandas pendentes (via `get_state`/`get_state_history`).

## 7. HITL e retomada do FDE (ADR-0005/0009)

- **Mecanismo:** `interrupt()` nativo do LangGraph no `hitl_gate`, com retomada via `Command(resume=...)`. Requer checkpointer e `thread_id`.
- **Notificação:** Redis/SSE apenas como canal de push ao FDE ("tem algo esperando aprovação") — não é bloqueio síncrono.
- **Ponte externa:** `POST /resume` injeta a decisão do FDE no grafo via `Command(resume=...)`.
- **Dois usos da ponte:**
  1. **HITL gate** — aprova/rejeita o merge.
  2. **Autoria de spec** (alta ambiguidade) — o FDE escreve a spec em `openspec/` e a injeta no estado do grafo, que continua o fluxo.
- O payload do `interrupt()` deve ser JSON-serializable e **sem PII raw** (ADR-0006).

## 8. Protocolos (ADR-0007)

O protocolo é definido pelo **modo de interação (Team Topologies)**, não por "quem está do outro lado":

- **X-as-a-Service / trigger** (contrato fixo, pergunta→resposta determinística) → **MCP**: Intake, Platform, SRE.
- **Collaboration / Facilitating** (diálogo aberto, síncrono, ida-e-volta até convergir) → **A2A (HTTP)**: Architecture, Review.
- **Processo/humano** (HITL gate, Eval gate, FDE) → sem protocolo agente-agente.

## 9. PII (ADR-0006/0012)

- **Onde:** mascarada na fronteira de entrada (`intake_node`), ancorada em classificação LGPD (dado pessoal vs. sensível), informada pelo perfil de segurança do Open Finance (FAPI-BR).
- **Como:** combinação de skill `pii-sanitizer` como guia (feedforward) + módulo de redação determinístico como ferramenta (regex + classificação LGPD).
- **Fronteiras cobertas:** comunicação inter-agente, estado do checkpointer, telemetria (LangSmith/OTel), evals (PromptFoo), logs.
- **Regra mais robusta:** PII raw nunca entra no sistema — mascarada na entrada, as demais fronteiras herdam a proteção.

## 10. Observabilidade (ADR-0008)

- **LangSmith:** camada principal de tracing/avaliação agêntica (traces dos nós, runs, integração com evals PromptFoo).
- **OTel:** apenas camada de infra/métricas (resource, spans de infraestrutura, export OTLP).
- **Sem duplicação** de tracing agêntico em dois sistemas.
- Payloads de PII sanitizados antes de chegar ao LangSmith/OTel (ADR-0006).

## 11. Eval gate (ADR-0013)

- Portar o `run_all_evals.sh` do credit-analysis-agent como ponto de partida (renovar token do AI Gateway, rodar configs PromptFoo serializadas, abortar na primeira falha).
- Integrar com **LangSmith** como plataforma de avaliação.
- Condição **não-negociável** antes do deploy.

## 12. Decisões de design abertas (a resolver na implementação)

Estas ficam para a etapa de `spec.md`/implementação, mas são antecipadas aqui:

1. **Schema exato do estado do board** — refinamento dos campos e reducers acima.
2. **Modelagem do fan-out paralelo** — subgrafos por worktree com namespace isolado (padrão de persistência para subgrafos paralelos).
3. **Contrato do `POST /resume`** — payload, endpoints, mapeamento para `Command(resume=...)`.
4. **Contrato dos Guias** — como a skill (SKILL.md) é carregada e injetada no system prompt do `feature_node`.
5. **Interface do `platform_node`** — conjunto de ferramentas MCP expostas (testes, lint, deploy, observabilidade).
6. **Formato da task do SRE** — como a task gerada realimenta o Intake como 4ª origem.

## 13. Referências

- Proposal: `openspec/changes/squad-open-agentic-ops/proposal.md`.
- Arquitetura: `Inicio/sensedia-open-agentic-ops.md`, `Inicio/diagrama-squad-open-agentic-ops-texto.md`.
- Visão estrutural: `ARCHITECTURE.md`.
- Glossário: `CONTEXT.md`.
- Decisões: `docs/adr/` (0001–0013).
