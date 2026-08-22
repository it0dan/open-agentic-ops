# Prompt — Squad Open Agentic Ops

Instruções de implementação para o agente executor, derivadas do `spec.md` e `tasks.md` (OpenSpec/SPDD). Este documento orienta a implementação do grafo LangGraph da squad.

## Missão

Implementar o grafo LangGraph que orquestra a squad Open Agentic Ops, conforme `design.md` e `spec.md`. Seguir estritamente as decisões dos ADRs em `docs/adr/`. Não reabrir decisões de design sem motivo forte.

## Regras de implementação

1. **Stack:** tudo Python + LangGraph + LangSmith. Sem TypeScript no runtime.
2. **Hexagonal leve só nas bordas:** formalizar apenas `LLMProviderPort`, `ToolExecutionPort` (MCP), `PersistencePort` (checkpointer), `NotificationPort` (`POST /resume`). Sem camadas de use-case/domain service — a lógica é prompt-driven.
3. **Checkpointer = board:** cada item de demanda = um `thread_id`. Dev usa `SqliteSaver`/`InMemorySaver`; prod usa `PostgresSaver` + Redis.
4. **HITL:** usar `interrupt()` nativo + `Command(resume=...)`. `POST /resume` é a ponte externa. Payload JSON-serializable e sem PII raw.
5. **PII:** mascarar na fronteira de entrada (Intake), ancorado em LGPD/FAPI-BR. PII raw nunca entra no sistema — aplicar em comunicação, checkpointer, telemetria, evals e logs.
6. **Protocolos:** MCP para X-as-a-Service (Intake, Platform, SRE); A2A (HTTP) para Collaboration/Facilitating (Architecture, Review).
7. **Feature Agent:** nó genérico parametrizado por Guia (skill) — não criar nós distintos por domínio.
8. **Sem QA Agent separado:** qualidade é propriedade do harness (Sensores + Eval gate).
9. **Eval gate:** portar `run_all_evals.sh` do credit-analysis-agent; integrar com LangSmith.
10. **Sem comentários não solicitados no código.**

## Ordem de execução (tasks.md)

Seguir a sequência T1 → T16, respeitando as dependências declaradas. Concluir cada tarefa antes de avançar.

## Critérios de pronto

- Todos os requisitos funcionais (RF-1..RF-9) e não-funcionais (RNF-1..RNF-6) do `spec.md` atendidos.
- Critérios de aceite da tabela do `spec.md` verificados.
- Lint e testes passando.
- Fluxo completo do caso-âncora (Instrução Normativa do BCB → deploy monitorado) validado em teste de integração.

## Referências

- Proposal: `proposal.md`. Design: `design.md`. Spec: `spec.md`. Tasks: `tasks.md`.
- Arquitetura: `Inicio/sensedia-open-agentic-ops.md`, `ARCHITECTURE.md`.
- Glossário: `CONTEXT.md`.
- Decisões: `docs/adr/` (0001–0013).
- Padrões de reaproveitamento: `~/agentic/credit-analysis-agent` (gateway_auth, otel_setup, run_all_evals.sh).
