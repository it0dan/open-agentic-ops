## Context

O `loop-canvas.tsx` monta as arestas sempre de forma sequencial (`source: stages[i].id, target: stages[i+1].id`), representando uma topologia linear. A arquitetura real (ARCHITECTURE.md) tem fan-out/fan-in dos worktrees backend/frontend em paralelo e a aresta de fechamento SRE→Intake (ADR-0010). O `montarStages` (`loop-stages.ts`) retorna stages com ids `intake, feature, review, hitl, eval, deploy, monitor`.

O `LoopStatus` (dashboard) itera a lista de stages linearmente sem depender de ids específicos — dividir `feature` em `feature_backend`/`feature_frontend` não o quebra.

## Goals / Non-Goals

**Goals:**
- Representar no `/graph` o fan-out/fan-in dos worktrees backend/frontend.
- Representar a aresta de fechamento SRE→Intake (ADR-0010).
- Manter o dashboard (`LoopStatus`) funcionando com a nova lista de stages.
- Manter o `/graph` legível (evitar cruzamento excessivo de arestas).

**Non-Goals:**
- Mudanças no runtime Python (grafo LangGraph).
- Representar `platform_node`/`architecture_node` como nós separados (implícito no fluxo).
- Alterações de comportamento de UI já validado (drawer do agente, HITL, eval).
- Multi-tenancy (ADR-0015).

## Decisions

**D1 — Dividir `feature` em `feature_backend`/`feature_frontend` no `montarStages`.**
Em vez de um único stage `feature`, retornar dois stages paralelos. O `LoopStatus` (dashboard) itera a lista sem depender de ids, então continua funcionando. Alternativa: manter `feature` único e derivar o fan-out só no canvas — mais complexo e menos fiel aos dados.

**D2 — Codificar a topologia real no `loop-canvas.tsx` por ids de stage.**
O canvas conhece a topologia da squad e monta nós/arestas explicitamente:
- Fan-out: `intake → feature_backend`, `intake → feature_frontend`.
- Fan-in: `feature_backend → review`, `feature_frontend → review`.
- Linear: `review → hitl → eval → deploy → monitor`.
- Ciclo: `monitor → intake` (SRE→Intake, ADR-0010).
Alternativa: algoritmo de layout automático — mais genérico, porém menos previsível e com risco de cruzamento de arestas.

**D3 — Posições padrão com paralelismo.**
`feature_backend` e `feature_frontend` em y distinto (paralelos), demais nós em linha. A aresta de fechamento `monitor → intake` usa curva para não poluir o grafo. Nós continuam arrastáveis com persistência em `localStorage` (comportamento existente preservado).

## Risks / Trade-offs

- [Dividir `feature` afeta o dashboard] → `LoopStatus` itera a lista sem depender de ids; verificado que não quebra.
- [Ciclo SRE→Intake polui o grafo] → Aresta com curva e posição de `monitor`/`intake` pensada para minimizar cruzamento.
- [Posições padrão sobrepõem nós] → Backend/frontend em y distinto; nós arrastáveis permitem ajuste manual.
