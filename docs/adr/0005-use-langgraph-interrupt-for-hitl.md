# Usar interrupt() do LangGraph para o HITL

## Status

Accepted

## Context

O design original usava HITL assíncrono Redis+SSE com `POST /resume` (padrão do credit-analysis-agent). O LangGraph tem `interrupt()` nativo para human-in-the-loop, com retomada via `Command(resume=...)`, persistindo o estado no checkpointer.

## Decision

Usar **`interrupt()` nativo do LangGraph** como mecanismo de pausa/retomada do HITL. O `POST /resume` vira a ponte que injeta a decisão do FDE no grafo via `Command(resume=...)`.

### Superado (2026-08-23): notificação por polling, não push

A parte de **notificação push via Redis/SSE** foi **formalmente superada**. A implementação real (ADR-0014) usa **polling de ~4s** no console do FDE para detectar itens aguardando ação; streaming real (SSE/WebSocket) fica como evolução futura no backend. A mecânica de `interrupt()`/`Command(resume=...)` permanece válida — só o canal de notificação mudou de push para polling.

## Consequences

- Mecânica de pausa/retomada idiomática e com estado no checkpointer (menos código que o Redis+SSE artesanal).
- ~~O FDE não precisa fazer polling — recebe notificação push.~~ **Superado:** o FDE faz polling (~4s) no MVP; push Redis/SSE é evolução futura.
- O `POST /resume` externo continua existindo como ponte para o FDE aprovar de fora.
- Preserva o melhor dos dois: robustez do interrupt + polling simples no MVP.
