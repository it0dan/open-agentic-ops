# Spec — Squad Open Agentic Ops

Especificação funcional e de comportamento do grafo LangGraph que orquestra a squad. Deriva do `design.md` e do `proposal.md` (OpenSpec/SPDD). Define requisitos verificáveis por nó, gate e fronteira — a base para `tasks.md` e `prompt.md`.

## 1. Requisitos funcionais

### RF-1 — Intake (triagem e fronteira de PII)
- **RF-1.1** O `intake_node` recebe itens das 4 origens: `cliente`, `regulatorio`, `estrategia`, `sre`.
- **RF-1.2** O Intake mascara PII na fronteira de entrada, ancorado em classificação LGPD (dado pessoal vs. sensível) e informado pelo FAPI-BR. PII raw nunca entra no sistema (ADR-0006).
- **RF-1.3** O Intake classifica `dominio` (backend/frontend/ambos) e `ambiguidade` (baixa/alta).
- **RF-1.4** Baixa ambiguidade + precedente → o Intake rascunha a spec (`spec_autor=intake`).
- **RF-1.5** Alta ambiguidade → o grafo escala ao FDE para autoria da spec (`spec_autor=fde`).

### RF-2 — Autoria de spec pelo FDE
- **RF-2.1** Em alta ambiguidade, o FDE autora a spec em `openspec/` e a injeta no grafo via `POST /resume` (ADR-0009).
- **RF-2.2** A spec re-entra no grafo a partir do ponto pausado, sem reiniciar o estado (checkpointer).

### RF-3 — Implementação em worktrees paralelos
- **RF-3.1** A spec pronta dispara fan-out de 2 worktrees paralelos (backend e frontend), cada um com uma instância do `feature_node` parametrizada pelo Guia (ADR-0011).
- **RF-3.2** Cada worktree roda seu loop de implementação e converge num fan-in antes da revisão.
- **RF-3.3** O `feature_node` aciona o `platform_node` (MCP) para testes/lint/deploy.
- **RF-3.4** Se o trabalho tocar contrato de API externo/compliance, o `feature_node` aciona o `architecture_node` (A2A), que registra ADR e aconselha sem vetar.

### RF-4 — Revisão
- **RF-4.1** O `review_node` (A2A) dá feedback de PR contra padrões do time; orienta, não bloqueia.
- **RF-4.2** Se o `review_node` ou `architecture_node` discordar da classificação do Intake **em andamento**, pausa e escala ao FDE (sem hierarquia de severidade).

### RF-5 — HITL gate
- **RF-5.1** O `hitl_gate` usa `interrupt()` nativo do LangGraph; nenhum merge ocorre sem aprovação humana do FDE (ADR-0005).
- **RF-5.2** O FDE é notificado via Redis/SSE (push) e aprova/rejeita via `POST /resume`.
- **RF-5.3** O payload do `interrupt()` é JSON-serializable e sem PII raw.

### RF-6 — Eval gate
- **RF-6.1** O `eval_gate` roda trajectory eval (PromptFoo) como condição não-negociável antes do deploy (ADR-0013).
- **RF-6.2** O eval integra com LangSmith como plataforma de avaliação.

### RF-7 — SRE e loop de fechamento
- **RF-7.1** O `sre_node` monitora SLOs/error budget em produção.
- **RF-7.2** O SRE gera task que realimenta o board como 4ª origem, **passando pelo Intake** (ADR-0010).

### RF-8 — Board e persistência
- **RF-8.1** O checkpointer é o board; cada item de demanda = um `thread_id` (ADR-0002).
- **RF-8.2** O board provê view para o FDE consultar demandas pendentes.
- **RF-8.3** Dev usa `SqliteSaver`/`InMemorySaver`; prod usa `PostgresSaver` + Redis.

### RF-9 — Observabilidade
- **RF-9.1** LangSmith para tracing/avaliação agêntica; OTel para infra/métricas (ADR-0008).
- **RF-9.2** Payloads de PII sanitizados antes de chegar à telemetria.

## 2. Requisitos não-funcionais

- **RNF-1 (Segurança/PII):** PII mascarada em todas as fronteiras — comunicação, checkpointer, telemetria, evals, logs. PII raw nunca entra no sistema.
- **RNF-2 (Topologia):** 6 agentes + 2 gates; protocolo definido pelo modo de interação (MCP para X-as-a-Service; A2A para Collaboration/Facilitating).
- **RNF-3 (Stack):** tudo Python + LangGraph + LangSmith; hexagonal leve só nas bordas.
- **RNF-4 (Qualidade):** sem QA Agent separado — qualidade é propriedade do harness (Sensores + Eval gate).
- **RNF-5 (Human-in-the-loop):** nenhum merge sem humano na cadeia (FDE no HITL gate), inclusive specs autoradas só pelo Intake.
- **RNF-6 (Auditoria):** correção de auditoria do FDE é sempre prospectiva — nunca reabre implementação já feita.

## 3. Critérios de aceite (por requisito)

| Requisito | Critério de aceite |
|---|---|
| RF-1.2 | Item com PII entra mascarado; nenhum payload com PII raw persiste no checkpointer nem chega à telemetria |
| RF-1.4/1.5 | Item baixa-ambiguidade segue sem FDE na autoria; item alta-ambiguidade pausa e escala ao FDE |
| RF-2.1 | Spec do FDE re-entra via `POST /resume` e o grafo continua do ponto pausado |
| RF-3.1 | Fan-out gera 2 worktrees paralelos com Guias distintos; fan-in converge antes da revisão |
| RF-3.4 | Contrato externo/compliance aciona `architecture_node`; ADR registrado; decisão fica com o Feature Agent |
| RF-4.2 | Discordância de classificação em andamento pausa e escala ao FDE |
| RF-5.1 | Merge bloqueado até aprovação do FDE via `POST /resume` |
| RF-6.1 | Deploy bloqueado se o trajectory eval (PromptFoo) falhar |
| RF-7.2 | Task do SRE passa pelo Intake (mesma triagem das outras origens) |
| RF-8.1 | Estado persiste entre pausas/retomadas por `thread_id` |
| RF-9.2 | Telemetria sem PII raw |

## 4. Fora de escopo (non-goals)

- Não criar board separado (o checkpointer é o board).
- Não usar Clean Architecture completa/DDD tático (lógica prompt-driven).
- Não misturar TypeScript no runtime (stack tudo-Python).
- Não criar QA Agent separado.
- Não provisionar infra Postgres/Redis nesta etapa (dev usa Sqlite/InMemory).

## 5. Referências

- Proposal: `openspec/changes/squad-open-agentic-ops/proposal.md`.
- Design: `openspec/changes/squad-open-agentic-ops/design.md`.
- Arquitetura: `Inicio/sensedia-open-agentic-ops.md`, `ARCHITECTURE.md`.
- Glossário: `CONTEXT.md`.
- Decisões: `docs/adr/` (0001–0013).
