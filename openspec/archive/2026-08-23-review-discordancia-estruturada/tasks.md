## 1. Estado e tipos

- [x] 1.1 Estender `FeedbackReview` em `state/__init__.py` com `motivo: str | None` e `ambiguidade_sugerida: Ambiguidade | None`
- [x] 1.2 Adicionar `origem_discordancia: Literal["review", "fde_auditoria", "fde_hitl"]` ao `BoardState`

## 2. Review node com contexto real

- [x] 2.1 Estender `make_review_node` para receber contexto (branch + diff + spec + checklist) no callable `revisar`
- [x] 2.2 Implementar caminho de discordância estruturada no fallback determinístico (violação de checklist → `motivo` + `ambiguidade_sugerida`)
- [x] 2.3 Garantir que fluxo feliz (sem violação) mantém `discorda_classificacao: False`

## 3. Payload do HITL com discordância

- [x] 3.1 Computar `review_discordancia` no `hitl_gate` a partir dos `feedback_review`
- [x] 3.2 Incluir `review_discordancia: True` + motivos no payload do `interrupt()` quando houver discordância

## 4. Origem da discordância na Audit

- [x] 4.1 Registrar `origem_discordancia: "review"` no estado quando o Review discorda
- [x] 4.2 Expor a discordância do Review com origem na Audit (`api/main.py`)

## 5. Docstring do Architecture

- [x] 5.1 Remover a frase "pausa e escala ao FDE" do docstring de `architecture_node.py`

## 6. Testes

- [x] 6.1 Teste: Review discorda com `motivo` e `ambiguidade_sugerida`
- [x] 6.2 Teste: Review concorda sem motivo (fluxo feliz)
- [x] 6.3 Teste: payload do HITL carrega `review_discordancia` + motivos quando há discordância
- [x] 6.4 Teste: payload do HITL sem `review_discordancia` quando não há discordância
- [x] 6.5 Teste: `origem_discordancia: "review"` registrado e exposto na Audit
- [x] 6.6 Teste: docstring do Architecture sem a promessa de pausa/escala

## 7. Validação

- [x] 7.1 Rodar `poetry run pytest` (todos verdes)
- [x] 7.2 Rodar `poetry run ruff check .` (limpo)
