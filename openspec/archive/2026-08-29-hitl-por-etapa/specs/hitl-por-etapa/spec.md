## ADDED Requirements

### Requirement: HITL gate por etapa

O sistema SHALL ter um gate HITL por etapa do fluxo (`intake`, `feature`, `platform`, `review`, `architecture`, `deploy`, `sre`), criado por `make_hitl_gate(etapa, autonomia)`, que pausa via `interrupt()` quando a etapa exige `humano`.

#### Scenario: Etapa humana pausa via interrupt

- **WHEN** uma etapa com autonomia `humano` é alcançada no fluxo
- **THEN** o grafo pausa via `interrupt()` e o FDE deve aprovar/rejeitar antes de prosseguir

#### Scenario: Etapa autônoma não pausa

- **WHEN** uma etapa com autonomia `autonomo` é alcançada no fluxo
- **THEN** o grafo prossegue sem pausa (status `aprovado`)

#### Scenario: Etapa llm_judge aprova via fallback

- **WHEN** uma etapa com autonomia `llm_judge` é alcançada no fluxo
- **THEN** o gate avalia via LLM-as-a-judge (fase 2; por ora fallback determinístico que aprova) e registra `decisao_hitl`

### Requirement: Matriz de autonomia declarativa

O sistema SHALL expor uma matriz de autonomia (`MATRIZ_AUTONOMIA`) e a função `autonomia_da_etapa(etapa)` como ponto único de configuração do nível de autonomia de cada etapa, com default `humano`.

#### Scenario: Leitura do nível configurado

- **WHEN** `autonomia_da_etapa("intake")` é chamada
- **THEN** retorna o nível configurado na matriz (default `humano` para etapas não declaradas)

#### Scenario: Migração declarativa de autonomia

- **WHEN** uma etapa é alterada na matriz (ex.: `"review": "llm_judge"`)
- **THEN** o grafo passa a usar o novo nível sem alteração de código do grafo

### Requirement: Etapa pendente exposta na API

O sistema SHALL expor a etapa que aguarda decisão do FDE como `aguardando_etapa` nos endpoints `/tasks` e `/tasks/{thread_id}`, derivada de `state.next` (nós `hitl_*`).

#### Scenario: Demanda aguardando decisão

- **WHEN** uma demanda está pausada em um gate HITL
- **THEN** o endpoint expõe `aguardando_etapa` com o nome da etapa (ex.: `intake`, `feature`, `review`)

#### Scenario: Demanda sem gate pendente

- **WHEN** uma demanda não está aguardando decisão HITL
- **THEN** `aguardando_etapa` é `null`
