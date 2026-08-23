## Why

O Review Agent promete pausar e escalar ao FDE quando discorda da classificação do Intake, mas hoje é um stub binário (`discorda_classificacao: False` hardcoded) que nunca materializa essa promessa. Além disso, o payload do `interrupt()` do HITL não carrega a discordância — o FDE só a veria abrindo o card da demanda, não na notificação que o acorda. Em um sistema regulado (Open Finance), a discordância do Review precisa ser estruturada e auditável para sustentar a confiança no harness.

## What Changes

- `FeedbackReview` estruturado: ganha `motivo: str | None` e `ambiguidade_sugerida: Ambiguidade | None` (decisão 4 da seção 7 do documento de definições).
- `review_node.py` com contexto real (branch + diff + spec + checklist) e caminho para discordar de forma estruturada (decisão 3).
- Payload do `interrupt()` do HITL carrega `review_discordancia: True` + motivos quando houver discordância (decisão 5).
- `origem_discordancia` no `BoardState` (`"review" | "fde_auditoria" | "fde_hitl"`) e registro na Audit (decisão 6).
- Docstring do `architecture_node.py` corrigido (remover "pausa e escala ao FDE") (decisão 7).

## Capabilities

### New Capabilities
- `review-discordancia`: sinalização estruturada e auditável de discordância de classificação pelo Review Agent, com `motivo`, `ambiguidade_sugerida`, propagação no payload do HITL e registro na Audit com `origem_discordancia`.

### Modified Capabilities
<!-- Nenhuma spec existente é modificada; `feature-agent-loop` não muda de requisito. -->

## Impact

- `src/open_agentic_ops/state/__init__.py` — `FeedbackReview` estendido; `BoardState` ganha `origem_discordancia`.
- `src/open_agentic_ops/nodes/review_node.py` — contexto real + discordância estruturada.
- `src/open_agentic_ops/gates/hitl_gate.py` — payload do `interrupt()` com `review_discordancia` + motivos.
- `src/open_agentic_ops/nodes/architecture_node.py` — docstring corrigido.
- `api/main.py` — `_detalhe`/Audit expõem `origem_discordancia`.
- `tests/` — novos testes (Camada 1/harness).

## Non-goals

- Decisão 2 da seção 7 (Architecture Agent como subagent no loop do Feature Agent) — mais profunda, mexe no loop; fica para outra rodada.
- Integração real A2A do Review (serviço externo) — Camada 2, depende de infra.
- Schema exato de `origem_discordancia` na Audit com histórico real — calibrar com dados reais.
- Threshold de evolução para LLM contando Review + FDE juntos ou separados.
