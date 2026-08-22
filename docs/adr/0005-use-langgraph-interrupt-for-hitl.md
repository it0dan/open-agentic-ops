# Usar interrupt() do LangGraph para o HITL

## Status

Accepted

## Context

O design original usava HITL assíncrono Redis+SSE com `POST /resume` (padrão do credit-analysis-agent). O LangGraph tem `interrupt()` nativo para human-in-the-loop, com retomada via `Command(resume=...)`, persistindo o estado no checkpointer.

## Decision

Usar **`interrupt()` nativo do LangGraph** como mecanismo de pausa/retomada do HITL, e manter **Redis/SSE apenas como canal de notificação** ao FDE (o push que avisa "tem algo esperando aprovação"). O `POST /resume` vira a ponte que injeta a decisão do FDE no grafo via `Command(resume=...)`.

## Consequences

- Mecânica de pausa/retomada idiomática e com estado no checkpointer (menos código que o Redis+SSE artesanal).
- O FDE não precisa fazer polling — recebe notificação push.
- O `POST /resume` externo continua existindo como ponte para o FDE aprovar de fora.
- Preserva o melhor dos dois: robustez do interrupt + push assíncrono.
