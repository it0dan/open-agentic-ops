## 1. Implementação

- [x] 1.1 `loop-stages.ts`: dividir o stage `feature` em `feature_backend` e `feature_frontend` (worktrees paralelos), mantendo labels/agentes/eventos coerentes.
- [x] 1.2 `loop-canvas.tsx`: montar nós e arestas com a topologia real — fan-out (`intake → feature_backend`, `intake → feature_frontend`), fan-in (`feature_backend → review`, `feature_frontend → review`), linear (`review → hitl → eval → deploy → monitor`) e ciclo (`monitor → intake`, ADR-0010).
- [x] 1.3 `loop-canvas.tsx`: posições padrão com backend/frontend em paralelo (y distinto) e aresta de fechamento com curva.

## 2. Validação

- [x] 2.1 `npm run lint` limpo.
- [x] 2.2 `npm run build` OK.
- [x] 2.3 `npm test` verde (dashboard/LoopStatus continua funcional).
