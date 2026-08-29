## Context

O HITL gate original era único e genérico: um único `hitl` no grafo pausava uma vez no fim do fluxo (após o fan-in) para o FDE aprovar o resultado consolidado. Isso limitava a granularidade de aprovação (o FDE não podia aprovar/rejeitar cada etapa) e não oferecia um caminho declarativo para evoluir a autonomia das etapas.

## Goals / Non-Goals

**Goals:**
- Um gate HITL por etapa (intake, feature, platform, review, architecture, deploy, sre).
- Matriz de autonomia declarativa como ponto único de configuração.
- `aguardando_etapa` exposto na API e refletido no console.
- Testes de integração/API atualizados + testes da matriz.

**Non-Goals:**
- LLM-as-a-judge real (fase 2) — `llm_judge` fica como fallback determinístico.
- Autonomia plena em produção (matriz permanece `humano` por padrão).
- Notificação push (Redis/SSE) real — permanece polling.

## Decisions

### D27 — Gate HITL genérico por etapa.

`make_hitl_gate(etapa, autonomia)` cria um gate parametrizado pela etapa. `humano` pausa via `interrupt()` com o raciocínio da etapa; `autonomo` retorna `status: aprovado` sem pausar; `llm_judge` avalia via LLM (fase 2, por ora fallback determinístico que aprova). O payload do `interrupt()` é JSON-serializable e sem PII raw.

### D28 — Matriz de autonomia como ponto único de configuração.

`MATRIZ_AUTONOMIA: dict[str, Autonomia]` em `src/open_agentic_ops/autonomia.py` mapeia cada etapa a um nível (`humano`/`llm_judge`/`autonomo`). `autonomia_da_etapa(etapa)` lê a matriz com default `humano` (fail-safe em sistema regulado). Migrar uma etapa é uma mudança de configuração, sem tocar no grafo.

### D29 — `deploy` incluído na matriz.

O `hitl_deploy` usava o default `humano`, mas a etapa não estava declarada na matriz — o teste de grafo autônomo revelou a inconsistência. `deploy` foi adicionado à matriz.

### D30 — `aguardando_etapa` na API.

`_etapa_pendente` em `api/main.py` deriva a etapa que aguarda decisão a partir de `state.next` (nós `hitl_*`), exposta como `aguardando_etapa` nos endpoints `/tasks` e `/tasks/{thread_id}`. O console usa esse campo para exibir o painel HITL da etapa específica.

## Risks / Trade-offs

- [Mais pontos de pausa para o FDE] → custo operacional maior; mitigado pela matriz (etapas podem virar `llm_judge`/`autonomo`) e pelo painel por etapa no console.
- [`llm_judge` ainda é fallback determinístico] → LLM-as-a-judge real depende da infra de LLM (ADR-0016 camada 2).
- [Testes quebram] → o fluxo agora exige aprovação em cada etapa; helpers `_aprovar_todos_gates` (test_graph) e `_aprovar_todos_gates_api` (test_api) dirigem o fluxo.
