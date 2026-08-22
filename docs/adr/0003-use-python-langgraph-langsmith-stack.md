# Usar stack tudo-Python com LangGraph e LangSmith

## Status

Accepted

## Context

O handoff original previa um híbrido: Python no core (credit-analysis-agent) e TypeScript/Fastify para Review/Architecture (fork do compliance-agent). Isso criaria uma fronteira de linguagem entre agentes, exigindo contratos de interface (REST/gRPC) entre runtimes. O mercado em 2026 consolida LangGraph como padrão de fato para orquestração multiagente stateful (1.0 GA em out/2025) e LangSmith para observabilidade/avaliação.

## Decision

Adotar **tudo em Python + LangGraph + LangSmith**. Orquestrador único, sem fronteira de linguagem entre agentes. Review Agent e Architecture Agent são nós Python/LangGraph (A2A via HTTP), não forks do compliance-agent TS. LangSmith para tracing agêntico e avaliação; OTel para infra/métricas (ver ADR-0008).

## Consequences

- Elimina a complexidade de contrato de interface entre runtimes do híbrido.
- O fork TS do compliance-agent é descartado (item 4 do handoff).
- Reaproveita o padrão Python do credit-analysis-agent (JWT, OTel, evals).
- Dependência do ecossistema LangChain/LangGraph/LangSmith.
