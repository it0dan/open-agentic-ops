# Design — Feature Agent Loop (goal-based)

## Context

O `feature_node.py` hoje é turn-based: uma única chamada a `LLMProviderPort.invoke()` e o worktree é marcado `implementado`. Não há iteração, verificação nem realimentação. Test/lint rodam como nó separado (`platform_node.py`) após o fan-in. O `Guia` (`guia.py`) só carrega `system_prompt`.

O ADR-0016 define o desenho fechado: goal explícito e determinístico (test/lint passando), ferramentas dentro do loop, teto de iterações, PII como hook determinístico e Guia com ferramentas + checklist. A implementação divide-se em duas camadas; esta rodada cobre a **Camada 1 (harness)**, testável com stubs.

## Goals / Non-Goals

**Goals:**
- Transformar o Feature Agent em goal-based loop verificável.
- Teto de iterações como guardrail anti-loop infinito.
- PII como hook determinístico sobre a saída do loop e o contexto realimentado.
- Guia com `ferramentas` e `checklist` por domínio.
- Manter fallbacks determinísticos (testável sem infra).

**Non-Goals:**
- Integração real com LLM (Sensedia AI Gateway/JWT).
- Ferramentas MCP reais de git/test.
- Checklists ricos por domínio (dev server, browser, Lighthouse/CWV, schema do Manual de APIs).
- Alterar o `platform_node` (deploy/observabilidade) — ADR-0017.

## Decisions

### D1 — Goal determinístico = test/lint passando
O loop considera o goal atingido quando `call_tool("test")` e `call_tool("lint")` retornam sucesso (`ok: True`). Não é o LLM que decide se terminou — é o resultado das ferramentas.
- **Alternativa considerada:** deixar o LLM julgar se terminou (turn-based atual). Rejeitada: "terminei" precisa ser verificável antes do HITL, não autoavaliado.

### D2 — Teto de iterações configurável
`make_feature_node(..., max_iteracoes=N)` com default (ex.: 3). Ao atingir o teto sem goal, o worktree sai do loop com `status` indicando falha, sem lançar exceção (o grafo continua; o HITL/Eval decidem o destino).
- **Alternativa considerada:** loop infinito até passar. Rejeitada: risco de custo e travamento.

### D3 — PII como hook determinístico
A saída do LLM e o contexto de test/lint realimentado passam por `pii.redigir_texto` antes de virar estado. `detectar_pii` registra categorias encontradas (auditoria). Reusa o módulo `pii.py` do Intake — mesma fronteira de proteção.
- **Alternativa considerada:** instrução de prompt ("não manipule PII"). Rejeitada: não é garantia determinística.

### D4 — `feature_node` recebe `ToolExecutionPort`
`make_feature_node` ganha parâmetro `tools` (default `_NoopTools`). `build_graph` repassa o `tools` recebido aos dois feature nodes. O `platform_node` permanece intacto (ADR-0017 trata seu futuro).
- **Alternativa considerada:** criar um nó separado de verificação. Rejeitada: violaria o loop intra-agente (ferramenta in-loop).

### D5 — `Guia` com `ferramentas` e `checklist`
`Guia` (dataclass frozen) ganha `ferramentas: tuple[str, ...]` e `checklist: tuple[str, ...]`, populados por domínio em `carregar_guia`. O `system_prompt` continua sendo a base; ferramentas/checklist alimentam o loop (quais ferramentas chamar, o que verificar antes de declarar pronto).
- **Alternativa considerada:** manter só `system_prompt`. Rejeitada: o ADR-0016 exige campo estruturado de ferramentas.

### D6 — Metadados do loop no `Worktree`
`Worktree` ganha campos opcionais `iteracoes: int` e `historico: list[dict]` (resultado de test/lint por tentativa). Permite auditoria e diagnóstico no console.
- **Alternativa considerada:** estado separado. Rejeitada: o worktree é o agregado natural do resultado do Feature Agent.

## Risks / Trade-offs

- **[Mudança de assinatura quebra callers]** → Manter fallbacks (`llm=None`, `tools=None`) e atualizar `build_graph` e testes existentes.
- **[Loop infinito]** → Teto de iterações (D2).
- **[PII no contexto realimentado]** → Hook determinístico também sobre o contexto (D3).
- **[Test/lint noop nos stubs]** → Fallback `_NoopTools` retorna `ok: True`, então o goal é atingido na primeira iteração em testes sem tools reais; testes específicos injetam tools que falham para exercitar o teto.

## Migration Plan

1. Estender `Guia` (D5) e `Worktree` (D6) — sem quebrar callers (campos opcionais).
2. Reescrever `feature_node` como loop (D1–D4).
3. Atualizar `build_graph` para repassar `tools`.
4. Adicionar testes do harness.
5. Rodar `pytest` + `ruff`.

Rollback: reverter o commit do change; o comportamento anterior (chamada única) é recuperável via git.

## Open Questions

- Valor default ideal de `max_iteracoes` (proposta: 3) — calibrar com uso real na Camada 2.
- Formato exato do `historico` no `Worktree` (proposta: lista de `{tentativa, test_ok, lint_ok, resumo}`).
