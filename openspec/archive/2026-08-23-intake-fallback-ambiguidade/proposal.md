## Why

O Intake Agent classifica a ambiguidade de cada demanda para decidir se o FDE autor a spec (alta) ou se o próprio Intake rascunha (baixa). Hoje, quando a heurística determinística não reconhece nenhuma palavra-chave de alta ambiguidade no texto, ela classifica como `baixa` — empurrando a demanda para o caminho de **menos** supervisão humana. Num domínio regulado (Open Finance), o fail-safe esperado é o oposto: texto que a heurística ainda não sabe reconhecer deve escalar ao FDE. Esta feature inverte esse fallback, implementando a decisão fechada na seção 6 do documento de definições.

## What Changes

- **BREAKING** — `classificar_ambiguidade` (`src/open_agentic_ops/nodes/intake.py`): quando nenhuma keyword de `alta_ambiguidade` é reconhecida, passa a retornar `("alta", [])` em vez de `("baixa", [])`.
- A justificativa vazia (`[]`) passa a sinalizar "escalado por ausência de reconhecimento", distinto de "escalado por keyword real" (que traz a lista de keywords).
- **Novo** — conjunto `baixa_ambiguidade` no `Heuristica` (defaults + `heuristica.json`): preserva o caminho de baixa (`spec_autor=intake`) para demandas claramente simples. Precedência: keyword de alta → `alta`; senão keyword de baixa → `baixa`; senão → `alta` (fallback).
- Consequência no fluxo: demanda sem keyword de alta nem de baixa → `spec_autor = "fde"` → escala ao FDE para autoria de spec.
- Atualização dos testes existentes que dependiam do fallback antigo (preservando o cenário de baixa via keyword de `baixa_ambiguidade`) e adição de teste novo específico do fallback invertido.

## Capabilities

### New Capabilities
- `intake-fallback-ambiguidade`: comportamento de classificação de ambiguidade do Intake Agent quando a heurística não reconhece keyword de alta — passa a escalar ao FDE (alta) em vez de seguir como baixa.

### Modified Capabilities
<!-- Nenhuma spec existente é modificada; não há spec canônica do Intake em openspec/specs/. -->

## Impact

- **Código**: `src/open_agentic_ops/nodes/intake.py` (função `classificar_ambiguidade`).
- **Consumidores**: `src/open_agentic_ops/nodes/intake_node.py` (nó do grafo) — sem mudança de assinatura, só de comportamento.
- **Testes**: `tests/test_intake.py`, `tests/test_runtime_ext.py`, `tests/test_graph.py`, `tests/test_api.py` (asserções de `baixa` para textos sem keyword de alta).
- **Sem impacto** em API pública, dependências ou infraestrutura.
