# Feature Intake Brief — intake-audit-motivo-ambiguidade

## 1. Feature name

`intake-audit-motivo-ambiguidade`

## 2. Business context

A heurística determinística do Intake Agent classifica a ambiguidade de cada demanda. A tela Audit permite ao FDE revisar essas classificações e corrigir a heurística prospectivamente (RNF-6). Hoje o fluxo de correção só tem um mecanismo: **adicionar/remover palavra-chave** (`corrigirHeuristica`).

A decisão 4 da seção 6 do documento de definições (`Inicio/definicoes/open-agentic-ops-definicao-oferta (3).md`) foi fechada: a evolução da heurística para LLM deve ser disparada por **sinal qualitativo**, não volume bruto. Para isso, a Audit precisa distinguir dois motivos de discordância:
- **"Faltou palavra-chave"** → resolve na hora, adicionando à `heuristica.json` (fluxo que já existe).
- **"Ambíguo demais para keyword resolver"** → **não gera correção de heurística**; só incrementa um contador específico. Esse contador é o gatilho real para considerar evoluir para LLM.

## 3. User / persona

- FDE (Forward Deployed Engineer) — revisa classificações e sinaliza discordância.
- Liderança técnica / arquitetura — usa o contador qualitativo para decidir quando evoluir a heurística para LLM.

## 4. Problem statement

A tela Audit não distingue por que o FDE discorda de uma classificação. Sem esse segundo motivo, o sinal de "a heurística bateu no teto do determinismo" fica invisível — misturado com "faltou uma palavra-chave", que é resolvível adicionando à lista. O gatilho qualitativo para evoluir para LLM (decisão 4) não tem onde acontecer.

## 5. Feature intention

Adicionar um segundo motivo de discordância na Audit — **"ambíguo demais para keyword"** — que não gera correção de heurística, apenas incrementa um contador específico. Esse contador é o sinal qualitativo para considerar evoluir a heurística para LLM.

## 6. Expected user journey

```txt
FDE revisa classificação na tela Audit
├─ concorda → "Manteria"
└─ discorda
   ├─ "Faltou palavra-chave" → adiciona/remove keyword (heuristica.json)
   └─ "Ambíguo demais para keyword" → incrementa contador (sem tocar heurística)
```

## 7. In scope

- [x] Novo endpoint backend para registrar o motivo "ambíguo demais para keyword" (incrementa contador em memória, sem tocar a heurística).
- [x] Exposição do contador (leitura) para o frontend.
- [x] Segundo motivo de discordância na tela Audit (frontend) + exibição do contador.
- [x] Testes backend e frontend.

## 8. Out of scope

- [x] Similaridade semântica via pgvector (decisão 2 da seção 6) — depende de infra.
- [x] Evolução efetiva da heurística para LLM (o contador é só o gatilho/sinal).
- [x] Persistência durável do contador (em memória nesta rodada; reinicia a cada restart).
- [x] Mudanças no grafo LangGraph ou no modelo de estado do board.

## 9. Inputs

- `thread_id` da classificação em que o FDE sinaliza "ambíguo demais para keyword".

## 10. Outputs

- Contador em memória do motivo "ambíguo demais para keyword".
- Endpoint `POST /auditoria/ambigua` (incrementa) e leitura do contador.
- Botão/motivo "Ambíguo demais" na tela Audit + exibição do contador.

## 11. Existing assets to reuse

- `api/main.py` — endpoints de auditoria existentes (`GET /auditoria`, `POST /auditoria/heuristica`).
- `frontend/app/(dashboard)/audit/page.tsx` — tela Audit existente.
- `frontend/lib/api.ts` — cliente da API.
- `frontend/lib/mock-data.ts` — dados mock.
- `tests/test_api.py` — testes da API.

## 12. Constraints

- Stack tudo-Python (backend) + Next.js (frontend).
- PII mascarada na fronteira de entrada.
- Correção de auditoria é sempre prospectiva.
- Contador em memória (reinicia a cada restart) — aceito para o gatilho qualitativo inicial.
- Mudança mínima e alinhada à tarefa.

## 13. Acceptance criteria

- [ ] `POST /auditoria/ambigua` incrementa o contador em memória e retorna o novo valor.
- [ ] O contador é exposto via leitura (ex.: `GET /auditoria/ambigua` ou no `GET /auditoria`).
- [ ] Registrar "ambíguo demais" **não** altera a `heuristica.json`.
- [ ] A tela Audit tem o segundo motivo de discordância e exibe o contador.
- [ ] `poetry run pytest` verde.
- [ ] `poetry run ruff check .` limpo.
- [ ] `npm run lint`, `npm run build`, `npm test` no frontend verdes.

## 14. Risks and ambiguities

- **Contador em memória reinicia a cada restart**: aceito para o gatilho qualitativo inicial; evolução futura pode persistir no checkpointer/JSON.
- **Dois motivos de discordância podem confundir**: mitigado por rótulos claros na UI ("Faltou palavra-chave" vs "Ambíguo demais para keyword").

## 15. Recommended implementation boundaries

- Não adicionar banco de dados separado.
- Não usar dados reais de cliente.
- Não criar QA Agent separado.
- Não implementar a decisão 2 (pgvector) nesta feature.
- Não evoluir a heurística para LLM (só o gatilho/sinal).

## 16. Suggested OpenSpec change name

`intake-audit-motivo-ambiguidade`

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
- docs/sdd/feature-intakes/intake-audit-motivo-ambiguidade.md
- src/
- tests/
- api/
- frontend/

Analise a feature descrita em:

docs/sdd/feature-intakes/intake-audit-motivo-ambiguidade.md

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
/opsx:propose intake-audit-motivo-ambiguidade

Use o briefing de:
docs/sdd/feature-intakes/intake-audit-motivo-ambiguidade.md

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
