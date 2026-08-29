## Grupo 1 — Matriz de autonomia (D28/D29)

- [x] 1.1 Criar `src/open_agentic_ops/autonomia.py` com `Autonomia`, `MATRIZ_AUTONOMIA` e `autonomia_da_etapa`.
- [x] 1.2 Incluir `deploy` na matriz (correção da inconsistência do `hitl_deploy`).

## Grupo 2 — Gate HITL por etapa (D27)

- [x] 2.1 `make_hitl_gate(etapa, autonomia)` — `humano` pausa via `interrupt()`, `autonomo` não pausa, `llm_judge` aprova via fallback.

## Grupo 3 — Grafo com gates por etapa

- [x] 3.1 Nós `hitl_intake`, `hitl_feature`, `hitl_platform`, `hitl_review`, `hitl_architecture`, `hitl_deploy`, `hitl_sre` no grafo, criados com `autonomia_da_etapa`.

## Grupo 4 — API e console

- [x] 4.1 `_etapa_pendente` em `api/main.py` + `aguardando_etapa` nos endpoints.
- [x] 4.2 Painel HITL por etapa + aba "Raciocínio" no console.
- [x] 4.3 `aguardando_etapa` no mock do frontend.

## Grupo 5 — Testes

- [x] 5.1 Atualizar `tests/test_graph.py`, `tests/test_api.py`, `tests/test_llm_wire.py`, `tests/test_review_discordancia.py` para o fluxo de múltiplos gates.
- [x] 5.2 Criar `tests/test_autonomia.py` (matriz, humano pausa, autônomo não pausa, llm_judge fallback, grafo autônomo/humano).
- [x] 5.3 `poetry run pytest` verde; `poetry run ruff check .` limpo.
- [x] 5.4 `npm run lint`, `npm test`, `npm run build` verdes.

## Grupo 6 — Docs e arquivamento

- [x] 6.1 Criar ADR-0025 (HITL por etapa e matriz de autonomia).
- [x] 6.2 Criar Feature Intake Brief `docs/sdd/feature-intakes/hitl-por-etapa.md`.
- [x] 6.3 Atualizar `HANDOFF.md`.
- [ ] 6.4 Arquivar o change `hitl-por-etapa` em `openspec/archive/`.
- [ ] 6.5 Commits coesos + push (após confirmação).
