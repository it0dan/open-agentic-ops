## Context

O Review Agent é o papel *enabling* da squad (ADR-0007): dá feedback de PR contra os padrões do time, orienta e não bloqueia. Sua promessa central — "se discordar da classificação do Intake em andamento, pausa e escala ao FDE" — não se materializa hoje: `review_node.py` é um stub determinístico com `discorda_classificacao: False` hardcoded, e o payload do `interrupt()` do HITL não carrega a discordância.

A seção 7 do documento de definições fechou 6 decisões. A decisão 1 (loop goal-based do Feature Agent) já foi implementada (ADR-0016). Esta mudança cobre as decisões 3–7, como Camada 1 (harness + testes), com fallbacks determinísticos e sem infra real.

## Goals / Non-Goals

**Goals:**
- `FeedbackReview` estruturado com `motivo` e `ambiguidade_sugerida`.
- `review_node` com contexto real (branch + diff + spec + checklist) e caminho para discordar.
- Payload do HITL carrega `review_discordancia` + motivos quando houver discordância.
- `origem_discordancia` no `BoardState` e exposto na Audit.
- Docstring do Architecture corrigido.

**Non-Goals:**
- Decisão 2 (Architecture como subagent no loop do Feature) — outra rodada.
- Integração real A2A do Review (Camada 2).
- Calibrar schema de `origem_discordancia` com histórico real.

## Decisions

**D1 — `FeedbackReview` estruturado (decisão 4).**
`FeedbackReview` ganha `motivo: str | None` e `ambiguidade_sugerida: Ambiguidade | None`. Campos opcionais (`| None`) preservam compatibilidade com o reducer `operator.add` e com consumidores existentes (`_detalhe`). Alternativa considerada: um campo `discordancia` aninhado — rejeitada por adicionar aninhamento sem ganho, já que o TypedDict é plano.

**D2 — `review_node` com contexto real (decisão 3).**
`make_review_node` passa a receber o contexto (branch + diff + spec + checklist) via assinatura do `revisar` callable. No harness, o fallback determinístico recebe o checklist do Guia e, se o checklist apontar violação (ex.: "sem PII em claro na resposta" com PII detectada), produz discordância estruturada com `motivo` e `ambiguidade_sugerida`. Alternativa: simular discordância em todo fluxo — rejeitada por quebrar o caso-âncora (`test_graph.py` espera fluxo feliz).

**D3 — Payload do HITL com discordância (decisão 5).**
`hitl_gate` computa se qualquer `feedback_review` tem `discorda_classificacao=True`; se sim, o payload do `interrupt()` ganha `review_discordancia: True` + lista de motivos. Sem discordância, o campo fica ausente (payload mínimo).

**D4 — `origem_discordancia` (decisão 6).**
`BoardState` ganha `origem_discordancia: Literal["review", "fde_auditoria", "fde_hitl"]`. Nesta rodada, o Review registra `"review"` quando discorda. Os valores `"fde_auditoria"`/`"fde_hitl"` ficam reservados (tipados) para as frentes futuras. A Audit (`/auditoria`) passa a expor a discordância do Review com a origem.

**D5 — Docstring do Architecture (decisão 7).**
Remove a frase "Se discordar da classificação do Intake em andamento, pausa e escala ao FDE" do `architecture_node.py`, pois o papel do Architecture é puramente consultivo ("aconselha, não veta").

## Risks / Trade-offs

- [Adicionar campos ao `FeedbackReview` quebra consumidores] → Mitigação: campos opcionais (`| None`), `_detalhe` já serializa o dict inteiro; nenhum teste quebra.
- [Simular discordância em todo fluxo quebra o caso-âncora] → Mitigação: discordância só quando o checklist aponta violação real (harness), não em todo fluxo.
- [Over-engineering no harness] → Mitigação: manter fallback determinístico simples; a complexidade real (A2A) fica para a Camada 2.
