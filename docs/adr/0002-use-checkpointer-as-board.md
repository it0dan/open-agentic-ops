# Usar o checkpointer do LangGraph como board

## Status

Accepted

## Context

O handoff previa um "board de tarefas" separado (JSON/YAML lido pelo orquestrador) para representar as demandas. Com LangGraph como orquestrador único, o grafo já persiste o estado de cada execução via checkpointer (Postgres/Redis), incluindo origem, ambiguidade, spec e status.

## Decision

O **checkpointer do LangGraph é o board** — não criamos um board separado. O estado do grafo (por thread_id) é a fonte de verdade de cada demanda. Se o FDE precisar de uma visão "board-like", projetamos uma view/query sobre o estado, não um sistema paralelo.

## Consequences

- Menos código e mais robustez (estado transacional e retomável no checkpointer).
- O board herda as capacidades do checkpointer (persistência, replay, retomada).
- Necessário projetar uma view/consulta para o FDE visualizar as demandas pendentes.
