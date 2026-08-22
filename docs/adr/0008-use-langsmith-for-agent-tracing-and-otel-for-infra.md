# Usar LangSmith para tracing agêntico e OTel para infra/métricas

## Status

Accepted

## Context

O credit-analysis-agent usa OTel/W3C traceparent para tracing. LangSmith tem tracing próprio e integra com PromptFoo. Sem decisão, haveria risco de duplicar telemetria agêntica em dois lugares.

## Decision

Usar **LangSmith como camada principal de tracing/avaliação da squad** (traces dos nós, runs, integração com evals PromptFoo) e manter **OTel apenas para a camada de infra/métricas** (resource, spans de infraestrutura, export OTLP se houver collector). Não duplicar tracing agêntico em dois sistemas.

## Consequences

- Valor de observabilidade agêntica concentrado no LangSmith (ver cada nó, tool call, run do LLM).
- Investimento OTel existente preservado para infra/métricas, sem sobreposição.
- Payloads de PII devem ser sanitizados antes de chegar ao LangSmith/OTel (ver ADR-0006).
