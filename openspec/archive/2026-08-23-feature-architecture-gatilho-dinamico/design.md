## Context

O Architecture Agent é acionado hoje por `architecture_enabled: bool` no `build_graph` (`graph/__init__.py:127,185`), uma flag global que liga/desliga o nó para todas as execuções. A decisão 7.3 do documento de definições fechou a direção: o acionamento deve ser **por demanda**, decidido pelo Feature Agent durante o loop, quando a spec toca contrato de API externo/regulado.

Nesta rodada (Camada 1/harness), o julgamento é feito por **heurística determinística** no `feature_node` — sem depender de LLM real. O reasoner real (LLM) fica para Camada 2, no mesmo padrão dos demais nós (fallback determinístico + reasoner real depois).

## Goals / Non-Goals

**Goals:**
- Acionar o Architecture condicionalmente por demanda, baseado na spec.
- Remover a flag global `architecture_enabled`.
- Manter o Architecture como nó do grafo (aconselha via ADR), só com acionamento condicional.
- Preservar o caso-âncora (spec regulatória com portabilidade → Architecture acionado).

**Non-Goals:**
- Chamada tipo subagent com contexto isolado (desenho completo da decisão 7.3) — fica para outra rodada.
- Integração real A2A do Architecture (Camada 2).
- Mudanças em Review, HITL, Eval ou SRE.

## Decisions

### D1 — Heurística determinística `_toca_contrato_externo(spec)`

O `feature_node` (domínio backend) avalia a spec contra keywords de contrato externo/regulado. Keywords: `contrato externo`, `fapi-br`, `endpoint externo`, `schema`, `manual de apis`, `manual de escopo`, `portabilidade`, `instrucao normativa`, `oauth`, `token`. Retorna `True` se qualquer keyword bater.

**Por que essas keywords:** cobrem o caso-âncora (spec regulatória com "portabilidade", "Manual de Escopo", "Instrução Normativa") e os sinais típicos de contrato externo (FAPI-BR, schema, OAuth, token, endpoint externo). A heurística é determinística e auditável, no mesmo padrão do Intake.

### D2 — Campo `toca_contrato_externo` no estado

O `feature_node` retorna `toca_contrato_externo: bool` no estado quando o domínio é backend (ou ambos). Para domínio exclusivamente frontend, o campo é `False` (frontend não toca contrato de API externo diretamente).

### D3 — Aresta condicional no grafo

`graph/__init__.py` substitui o bloco `if architecture_enabled:` por uma aresta condicional:

```python
builder.add_conditional_edges(
    "fan_in",
    route_by_architecture,
    {"architecture": "architecture", "review": "review"},
)
```

`route_by_architecture(state)` retorna `"architecture"` se `state.get("toca_contrato_externo")` for `True`, senão `"review"`. A flag `architecture_enabled` é removida do `build_graph`.

## Risks / Trade-offs

- **Falso negativo/positivo da heurística:** a heurística determinística pode errar (ex.: spec que toca contrato mas não usa as keywords, ou spec que usa "schema" sem tocar contrato externo). Aceitável na Camada 1; o reasoner real (LLM) mitiga na Camada 2.
- **Quebra de testes existentes:** o caso-âncora espera `len(result["adrs"]) >= 1` — a heurística precisa detectar contrato externo na spec regulatória. Validado na safe analysis (keywords cobrem o caso).
- **Remoção de `architecture_enabled`:** todos os call sites do `build_graph` (API + testes) usam o default `True`; nenhum passa `architecture_enabled=False` explicitamente, então a remoção é segura.
