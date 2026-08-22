# Feature Intake Brief — <feature-name>

## 1. Feature name

`<feature-name>`

## 2. Business context

Descreva por que esta feature importa.

Explique o problema de negócio ou de operação de Open Finance que ela ajuda a resolver.

## 3. User / persona

Quem se beneficia desta feature?

Exemplos:

- FDE (Forward Deployed Engineer)
- Solution Architect
- Solutions Analyst
- Liderança técnica
- Stakeholder de cliente
- Equipe de operações (SRE)

## 4. Problem statement

Descreva a limitação, gap ou oportunidade atual.

## 5. Feature intention

Descreva o que a feature deve habilitar.

Use linguagem simples.

## 6. Expected user journey

Descreva como o usuário deve interagir com a feature.

Exemplo (fluxo da squad):

```txt
Origem (Cliente/Regulatório/Estratégia/SRE)
→ Intake classifica ambiguidade
→ Feature Agent implementa em worktree
→ Review/Architecture aconselham
→ HITL gate (FDE aprova)
→ Eval gate (PromptFoo)
→ SRE monitora e realimenta
```

## 7. In scope

Liste o que deve ser incluído.

- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## 8. Out of scope

Liste o que não deve ser incluído.

- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## 9. Inputs

Descreva os inputs esperados.

Inclua:

- formato de arquivo;
- campos obrigatórios;
- campos opcionais;
- caminhos de exemplo.

## 10. Outputs

Descreva os outputs esperados.

Inclua:

- arquivos gerados;
- formato de output;
- metadados;
- artefatos de revisão;
- logs se relevante.

## 11. Existing assets to reuse

Liste arquivos, pastas, prompts, specs, módulos de código ou exemplos existentes que devem ser reutilizados.

Exemplos:

- `openspec/changes/squad-open-agentic-ops/`
- `docs/adr/`
- `prompts/prompt.md`
- `prompts/workflows/*`
- `src/` (grafo LangGraph)
- `~/agentic/credit-analysis-agent` (gateway_auth, otel_setup, run_all_evals.sh)

## 12. Constraints

Descreva constraints técnicas, arquiteturais, de segurança, governança ou de entrega.

Considere:

- stack tudo-Python (LangGraph + LangSmith);
- hexagonal leve só nas bordas;
- PII mascarada na fronteira de entrada (LGPD/FAPI-BR);
- protocolo por modo de interação (MCP vs A2A);
- gates HITL e Eval obrigatórios;
- checkpointer = board.

## 13. Acceptance criteria

Defina critérios de aceite claros.

- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## 14. Risks and ambiguities

Liste riscos conhecidos, questões em aberto ou pontos de ambiguidade.

## 15. Recommended implementation boundaries

Descreva o que a implementação deve evitar.

Exemplos:

- não adicionar UI;
- não adicionar HTTP API pública;
- não adicionar banco de dados separado (checkpointer é o board);
- não usar dados reais de cliente;
- não criar QA Agent separado.

## 16. Suggested OpenSpec change name

`<feature-name>`

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
- docs/sdd/feature-intakes/<feature-name>.md
- prompts/
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/<feature-name>.md

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
/opsx:propose <feature-name>

Use o briefing de:
docs/sdd/feature-intakes/<feature-name>.md

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
