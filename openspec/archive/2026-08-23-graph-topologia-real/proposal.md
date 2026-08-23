## Why

O console do FDE (`/graph`) é a janela visual da topologia da squad, mas hoje mostra um fluxo linear simplificado. A arquitetura real do grafo LangGraph (ARCHITECTURE.md) tem fan-out/fan-in dos worktrees backend/frontend em paralelo e a aresta de fechamento SRE→Intake (ADR-0010) — elementos que o FDE precisa enxergar para operar a squad com fidelidade. Esta rodada implementa a decisão pendente registrada em `docs/sdd/feature-intakes/graph-topologia-real.md`.

## What Changes

- `montarStages` (`loop-stages.ts`): dividir o stage `feature` em `feature_backend` e `feature_frontend` (worktrees paralelos).
- `loop-canvas.tsx`: montar nós e arestas com a topologia real — fan-out (`intake → feature_backend`, `intake → feature_frontend`), fan-in (`feature_backend → review`, `feature_frontend → review`), fluxo linear (`review → hitl → eval → deploy → monitor`) e ciclo (`monitor → intake`, ADR-0010).
- Posições padrão: backend e frontend em paralelo (y distinto), demais nós em linha.

## Capabilities

### New Capabilities
- `graph-topologia-real`: representação visual da topologia real do grafo no `/graph` (fan-out/fan-in dos worktrees + aresta de fechamento SRE→Intake).

### Modified Capabilities
<!-- Nenhuma spec existente muda de comportamento. -->

## Impact

- `frontend/lib/loop-stages.ts` — stages com `feature_backend`/`feature_frontend`.
- `frontend/components/loop-canvas.tsx` — topologia real (fan-out/fan-in + ciclo SRE→Intake).
- `frontend/components/loop-status.tsx` — consumidor do tipo `LoopStage` (dashboard); deve continuar funcionando.
- Sem mudanças no runtime Python, API pública, dependências ou backend.
