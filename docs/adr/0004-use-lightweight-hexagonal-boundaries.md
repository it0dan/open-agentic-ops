# Usar hexagonal leve só nas bordas

## Status

Accepted

## Context

A "lógica de negócio" dos Feature Agents não vive em objetos de domínio — vive no system prompt e nas decisões do LLM (decisão de design já fixada no credit-analysis-agent: sem if/elif Python, tudo no prompt). Clean Architecture completa (entidades, agregados, value objects, DDD tático) pressupõe uma riqueza de domínio que esse tipo de agente propositalmente não tem. Por outro lado, "sem nenhuma abstração" acoplaria o harness ao SDK e ao Redis diretamente, dificultando testes.

## Decision

Adotar **hexagonal leve, só nas bordas reais de troca com o mundo externo**. Formalizar apenas as portas concretas:
- **LLMProviderPort** — troca de modelo/provider sem tocar o harness.
- **ToolExecutionPort** — chamadas MCP.
- **PersistencePort** — checkpointer (Postgres/Redis), trocável.
- **NotificationPort** — o `POST /resume` do HITL assíncrono.

Sem camadas de use-case/domain service — a lógica é prompt-driven por desenho.

## Consequences

- Testabilidade real nos evals (mockar o LLM sem mockar o mundo inteiro).
- Portabilidade de infraestrutura (trocar provider/checkpointer sem reescrever o grafo).
- Evita o cerimonial de Clean Architecture de livro-texto para uma lógica que é prompt-driven.
