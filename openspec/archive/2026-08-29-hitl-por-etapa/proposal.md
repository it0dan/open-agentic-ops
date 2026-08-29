## Why

O HITL gate original era **único e genérico**: pausava uma vez no fim do fluxo para o FDE aprovar o resultado consolidado. Em um sistema regulado (Open Finance/FAPI-BR), o julgamento humano **por etapa** é mais auditável e reduz o risco de uma decisão binária sobre um pacote grande. Além disso, a oferta prevê evoluir a autonomia das etapas (de HITL total para LLM-as-a-judge e, eventualmente, autonomia plena em etapas de baixo risco) — o que exigiria reescrever o grafo a cada mudança sem um ponto único de configuração.

Este change implementa o **HITL por etapa** com uma **matriz de autonomia declarativa** (ADR-0025): cada etapa do fluxo ganha seu próprio gate HITL, e o nível de autonomia (`humano`/`llm_judge`/`autonomo`) é configurado em um único ponto, sem alterar o grafo.

## What Changes

- **Gate HITL genérico por etapa** (`make_hitl_gate(etapa, autonomia)`) em `src/open_agentic_ops/gates/hitl_gate.py`.
- **Matriz de autonomia** (`MATRIZ_AUTONOMIA` + `autonomia_da_etapa`) em `src/open_agentic_ops/autonomia.py` — ponto único de configuração; default `humano`.
- **Nós por etapa no grafo**: `hitl_intake`, `hitl_feature`, `hitl_platform`, `hitl_review`, `hitl_architecture`, `hitl_deploy`, `hitl_sre`.
- **`aguardando_etapa` na API** (`_etapa_pendente` em `api/main.py`) — expõe a etapa que aguarda decisão.
- **Painel HITL por etapa + aba "Raciocínio"** no console (já implementado no frontend).
- **Testes** de integração/API atualizados para o fluxo de múltiplos gates + testes da matriz de autonomia.

## Capabilities

### New Capabilities
- `hitl-por-etapa`: HITL gate por etapa com matriz de autonomia declarativa — cada etapa pausa via `interrupt()` quando `humano`, prossegue quando `autonomo`, e usa LLM-as-a-judge (fallback determinístico por ora) quando `llm_judge`.

### Modified Capabilities
- `squad-open-agentic-ops`: o fluxo passa a exigir aprovação do FDE em cada etapa (intake, feature, platform, review, deploy, sre), em vez de uma única aprovação no fim.

## Impact

- `src/open_agentic_ops/autonomia.py` — matriz de autonomia (novo).
- `src/open_agentic_ops/gates/hitl_gate.py` — `make_hitl_gate(etapa, autonomia)`.
- `src/open_agentic_ops/graph/__init__.py` — nós e arestas dos gates por etapa.
- `api/main.py` — `_etapa_pendente` + `aguardando_etapa`.
- `frontend/app/(dashboard)/tasks/[threadId]/page.tsx` — painel HITL por etapa + aba Raciocínio.
- `frontend/lib/mock-data.ts` — `aguardando_etapa` no mock.
- `tests/test_graph.py`, `tests/test_api.py`, `tests/test_llm_wire.py`, `tests/test_review_discordancia.py` — atualizados.
- `tests/test_autonomia.py` — testes da matriz (novo).
- `docs/adr/0025-hitl-por-etapa-e-matriz-de-autonomia.md` — novo ADR.
- `docs/sdd/feature-intakes/hitl-por-etapa.md` — novo Feature Intake Brief.
- `openspec/changes/hitl-por-etapa/` — novo change OpenSpec.
