# Feature Intake Brief — intake-fallback-ambiguidade

## 1. Feature name

`intake-fallback-ambiguidade`

## 2. Business context

A squad opera o ciclo de vida de Open Finance, um domínio regulado onde o custo de deixar passar uma demanda sem revisão humana é alto (prazo de adequação regulatório, risco de sanção). O Intake Agent classifica a ambiguidade de cada demanda para decidir se o FDE precisa autorar a spec (alta) ou se o próprio Intake rascunha (baixa).

Hoje, quando a heurística determinística **não reconhece nenhuma** palavra-chave de alta ambiguidade no texto, ela classifica como `baixa` — ou seja, o silêncio da heurística empurra a demanda para o caminho de **menos** supervisão humana. Num sistema regulado, o comportamento fail-safe esperado é o oposto: texto que a heurística ainda não sabe reconhecer deve escalar ao FDE, não seguir como se fosse simples.

Esta feature implementa a decisão fechada na seção 6 do documento de definições (`Inicio/definicoes/open-agentic-ops-definicao-oferta (3).md`): **inverter o fallback de ambiguidade**.

## 3. User / persona

- FDE (Forward Deployed Engineer) — aprovador único no HITL gate e autor de spec em alta ambiguidade.
- Liderança técnica / compliance — precisa de rastreabilidade de por que uma demanda foi classificada como alta.

## 4. Problem statement

`classificar_ambiguidade` (`src/open_agentic_ops/nodes/intake.py`) retorna `"baixa", []` quando nenhuma palavra-chave de `alta_ambiguidade` é reconhecida no texto. Isso significa que uma demanda que a heurística não conhece segue direto para o Intake rascunhar a spec sozinho, sem passar pelo FDE — exatamente o contrário do fail-safe desejado para um sistema regulado.

## 5. Feature intention

Garantir que, quando a heurística não reconhece o texto como de baixa ambiguidade (nenhuma keyword de alta bate), a demanda seja classificada como **alta** e escale ao FDE. Prioriza segurança sobre throughput: melhor sobrecarregar o FDE ocasionalmente com um item que era simples do que deixar passar sem revisão algo que a heurística ainda não sabia reconhecer.

## 6. Expected user journey

```txt
Demanda entra (Cliente/Regulatório/Estratégia/SRE)
→ Intake sanitiza PII
→ classificar_ambiguidade(texto)
   ├─ keyword de alta reconhecida → alta (justificativa = keywords)
   └─ nenhuma keyword de alta → alta (justificativa = [], "escalado por ausência de reconhecimento")
→ spec_autor = fde
→ escala ao FDE (autoria de spec)
```

## 7. In scope

- [x] Inverter o fallback de `classificar_ambiguidade`: sem hit de `alta_ambiguidade` → `alta` (não `baixa`).
- [x] Justificativa vazia sinaliza "escalado por ausência de reconhecimento", distinto de "escalado por keyword real".
- [x] Atualizar testes existentes que dependiam do fallback antigo (preservando o cenário de baixa ambiguidade).
- [x] Adicionar teste novo específico do fallback invertido.

## 8. Out of scope

- [x] Similaridade semântica via pgvector contra histórico de demandas resolvidas (decisão 2 da seção 6) — depende de infra.
- [x] Cobertura de PII de conta/agência/chave Pix (decisão 3 da seção 6).
- [x] Novo motivo de discordância na Audit ("ambíguo demais para keyword") (decisão 4 da seção 6).
- [x] Evolução da heurística para LLM.
- [x] Mudanças de UI na tela Audit (indicador visual de justificativa vazia) — avaliar em rodada futura.

## 9. Inputs

- Texto da demanda (string), já sanitizado de PII pelo Intake.
- Heurística carregada de `heuristica.json` (mutável via auditoria prospectiva).

## 10. Outputs

- `classificar_ambiguidade(texto) -> tuple[Ambiguidade, list[str]]`:
  - com keyword de alta → `("alta", [keywords])`
  - sem keyword de alta → `("alta", [])`
- `classificacao_intake.ambiguidade` e `classificacao_intake.justificativa` no estado do board.
- `spec_autor = "fde"` quando alta.

## 11. Existing assets to reuse

- `src/open_agentic_ops/nodes/intake.py` — `classificar_ambiguidade` (função a alterar).
- `src/open_agentic_ops/nodes/intake_node.py` — nó do grafo que consome a classificação.
- `src/open_agentic_ops/nodes/heuristica.json` — fonte mutável da heurística.
- `tests/test_intake.py`, `tests/test_runtime_ext.py`, `tests/test_graph.py`, `tests/test_api.py` — testes a atualizar.
- `docs/adr/0006-mask-pii-at-intake-boundary.md`, `docs/adr/0012-implement-pii-redaction-as-skill-plus-deterministic-module.md` — contexto de PII (não alterados nesta feature).

## 12. Constraints

- Stack tudo-Python (LangGraph + LangSmith).
- Hexagonal leve só nas bordas.
- PII mascarada na fronteira de entrada (LGPD/FAPI-BR).
- Correção de auditoria do FDE é sempre prospectiva.
- Nenhum merge sem humano na cadeia (FDE no HITL gate).
- Mudança mínima e alinhada à tarefa.

## 13. Acceptance criteria

- [ ] Texto sem keyword de `alta_ambiguidade` → `ambiguidade == "alta"`, `justificativa == []`.
- [ ] Texto com keyword de `alta_ambiguidade` → `ambiguidade == "alta"`, `justificativa` contém as keywords.
- [ ] Texto com keyword de baixa (ex.: frontend) mas sem keyword de alta → `ambiguidade == "alta"` (fallback invertido prevalece).
- [ ] `spec_autor == "fde"` quando `ambiguidade == "alta"`.
- [ ] Cenário de baixa ambiguidade continua coberto por teste (texto com keyword de alta que não dispara, ou texto que a heurística reconhece como baixa).
- [ ] `poetry run pytest` verde.
- [ ] `poetry run ruff check .` limpo.

## 14. Risks and ambiguities

- **Sobrecarga do FDE**: mais demandas escalam ao FDE. Aceito pela decisão fechada (segurança > throughput).
- **Quebra de testes existentes**: 4 testes esperam `baixa` para textos sem keyword de alta. Mitigação: adicionar keyword de alta aos textos para preservar o cenário de baixa.
- **Justificativa vazia na Audit**: a tela Audit mostra chips vazios para `justificativa == []`. Não é bug, mas o FDE pode não distinguir "escalado por ausência" de "escalado por keyword". Indicador visual fica como evolução futura (out of scope).

## 15. Recommended implementation boundaries

- Não adicionar UI.
- Não adicionar HTTP API pública.
- Não adicionar banco de dados separado (checkpointer é o board).
- Não usar dados reais de cliente.
- Não criar QA Agent separado.
- Não implementar as decisões 2/3/4 da seção 6 nesta feature.

## 16. Suggested OpenSpec change name

`intake-fallback-ambiguidade`

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
- docs/sdd/feature-intakes/intake-fallback-ambiguidade.md
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/intake-fallback-ambiguidade.md

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
/opsx:propose intake-fallback-ambiguidade

Use o briefing de:
docs/sdd/feature-intakes/intake-fallback-ambiguidade.md

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
