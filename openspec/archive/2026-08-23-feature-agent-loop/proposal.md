## Why

O Feature Agent (`feature_node.py`) chama `LLMProviderPort.invoke()` **uma única vez** e marca o worktree como `implementado`, sem iteração nem verificação. Test/lint rodam como nó separado (`platform_node.py`) **depois** do fan-in, não como ferramenta in-loop. Para uma squad que opera o ciclo de vida de Open Finance, "implementado" precisa ser **verificável** (testes passando + lint limpo) antes do HITL gate — não uma autoavaliação do modelo. Esta feature implementa o Loop Engineering (comportamento intra-agente) que falta, conforme ADR-0016.

## What Changes

- **`feature_node.py` vira um goal-based loop**: itera até test/lint passarem (goal determinístico) ou até um teto de iterações, realimentando o LLM com o resultado de test/lint a cada tentativa.
- **`feature_node` passa a receber `ToolExecutionPort`** para rodar test/lint in-loop (hoje só o `platform_node` recebe).
- **PII como hook determinístico**: a saída do loop (e o contexto realimentado) passa por `pii.redigir_texto`/`detectar_pii` antes de virar estado — não instrução de prompt.
- **`Guia` ganha `ferramentas` e `checklist`** por domínio, além do `system_prompt`.
- **`Worktree` registra metadados do loop**: número de iterações e resultado de test/lint por tentativa.
- **Fallbacks determinísticos mantidos** quando não há provider injetado (testável com stubs).

## Capabilities

### New Capabilities
- `feature-agent-loop`: Loop goal-based do Feature Agent — iteração verificável (test/lint), teto de iterações, PII como hook determinístico e Guia com ferramentas + checklist.

### Modified Capabilities
<!-- Nenhuma capability existente é modificada (não há openspec/specs/ ainda). -->

## Impact

- **Runtime Python** (`src/open_agentic_ops/`): `nodes/feature_node.py` (loop goal-based), `nodes/guia.py` (ferramentas + checklist), `ports/__init__.py` (assinaturas, se necessário), `state/__init__.py` (metadados do loop no `Worktree`), `graph/__init__.py` (passar `tools` ao feature).
- **Testes**: novos testes do harness do loop em `tests/`.
- **Docs**: atualização do `HANDOFF.md`.

## Non-goals

- **Integração real com LLM** (Sensedia AI Gateway/JWT) — depende de infra.
- **Ferramentas MCP reais de git/test** — depende de infra.
- **Checklists ricos por domínio** (dev server, browser, screenshot, Lighthouse/CWV, schema do Manual de APIs, teste de contrato) — evolução posterior.
- **Alterar o `platform_node`** (deploy/observabilidade) — pertence ao ADR-0017.
- **Roteamento condicional dos gates** (ADR-0017), **SRE real** (ADR-0019), **multi-tenancy** (ADR-0015).
