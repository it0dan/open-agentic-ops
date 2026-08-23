# feature-architecture-gatilho-dinamico Specification

## Purpose
TBD - created by archiving change feature-architecture-gatilho-dinamico. Update Purpose after archive.
## Requirements
### Requirement: Feature Agent avalia se a spec toca contrato externo

O `feature_node` (domínio backend ou ambos) SHALL avaliar, por heurística determinística, se a spec toca contrato de API externo/regulado e SHALL expor o resultado no campo `toca_contrato_externo` do estado.

#### Scenario: Spec backend toca contrato externo

- **WHEN** a spec do domínio backend contém keyword de contrato externo/regulado (ex.: `contrato externo`, `fapi-br`, `portabilidade`, `manual de escopo`, `instrucao normativa`)
- **THEN** o `feature_node` retorna `toca_contrato_externo: True` no estado

#### Scenario: Spec backend rotineira não toca contrato externo

- **WHEN** a spec do domínio backend não contém nenhuma keyword de contrato externo/regulado
- **THEN** o `feature_node` retorna `toca_contrato_externo: False` no estado

#### Scenario: Domínio exclusivamente frontend

- **WHEN** o domínio é exclusivamente frontend
- **THEN** o `feature_node` retorna `toca_contrato_externo: False` no estado

### Requirement: Architecture acionado condicionalmente por demanda

O grafo SHALL acionar o Architecture Agent apenas quando `toca_contrato_externo` for `True`, roteando `fan_in → architecture` nesse caso e `fan_in → review` caso contrário. A flag global `architecture_enabled` SHALL ser removida.

#### Scenario: Spec toca contrato externo aciona Architecture

- **WHEN** `toca_contrato_externo` é `True` no estado
- **THEN** o grafo roteia para o nó `architecture`, que registra um ADR no estado

#### Scenario: Spec não toca contrato externo pula Architecture

- **WHEN** `toca_contrato_externo` é `False` no estado
- **THEN** o grafo roteia direto para o nó `review`, sem registrar ADR de Architecture

#### Scenario: Flag global removida

- **WHEN** o `build_graph` é inspecionado
- **THEN** ele não possui o parâmetro `architecture_enabled`

