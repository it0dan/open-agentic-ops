# Feature Intake Brief — intake-pii-financeiro

## 1. Feature name

`intake-pii-financeiro`

## 2. Business context

A squad opera o ciclo de vida de Open Finance, um domínio regulado (LGPD + perfil de segurança FAPI-BR). O módulo `pii/__init__.py` mascara PII na fronteira de entrada (Intake), ancorado em classificação LGPD (dado pessoal vs. sensível). Hoje cobre CPF, CNPJ, e-mail, telefone, data de nascimento e CEP — bom conjunto genérico, mas **não cobre padrões específicos de Open Finance** como número de conta/agência bancária e chave Pix, que são dados sensíveis no domínio.

A decisão 3 da seção 6 do documento de definições (`Inicio/definicoes/open-agentic-ops-definicao-oferta (3).md`) foi fechada: **cobrir agora, por precaução**. Mesmo que raros em texto livre, quando aparecem são dados mais sensíveis que CEP/telefone, e o custo de over-redaction (mascarar um número que não era PII) é bem menor que under-redaction em contexto financeiro regulado.

## 3. User / persona

- FDE (Forward Deployed Engineer) — aprovador único no HITL gate.
- Compliance / segurança — precisa garantir que PII financeira nunca entre no sistema em claro.
- Liderança técnica — rastreabilidade de PII mascarada na fronteira.

## 4. Problem statement

`pii/__init__.py` não reconhece **número de conta/agência bancária** nem **chave Pix aleatória (UUID)**. Se um texto de demanda contiver esses dados, eles passam em claro para o sistema (estado, checkpointer, telemetria, evals, logs) — violando o princípio do ADR-0006 ("PII raw nunca entra no sistema").

## 5. Feature intention

Estender o módulo de redação PII determinístico para cobrir os padrões financeiros específicos de Open Finance: chave Pix aleatória (UUID) e conta/agência bancária. Prioriza over-redaction (segurança > precisão), conforme decisão fechada.

## 6. Expected user journey

```txt
Texto de demanda entra (Cliente/Regulatório/Estratégia/SRE)
→ Intake sanitiza PII (redigir_texto)
   ├─ CPF/CNPJ/email/tel/data/CEP → já cobertos
   ├─ chave Pix aleatória (UUID) → [CHAVE_PIX]  (novo)
   └─ conta/agência bancária → [CONTA]          (novo)
→ texto mascarado segue para classificação de domínio/ambiguidade
```

## 7. In scope

- [x] Adicionar padrão de **chave Pix aleatória (UUID)** ao `pii/__init__.py` (rótulo `CHAVE_PIX`, categoria sensível).
- [x] Adicionar padrão de **conta/agência bancária** ao `pii/__init__.py` (rótulo `CONTA_BANCARIA`, categoria sensível), abordagem permissiva com separador.
- [x] Adicionar testes para os novos padrões em `tests/test_pii.py`.

## 8. Out of scope

- [x] Similaridade semântica via pgvector (decisão 2 da seção 6) — depende de infra.
- [x] Novo motivo de discordância na Audit (decisão 4 da seção 6).
- [x] Calibração fina do regex de conta/agência com exemplos reais de múltiplas instituições (evolução futura).
- [x] Mudanças de UI, API pública ou grafo.

## 9. Inputs

- Texto livre da demanda (string), antes da classificação.
- Módulo `pii/__init__.py` (regex + classificação LGPD).

## 10. Outputs

- `redigir_texto(texto)` mascara chave Pix UUID → `[CHAVE_PIX]` e conta/agência → `[CONTA]`.
- `detectar_pii(texto)` retorna as novas categorias (`sensivel`).
- `sanitizar_payload(payload)` herda a proteção recursivamente.

## 11. Existing assets to reuse

- `src/open_agentic_ops/pii/__init__.py` — módulo de redação determinístico (estrutura `PadraoPII` + `PADROES`).
- `tests/test_pii.py` — testes existentes do módulo.
- `docs/adr/0006-mask-pii-at-intake-boundary.md`, `docs/adr/0012-implement-pii-redaction-as-skill-plus-deterministic-module.md` — contexto de PII.
- Skill `pii-sanitizer` — guia/feedforward (não alterada).

## 12. Constraints

- Stack tudo-Python.
- PII mascarada na fronteira de entrada (LGPD/FAPI-BR).
- Over-redaction aceito (segurança > precisão).
- Mudança mínima e alinhada à tarefa.
- Sem comentários não solicitados no código.

## 13. Acceptance criteria

- [ ] `redigir_texto` mascara chave Pix aleatória (UUID) → `[CHAVE_PIX]`.
- [ ] `redigir_texto` mascara conta/agência com separador (ex.: `ag 1234-5 conta 56789-0`) → `[CONTA]`.
- [ ] `detectar_pii` classifica os novos padrões como `sensivel`.
- [ ] Padrões existentes (CPF, CNPJ, email, tel, data, CEP) continuam funcionando.
- [ ] `poetry run pytest` verde.
- [ ] `poetry run ruff check .` limpo.

## 14. Risks and ambiguities

- **Falso positivo do regex de conta/agência**: pode mascarar números com hífen/barra que não são conta (ex.: versão de manual "v7.0"). Aceito pela decisão de over-redaction.
- **Formato variável de conta/agência por instituição**: regex permissivo pode não capturar todos os formatos. Calibração fina fica para evolução futura com exemplos reais.
- **UUID falso positivo**: UUIDs podem aparecer em outros contextos (IDs de sistema). Aceito pela decisão de over-redaction.

## 15. Recommended implementation boundaries

- Não adicionar UI.
- Não adicionar HTTP API pública.
- Não adicionar banco de dados separado.
- Não usar dados reais de cliente.
- Não criar QA Agent separado.
- Não implementar as decisões 2/4 da seção 6 nesta feature.

## 16. Suggested OpenSpec change name

`intake-pii-financeiro`

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
- docs/sdd/feature-intakes/intake-pii-financeiro.md
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/intake-pii-financeiro.md

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
/opsx:propose intake-pii-financeiro

Use o briefing de:
docs/sdd/feature-intakes/intake-pii-financeiro.md

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
