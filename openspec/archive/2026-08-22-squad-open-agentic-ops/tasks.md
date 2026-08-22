# Tasks — Squad Open Agentic Ops

Decomposição do `spec.md` em tarefas executáveis. Sequência sugerida respeita dependências (scaffold → portas → nós → gates → integração). Cada tarefa referencia os requisitos que satisfaz.

## 1. Scaffold do projeto Python (Poetry)

- [x] 1.1 Criar `pyproject.toml` com Poetry; dependências: `langgraph`, `langchain`, `langsmith`, `opentelemetry-sdk`, `opentelemetry-exporter-otlp-proto-grpc`, `opentelemetry-instrumentation-httpx`, `python-dotenv`, `httpx`. (Satisfaz RNF-3)
- [x] 1.2 Criar estrutura de pastas: `src/` (pacote), `tests/`, `evals/`. (Satisfaz RNF-3)
- [x] 1.3 Criar `.env.example` com as variáveis (sem secrets): `AI_GATEWAY_OAUTH_ENDPOINT`, `AI_GATEWAY_CLIENT_ID`, `AI_GATEWAY_CLIENT_SECRET`, `LANGSMITH_API_KEY`, `LANGSMITH_TRACING`, `LANGSMITH_PROJECT`, `DATABASE_URL`, `REDIS_URL`. (Satisfaz RNF-3)

## 2. Portas (hexagonal leve)

- [x] 2.1 Implementar `LLMProviderPort` (troca de modelo/provider sem tocar o harness). (Satisfaz RNF-3, ADR-0004)
- [x] 2.2 Implementar `ToolExecutionPort` (chamadas MCP). (Satisfaz RNF-3, ADR-0004)
- [x] 2.3 Implementar `PersistencePort` (checkpointer). (Satisfaz RNF-3, ADR-0004)
- [x] 2.4 Implementar `NotificationPort` (`POST /resume`). (Satisfaz RNF-3, ADR-0004)

## 3. Modelo de estado do board

- [x] 3.1 Definir o schema tipado do estado (origem, ambiguidade, spec, status, domino, worktrees, feedback_review, adrs, pii_masked, decisao_hitl, resultado_eval) com reducers de append. (Satisfaz RF-8.1, ADR-0002)

## 4. Persistência (checkpointer = board)

- [x] 4.1 Implementar dev com `SqliteSaver`/`InMemorySaver`; interface para `PostgresSaver` em prod. (Satisfaz RF-8.1, RF-8.3)
- [x] 4.2 Implementar view para o FDE consultar demandas pendentes (`get_state`/`get_state_history`). (Satisfaz RF-8.2)

## 5. Redação PII na fronteira (Intake)

- [x] 5.1 Implementar skill `pii-sanitizer` como guia + módulo de redação determinístico (regex + classificação LGPD/FAPI-BR). (Satisfaz RF-1.2, RNF-1, ADR-0006/0012)
- [x] 5.2 Implementar sanitização de payloads para telemetria/checkpointer. (Satisfaz RF-1.2, RNF-1, ADR-0006/0012)

## 6. Nó Intake

- [x] 6.1 Classificar `dominio` e `ambiguidade`; rascunhar spec em baixa ambiguidade; escalar ao FDE em alta. (Satisfaz RF-1.1, RF-1.3, RF-1.4, RF-1.5)

## 7. Nó Feature (genérico, parametrizado por Guia)

- [x] 7.1 Nó único que carrega a skill (Guia) e roda o loop de implementação no worktree. (Satisfaz RF-3.1, RF-3.2, ADR-0011)

## 8. Nó Platform (MCP)

- [x] 8.1 Ferramentas de testes, lint, deploy, observabilidade como serviço. (Satisfaz RF-3.3)

## 9. Nó Architecture (A2A)

- [x] 9.1 Discussão síncrona em contrato externo/compliance; registra ADR; aconselha sem vetar. (Satisfaz RF-3.4, RF-4.2)

## 10. Nó Review (A2A)

- [x] 10.1 Feedback de PR; orienta sem bloquear; discordância de classificação → escala ao FDE. (Satisfaz RF-4.1, RF-4.2)

## 11. HITL gate

- [x] 11.1 `interrupt()` + `Command(resume=...)`; notificação Redis/SSE; `POST /resume` como ponte. (Satisfaz RF-5.1, RF-5.2, RF-5.3, ADR-0005/0009)

## 12. Eval gate

- [x] 12.1 Portar `run_all_evals.sh`; configs PromptFoo por nó; integração LangSmith. (Satisfaz RF-6.1, RF-6.2, ADR-0013)

## 13. Nó SRE e loop de fechamento

- [x] 13.1 Monitorar SLOs/error budget; gerar task que realimenta o Intake como 4ª origem. (Satisfaz RF-7.1, RF-7.2, ADR-0010)

## 14. Montagem do grafo (arestas e arestas condicionais)

- [x] 14.1 Encadear nós; branch de ambiguidade; fan-out/fan-in dos worktrees; loop SRE→Intake. (Satisfaz RF-3.1, RF-4, RF-7.2)

## 15. Observabilidade

- [x] 15.1 LangSmith (tracing agêntico) + OTel (infra/métricas); sanitização de PII. (Satisfaz RF-9.1, RF-9.2, ADR-0008)

## 16. Testes e validação

- [x] 16.1 Testes unitários por nó/porta; teste de integração do grafo (fluxo completo do caso-âncora). (Satisfaz RNF-4, RNF-5)
- [x] 16.2 Rodar lint e testes antes de concluir. (Satisfaz RNF-4, RNF-5)

## Dependências

- 1.x → todas.
- 2.x, 3.x → 4.x, 5.x, 6.x.
- 4.x → 11.x (HITL precisa de checkpointer).
- 5.x → 6.x.
- 6.x, 7.x, 8.x, 9.x, 10.x → 14.x.
- 11.x, 12.x → 14.x.
- 13.x → 14.x.
- 14.x, 15.x → 16.x.
