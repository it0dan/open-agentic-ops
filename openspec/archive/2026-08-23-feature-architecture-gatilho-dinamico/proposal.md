## Why

O Architecture Agent é o papel *complicated-subsystem* da squad: discute contrato de API externo/compliance, registra ADR e aconselha sem vetar. O diagrama de referência e a decisão 7.3 do documento de definições estabelecem que ele "só é acionado pelo Feature Agent (backend) quando a mudança toca um contrato de API externo/regulado" — uma decisão **por demanda**, não uma configuração fixa do grafo inteiro.

Hoje o acionamento é global: `architecture_enabled: bool` liga/desliga o Architecture para **todas** as execuções do grafo (`graph/__init__.py:185`). Isso diverge do comportamento condicional descrito — uma demanda backend rotineira aciona o Architecture desnecessariamente, e não há granularidade por spec. Em um sistema regulado (Open Finance), o FDE precisa ver o Architecture acionado apenas quando a demanda realmente toca contrato externo, para que o aconselhamento de arquitetura seja dirigido onde a ambiguidade de contrato existe.

## What Changes

- `feature_node.py` ganha heurística determinística `_toca_contrato_externo(spec)` (keywords: `contrato externo`, `fapi-br`, `endpoint externo`, `schema`, `manual de apis`, `manual de escopo`, `portabilidade`, `instrucao normativa`, `oauth`, `token`).
- `feature_node` (domínio backend) retorna campo `toca_contrato_externo: bool` no estado.
- `graph/__init__.py` substitui `architecture_enabled: bool` por aresta condicional `fan_in → {architecture | review}` baseada em `state["toca_contrato_externo"]`.
- A flag global `architecture_enabled` é removida do `build_graph`.

## Capabilities

### New Capabilities
- `feature-architecture-gatilho-dinamico`: acionamento condicional do Architecture Agent por demanda — o Feature Agent (backend) avalia por heurística determinística se a spec toca contrato de API externo/regulado e, se sim, o Architecture é invocado (registra ADR); se não, o fluxo segue direto ao Review.

### Modified Capabilities
<!-- Nenhuma spec existente é modificada; `feature-agent-loop` não muda de requisito. -->

## Impact

- `src/open_agentic_ops/nodes/feature_node.py` — heurística `_toca_contrato_externo` + campo `toca_contrato_externo` no retorno.
- `src/open_agentic_ops/graph/__init__.py` — aresta condicional `fan_in → {architecture | review}`; remoção de `architecture_enabled`.
- `tests/test_graph.py` — novos testes (Architecture acionado vs. não acionado).
