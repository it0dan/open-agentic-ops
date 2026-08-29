# HITL por etapa e matriz de autonomia

## Status

Accepted

## Context

O HITL gate original (ADR-0005/0009) era **único e genérico**: um único `hitl` no grafo, que pausava uma vez no fim do fluxo (após o fan-in) para o FDE aprovar o resultado consolidado. Isso tinha duas limitações:

1. **Granularidade de aprovação.** O FDE só via o resultado final consolidado, sem poder aprovar/rejeitar **cada etapa** (intake, feature, platform, review, deploy, sre) individualmente. Em um sistema regulado (Open Finance/FAPI-BR), o julgamento humano por etapa é mais auditável e reduz o risco de uma decisão binária sobre um pacote grande.
2. **Sem caminho de evolução de autonomia.** Não havia um ponto único para configurar "quanto" cada etapa depende do humano. A oferta prevê evoluir de HITL total para LLM-as-a-judge e, eventualmente, autonomia plena em etapas de baixo risco — mas isso exigiria reescrever o grafo a cada mudança.

## Decision

- **Um gate HITL por etapa.** O grafo passa a ter `hitl_intake`, `hitl_feature`, `hitl_platform`, `hitl_review`, `hitl_architecture`, `hitl_deploy` e `hitl_sre`, cada um criado por `make_hitl_gate(etapa, autonomia)` — o mesmo factory, parametrizado pela etapa.
- **Matriz de autonomia como ponto único de configuração** (`src/open_agentic_ops/autonomia.py`). `MATRIZ_AUTONOMIA: dict[str, Autonomia]` mapeia cada etapa a um nível:
  - `humano` — pausa via `interrupt()` e exige aprovação do FDE (HITL).
  - `llm_judge` — LLM-as-a-judge avalia o raciocínio (fase 2; por ora fallback determinístico que aprova).
  - `autonomo` — o agente prossegue sem pausa.
  - Default é `humano` (fail-safe em sistema regulado).
- **`autonomia_da_etapa(etapa)`** lê a matriz; o grafo consulta essa função ao construir cada gate. Migrar uma etapa de `humano` → `llm_judge` → `autonomo` é uma mudança de configuração, sem tocar no grafo.
- **`deploy` incluído na matriz** (correção durante a implementação): o `hitl_deploy` usava o default `humano`, mas a etapa não estava declarada — o teste de grafo autônomo revelou a inconsistência.
- **API e console refletem a etapa pendente.** `_etapa_pendente` em `api/main.py` deriva a etapa que aguarda decisão a partir de `state.next` (nós `hitl_*`), exposta como `aguardando_etapa`; o painel HITL do console mostra o raciocínio da etapa específica e a aba "Raciocínio" lista o reasoning por etapa (auditoria, ADR-0025).

## Consequences

- O FDE aprova **cada etapa** individualmente; o fluxo feliz exige 6 aprovações (intake, feature, platform, review, deploy, sre) — mais 1 (architecture) quando a spec toca contrato externo.
- Testes de integração e de API foram atualizados para dirigir o fluxo aprovando cada gate (`_aprovar_todos_gates` em `tests/test_graph.py`, `_aprovar_todos_gates_api` em `tests/test_api.py`).
- A evolução de autonomia é declarativa: basta alterar `MATRIZ_AUTONOMIA` (ex.: `"review": "llm_judge"`) para reduzir a carga do FDE em etapas de baixo risco, sem reescrever o grafo.
- `llm_judge` ainda é fallback determinístico (fase 2); o LLM-as-a-judge real depende da infra de LLM (ADR-0016 camada 2).
- Custo operacional: mais pontos de pausa para o FDE. Mitigado pela matriz (etapas podem virar `llm_judge`/`autonomo`) e pelo painel por etapa no console.

## References

- ADR-0005 (HITL gate), ADR-0009 (retomada do FDE via `POST /resume`), ADR-0017 (roteamento condicional dos gates), ADR-0016 (loop goal-based do Feature Agent).
