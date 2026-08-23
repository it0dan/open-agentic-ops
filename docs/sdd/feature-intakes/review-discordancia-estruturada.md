# Feature Intake Brief — review-discordancia-estruturada

## 1. Feature name

`review-discordancia-estruturada`

## 2. Business context

O Review Agent é o papel *enabling* da squad: dá feedback de PR contra os padrões do time, orienta e não bloqueia. Sua promessa central (registrada no `CONTEXT.md` e no `AGENTS.md`) é que, se discordar da classificação do Intake em andamento, ele **pausa e escala ao FDE** — sem hierarquia de severidade.

Hoje essa promessa não se materializa: o `review_node.py` é um stub determinístico que sempre retorna `discorda_classificacao: False` hardcoded. A discordância nunca acontece de fato, e mesmo que acontecesse, o payload do `interrupt()` do HITL não a carregaria — o FDE só veria a discordância se abrisse o card da demanda, não na notificação que o acorda.

Em um sistema regulado (Open Finance), a capacidade de o Review sinalizar discordância de classificação de forma estruturada e auditável é o que sustenta a confiança no harness: o FDE precisa saber *quando* e *por que* um agente discordou, e a Audit precisa acumular esse sinal para calibrar a heurística do Intake.

## 3. User / persona

- FDE (Forward Deployed Engineer) — recebe a discordância no payload do HITL e na Audit.
- Liderança técnica — audita a qualidade das classificações do Intake.
- Solutions Analysts / Solution Architects — consomem o sinal de discordância para calibrar a heurística.

## 4. Problem statement

Três gaps concretos no código atual:

1. **`FeedbackReview` é binário** (`state/__init__.py:53-56`): `{worktree, feedback, discorda_classificacao: bool}`. Não carrega `motivo` nem `ambiguidade_sugerida` — o FDE vê só um booleano, sem o argumento nem a reclassificação proposta.
2. **`review_node.py` é stub**: `_revisar(branch)` recebe só o nome da branch e devolve frase fixa; `discorda_classificacao: False` hardcoded. Não há contexto real (diff, spec, checklist) nem caminho para discordar.
3. **Payload do HITL não carrega discordância** (`hitl_gate.py:20-27`): o `interrupt()` tem `{tipo, thread, spec_resumo, worktrees}` — sem `review_discordancia` nem motivos. Se o FDE aprovar direto da notificação, uma discordância passa despercebida.

Além disso, a **Audit** (`/auditoria`) só lista `classificacao_intake`; não há registro de discordância do Review com `origem_discordancia` para distinguir a fonte do sinal (Review vs. FDE).

## 5. Feature intention

Permitir que o Review Agent sinalize discordância de classificação de forma **estruturada e auditável**: com `motivo` e `ambiguidade_sugerida`, propagada no payload do HITL (para o FDE ver na notificação) e registrada na Audit com `origem_discordancia` para distinguir a fonte do sinal.

## 6. Expected user journey

```txt
Origem (Cliente/Regulatório/Estratégia/SRE)
→ Intake classifica ambiguidade
→ Feature Agent implementa em worktree
→ Review aconselha (branch + diff + spec + checklist)
   └─ se discorda → FeedbackReview estruturado (motivo + ambiguidade_sugerida)
→ HITL gate (FDE aprova)
   └─ payload carrega review_discordancia + motivos quando houver
→ Eval gate (PromptFoo)
→ SRE monitora e realimenta
```

Na Audit, o FDE vê a discordância do Review como entrada revisável, com `origem_discordancia: "review"`, distinta da auditoria periódica do FDE (`"fde_auditoria"`) e da rejeição pontual no HITL (`"fde_hitl"`).

## 7. In scope

- [ ] `FeedbackReview` estruturado: ganha `motivo: str | None` e `ambiguidade_sugerida: Ambiguidade | None` (decisão 4 da seção 7).
- [ ] `review_node.py` com contexto real (branch + diff + spec + checklist) e caminho para discordar de forma estruturada (decisão 3).
- [ ] Payload do `interrupt()` do HITL carrega `review_discordancia: True` + motivos quando houver discordância (decisão 5).
- [ ] `origem_discordancia` no `BoardState` (`"review" | "fde_auditoria" | "fde_hitl"`) e registro na Audit (decisão 6).
- [ ] Docstring do `architecture_node.py` corrigido (remover "pausa e escala ao FDE") (decisão 7).
- [ ] Testes (Camada 1/harness) para cada comportamento.

## 8. Out of scope

- [ ] Decisão 2 da seção 7 (Architecture Agent como subagent no loop do Feature Agent) — mais profunda, mexe no loop; fica para outra rodada.
- [ ] Integração real A2A do Review (serviço externo) — Camada 2, depende de infra.
- [ ] Schema exato de `origem_discordancia` na Audit com histórico real — fica para calibrar com dados reais.
- [ ] Threshold de evolução para LLM contando Review + FDE juntos ou separados — `[DECISÃO PENDENTE]` da seção 7.

## 9. Inputs

- `BoardState` com `worktrees` (cada um com `branch`, `dominio`, `historico`), `spec` e `classificacao_intake`.
- `FeedbackReview` atual (`{worktree, feedback, discorda_classificacao}`) — será estendido.
- Checklist de verificação do Guia (por domínio) como contexto para o reviewer.

## 10. Outputs

- `FeedbackReview` estendido com `motivo` e `ambiguidade_sugerida`.
- Payload do `interrupt()` do HITL com `review_discordancia` + motivos.
- `BoardState.origem_discordancia` registrado.
- Audit expondo discordância do Review com `origem_discordancia`.
- Testes novos em `tests/`.

## 11. Existing assets to reuse

- `src/open_agentic_ops/state/__init__.py` — `FeedbackReview`, `BoardState`, `Ambiguidade`.
- `src/open_agentic_ops/nodes/review_node.py` — nó Review (será estendido).
- `src/open_agentic_ops/gates/hitl_gate.py` — payload do `interrupt()` (será estendido).
- `src/open_agentic_ops/nodes/architecture_node.py` — docstring (será corrigido).
- `src/open_agentic_ops/nodes/guia.py` — `Guia.checklist` (contexto do reviewer).
- `api/main.py` — `_detalhe` (expõe `feedback_review`), `/auditoria`.
- `tests/test_graph.py`, `tests/test_api.py` — testes existentes a preservar/atualizar.
- Padrão de contador qualitativo já usado no Intake (`/auditoria/ambigua`).

## 12. Constraints

- Stack tudo-Python (LangGraph + LangSmith).
- Hexagonal leve só nas bordas.
- PII mascarada na fronteira de entrada (LGPD/FAPI-BR).
- Protocolo por modo de interação (MCP vs A2A).
- Gates HITL e Eval obrigatórios.
- Checkpointer = board.
- Camada 1 (harness + testes) — fallbacks determinísticos, sem infra real.

## 13. Acceptance criteria

- [ ] `FeedbackReview` carrega `motivo` e `ambiguidade_sugerida` quando discorda.
- [ ] `review_node` produz discordância estruturada quando o contexto aponta (harness).
- [ ] Payload do HITL inclui `review_discordancia: True` + motivos quando houver discordância.
- [ ] `origem_discordancia` registrado no estado e exposto na Audit.
- [ ] Docstring do Architecture sem a promessa de "pausa e escala".
- [ ] `poetry run pytest` verde; `poetry run ruff check .` limpo.

## 14. Risks and ambiguities

- Adicionar campos opcionais ao `FeedbackReview` é retrocompatível (TypedDict com `total=False` implícito nos campos novos via `| None`).
- O `feedback_review` usa reducer `operator.add` — append; adicionar campos não quebra o reducer.
- `test_graph.py:49` (`assert len(result["feedback_review"]) == 2`) continua válido — só o conteúdo muda.
- Risco de over-engineering no harness: manter o fallback determinístico simples, sem simular discordância artificialmente em todo fluxo (senão o caso-âncora quebra).

## 15. Recommended implementation boundaries

- Não adicionar UI nova (a Audit já existe; só expor o novo campo).
- Não adicionar HTTP API pública nova além do necessário.
- Não adicionar banco de dados separado (checkpointer é o board).
- Não usar dados reais de cliente.
- Não criar QA Agent separado.
- Não implementar a decisão 2 (Architecture subagent) nesta rodada.

## 16. Suggested OpenSpec change name

`review-discordancia-estruturada`

## 17. Suggested safe analysis prompt

```txt
Você está trabalhando no repositório Sensedia Open Agentic Ops.

Antes de criar um novo OpenSpec change, analise a feature proposta com segurança.

Importante:
Não crie, edite, delete ou mova arquivos.
Não rode /opsx:propose.
Não implemente código.
Apenas inspecione o repositório e retorne uma análise.

Leia primeiro:
- AGENTS.md
- PROJECT.md
- HANDOFF.md
- README.md
- openspec/project.md
- openspec/specs/*
- docs/adr/*
- docs/sdd/feature-intakes/review-discordancia-estruturada.md
- prompts/
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/review-discordancia-estruturada.md

Retorne apenas:

1. Entendimento da feature proposta
2. Capacidades atuais do repositório que já suportam esta feature
3. Arquivos existentes relevantes
4. Gaps a serem endereçados
5. Riscos e ambiguidades
6. Estrutura sugerida do OpenSpec change
7. Ajustes de escopo sugeridos, se houver
8. Critérios de aceite sugeridos
9. Breakdown de tasks sugerido
10. Recomendação: se é seguro rodar /opsx:propose em seguida

Não modifique arquivos.
```

## 18. Suggested OpenSpec propose prompt

```txt
/opsx:propose review-discordancia-estruturada

Use o briefing de:
docs/sdd/feature-intakes/review-discordancia-estruturada.md

Crie um novo OpenSpec change para esta feature.

Regras:
- Crie proposal.md, design.md, specs e tasks.md.
- Não implemente código.
- Não mude arquivos de origem.
- Não adicione funcionalidade fora do briefing.
- Respeite AGENTS.md, PROJECT.md e docs/adr/.
- Mantenha escopo alinhado ao feature intake.
- Pare após criar os artefatos OpenSpec.

Após criar o change, resuma:
1. arquivos criados;
2. escopo proposto;
3. premissas;
4. riscos;
5. questões em aberto;
6. próxima ação recomendada.
```
