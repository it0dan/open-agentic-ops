# Feature Intake Brief — intake-similaridade-semantica

## 1. Feature name

`intake-similaridade-semantica`

## 2. Business context

A heurística determinística do Intake Agent classifica a ambiguidade de cada demanda por palavras-chave literais. Uma dessas keywords é **"sem precedente"** — sinal explícito de que a demanda não tem histórico resolvido. Porém, depender de uma keyword literal é frágil: a maioria das demandas novas não escreve "sem precedente", e o Intake não consegue detectar se uma demanda parecida já foi resolvida antes.

A decisão 2 da seção 6 do documento de definições (`Inicio/definicoes/open-agentic-ops-definicao-oferta (3).md`) foi fechada: substituir a keyword literal por **busca por similaridade semântica** contra o histórico de demandas já resolvidas, usando pgvector no Postgres que já é o checkpointer (ADR-0002). Se uma demanda nova é semanticamente similar a uma já resolvida com baixa ambiguidade, isso reforça a classificação de baixa; caso contrário, cai no fallback de alta (decisão 1).

## 3. User / persona

- FDE (Forward Deployed Engineer) — recebe menos falsos positivos de alta ambiguidade quando há precedente claro; audita a justificativa com referência ao precedente.
- Squad agêntica (Feature Agents) — demandas com precedente fluem mais rápido para implementação.

## 4. Problem statement

A detecção de precedente depende de uma keyword literal ("sem precedente") que quase nunca aparece no texto real de uma demanda. O Intake não aproveita o histórico de demandas já resolvidas (status terminal `monitorado`/`deployado`) para inferir precedente por similaridade. Resultado: demandas genuinamente repetitivas são escaladas ao FDE desnecessariamente, aumentando carga humana e latência.

## 5. Feature intention

Ao classificar uma nova demanda, o Intake gera um embedding do texto sanitizado (pós-PII) e busca as N demandas mais similares já resolvidas (status terminal) da mesma `origem`+`dominio`. Acima de um threshold de similaridade, o precedente reforça a classificação de baixa ambiguidade; abaixo, não conta como precedente e a demanda cai no fallback de alta (decisão 1). A keyword literal "sem precedente" permanece como sinal explícito adicional. A justificativa da classificação passa a referenciar o `thread_id` do precedente encontrado.

## 6. Expected user journey

```txt
Nova demanda chega ao Intake
→ PII mascarado na fronteira (ADR-0006)
→ Classificação determinística (dominio + ambiguidade por keyword)
→ Embedding do texto sanitizado (Sentence-Transformers local, opensource)
→ Busca de precedentes similares (pgvector) na mesma origem+dominio, status terminal
├─ similaridade >= threshold → reforça baixa; justificativa referencia thread_id
└─ similaridade < threshold  → não conta como precedente; cai no fallback de alta
→ Registra embedding/precedente da demanda atual para buscas futuras
```

## 7. In scope

- [ ] Infra opensource: `docker-compose.yml` com Postgres + pgvector (`pgvector/pgvector:pg16`).
- [ ] Módulo de embeddings com Sentence-Transformers local (modelo multilíngue, opensource).
- [ ] Camada de similaridade com conector pgvector (mesma `DATABASE_URL` do checkpointer).
- [ ] Migração SQL: extensão `vector` + tabela de precedentes (thread_id, origem, dominio, texto_sanitizado, embedding, status_terminal).
- [ ] Integração no Intake: gerar embedding, buscar precedentes, reforçar/negar baixa, registrar precedente.
- [ ] Configuração de `SIMILARIDADE_THRESHOLD` e `SIMILARIDADE_N` (não hardcoded).
- [ ] Degradação graciosa quando Postgres/pgvector indisponível (mantém comportamento atual).
- [ ] Testes (unit + regressão das decisões 1/3/4).

## 8. Out of scope

- [ ] Uso da LLM (AI Gateway) para gerar embeddings — embeddings são opensource locais; a LLM via AI Gateway permanece só para geração de texto.
- [ ] Calibração fina de threshold/N com dados reais (valores iniciais são defaults razoáveis; pendência documentada).
- [ ] Mudanças na tela Audit/frontend (decisão 2 é backend).
- [ ] Multi-tenancy (ADR-0015) — a tabela de precedentes é global nesta rodada.
- [ ] Evolução da heurística para LLM (decisão 4) — independe desta feature.

## 9. Inputs

- Texto da demanda sanitizado (pós-PII) — `spec` no estado.
- `origem` e `dominio` da demanda.
- `DATABASE_URL` apontando para Postgres com pgvector.

## 10. Outputs

- `docker-compose.yml` (Postgres + pgvector).
- Módulo `embeddings/` (geração de vetores opensource local).
- Módulo `similaridade/` (conector pgvector + busca de precedentes).
- Migração SQL da tabela de precedentes.
- `classificacao_intake.justificativa` com referência ao `thread_id` do precedente (quando aplicável).
- Registro do embedding/precedente da demanda atual.

## 11. Existing assets to reuse

- `src/open_agentic_ops/persistence/__init__.py` — checkpointer Postgres (ADR-0002), mesma `DATABASE_URL`.
- `src/open_agentic_ops/nodes/intake_node.py` + `intake.py` — ponto de integração da classificação.
- `src/open_agentic_ops/state.py` — `BoardState`, `ClassificacaoIntake`.
- `src/open_agentic_ops/pii/__init__.py` — sanitização (ADR-0006), embeddings usam texto pós-PII.
- `docs/adr/0002-use-checkpointer-as-board.md` — fundamento do Postgres como fonte de verdade.
- `tests/` — testes existentes das decisões 1/3/4 (regressão).

## 12. Constraints

- Stack **toda opensource**, exceto a LLM (GPT/Claude/etc.) que usa o AI Gateway da Sensedia. Embeddings são modelos dedicados (não LLMs generativas) → **opensource locais** (Sentence-Transformers).
- PII mascarada na fronteira de entrada (LGPD/FAPI-BR) — embeddings e precedentes usam apenas texto sanitizado.
- Checkpointer = board (ADR-0002) — pgvector estende o mesmo Postgres, sem banco separado.
- Correção de auditoria é sempre prospectiva.
- Mudança mínima e alinhada à tarefa.

## 13. Acceptance criteria

- [ ] `docker-compose.yml` sobe Postgres com pgvector e healthcheck.
- [ ] Módulo de embeddings gera vetores com Sentence-Transformers local (multilíngue).
- [ ] Busca de precedentes retorna demandas similares da mesma `origem`+`dominio` com status terminal.
- [ ] Acima do threshold → reforça baixa; abaixo → fallback de alta (decisão 1 preservada).
- [ ] Keyword literal "sem precedente" continua funcionando como sinal explícito.
- [ ] `classificacao_intake.justificativa` referencia o `thread_id` do precedente quando aplicável.
- [ ] Degradação graciosa sem Postgres/pgvector (CI/dev sem docker não quebra).
- [ ] `SIMILARIDADE_THRESHOLD` e `SIMILARIDADE_N` configuráveis.
- [ ] `poetry run pytest` verde (inclui regressão das decisões 1/3/4).
- [ ] `poetry run ruff check .` limpo.
- [ ] `npm run lint`, `npm run build`, `npm test` no frontend verdes (sem mudança esperada).

## 14. Risks and ambiguities

- **Download do modelo de embedding na primeira execução** (~120MB para MiniLM): mitigado com lazy-load e cache/volume.
- **Calibração de threshold/N**: valores iniciais são defaults razoáveis; calibração fina requer dados reais (pendência documentada).
- **Degradação sem infra**: se Postgres/pgvector indisponível, a busca deve cair graciosamente para o comportamento atual (keyword + fallback), sem quebrar o pipeline.
- **Privacidade**: embeddings são gerados de texto sanitizado (pós-PII); modelo roda local, dados não saem do ambiente.

## 15. Recommended implementation boundaries

- Não adicionar banco de dados separado (pgvector estende o Postgres do checkpointer).
- Não usar a LLM/AI Gateway para embeddings.
- Não adicionar UI/frontend.
- Não usar dados reais de cliente.
- Não criar QA Agent separado.
- Não implementar multi-tenancy nesta rodada.

## 16. Suggested OpenSpec change name

`intake-similaridade-semantica`

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
- docs/sdd/feature-intakes/intake-similaridade-semantica.md
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/intake-similaridade-semantica.md

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
/opsx:propose intake-similaridade-semantica

Use o briefing de:
docs/sdd/feature-intakes/intake-similaridade-semantica.md

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
