# Roteamento condicional dos gates (HITL e Eval) + nó de deploy

## Status

Accepted

## Context

No grafo atual (`graph/__init__.py`), as arestas `hitl → eval → sre → END` são **todas incondicionais**. Mesmo que o FDE rejeite no HITL (`aprovado=False`) ou o Eval reprove, o grafo segue em frente do mesmo jeito — o resultado fica gravado no estado (`decisao_hitl`, `resultado_eval`), mas nada no grafo reage a ele. **Os gates não gateiam de fato.** `test_graph.py` só testa o caminho feliz (`aprovado=True` nos dois); não há teste de rejeição.

Além disso, **não existe nó de deploy** no grafo — `platform_node` só chama `test`/`lint`, mas a arquitetura fala em "Eval gate antes do deploy" e "SRE monitora pós-deploy".

## Decision

1. **Nó `deploy` explícito** (Platform Agent, MCP, chama tool `deploy`), inserido entre a aprovação do Eval gate e o SRE. Consistente com a decisão do loop (ADR-0016): deploy/observabilidade continuam como nó de grafo pós-fan-in, não fazem parte do critério de "terminei de implementar".

2. **Roteamento condicional do HITL:** `aprovado=False` → status terminal `rejeitado`, o grafo termina ali. Rejeição do FDE pode significar qualquer coisa (direção errada, spec ruim, timing errado) — não é seguro assumir retry automático genérico; retrabalho vira nova demanda ou intervenção manual fora do grafo.

```python
builder.add_conditional_edges(
    "hitl",
    route_by_hitl_decision,
    {"aprovado": "eval", "rejeitado": END},
)
```

3. **Roteamento condicional do Eval:** `aprovado=False` → volta para `hitl` (não para o Feature Agent). O Eval é uma camada de julgamento mais alta que test/lint local (já garantido dentro do loop do Feature, ADR-0016) — uma falha de trajectory eval é o tipo de ambiguidade que cabe ao FDE decidir.

```python
builder.add_conditional_edges(
    "eval",
    route_by_eval_result,
    {"aprovado": "deploy", "reprovado": "hitl"},
)
builder.add_edge("deploy", "sre")
```

Não há risco de loop infinito automático: o retorno a `hitl` sempre passa por um novo `interrupt()` — precisa de decisão humana nova a cada volta. **Limitação conhecida:** o FDE pode re-aprovar sem mudar nada, causando um loop manual (aprovado → eval → reprovado → hitl → aprovado → ...). Aceito por ora (o FDE é o juiz humano e pode rejeitar); se virar problema real, um contador de re-aprovações por thread resolve depois.

## Consequences

- Os gates passam a bloquear de fato — correção do bug mais sério do runtime.
- `Status` ganha o valor `rejeitado` (terminal).
- `hitl_gate.py` corrige o retorno do branch reprovado: deixa de usar `aguardando_hitl` (rótulo obsoleto, descreve "ainda esperando" quando o `interrupt()` já foi resolvido) e passa a retornar `rejeitado`.
- O nó `deploy` é stub até a infra de deploy existir (chama `call_tool("deploy", ...)` via Platform).
- Risco de loop manual de re-aprovação aceito e registrado.
