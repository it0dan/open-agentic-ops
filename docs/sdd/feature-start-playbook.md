# Feature Start Playbook — SDD/SPDD com OpenSpec e OpenCode

## 1. Objetivo

Este playbook define o processo padrão para iniciar novas features no repositório **Sensedia Open Agentic Ops**.

O processo garante que cada nova feature comece com intenção clara, escopo controlado, especificações revisáveis e implementação rastreável.

É projetado para uso por arquitetos de Solutions, analistas de Solutions e agentes de IA de codificação que trabalham com SDD, SPDD, OpenSpec e OpenCode.

## 2. Princípio central

Uma nova feature não deve começar diretamente com implementação.

Uma nova feature deve primeiro ser documentada como um Feature Intake Brief sob:

```txt
docs/sdd/feature-intakes/<feature-name>.md
```

Somente após análise segura e revisão a equipe deve rodar:

```txt
/opsx:propose <feature-name>
```

## 3. Workflow padrão

```txt
Feature Intake Brief
→ Safe Analysis
→ /opsx:propose
→ Review OpenSpec
→ Validate
→ Apply
→ Test
→ Update HANDOFF.md
→ Archive
```

## 4. Processo passo a passo

### Passo 1 — Criar Feature Intake Brief

Crie um novo arquivo sob:

```txt
docs/sdd/feature-intakes/<feature-name>.md
```

Use o template:

```txt
docs/sdd/feature-intake-template.md
```

O brief deve definir:

- contexto de negócio;
- usuário/persona;
- declaração do problema;
- intenção da feature;
- jornada esperada do usuário;
- in scope;
- out of scope;
- inputs;
- outputs;
- ativos existentes a reutilizar;
- constraints;
- critérios de aceite;
- riscos e ambiguidades;
- limites de implementação.

### Passo 2 — Rodar safe analysis

Antes de criar um novo OpenSpec change, peça ao agente de IA de codificação para inspecionar o repositório e analisar o Feature Intake Brief.

O agente não deve criar, editar, deletar ou mover arquivos durante este passo.

Use este prompt:

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

### Passo 3 — Revisar análise

O Principal Architect ou Tech Lead revisa a análise.

Verifique se:

- o agente entendeu a feature;
- o escopo proposto está alinhado ao brief;
- nenhum item out-of-scope foi introduzido;
- ativos existentes do projeto serão reutilizados;
- riscos e ambiguidades estão explícitos;
- a estrutura OpenSpec sugerida é razoável.

Se a análise estiver errada ou ampla demais, refine o Feature Intake Brief e repita a safe analysis.

### Passo 4 — Criar OpenSpec change

Após a safe analysis ser aprovada, rode:

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

### Passo 5 — Revisar artefatos OpenSpec

Revise o OpenSpec change gerado antes da implementação.

Estrutura esperada:

```txt
openspec/changes/<feature-name>/
├── proposal.md
├── design.md
├── specs/
│   └── <feature-name>/
│       └── spec.md
└── tasks.md
```

Verifique:

- `proposal.md` explica o problema e os objetivos;
- `design.md` explica a abordagem de implementação;
- `spec.md` inclui requisitos e critérios de aceite;
- `tasks.md` é acionável e dividido em chunks gerenciáveis;
- nenhum item out-of-scope foi adicionado.

### Passo 6 — Validar OpenSpec

Rode o comando de validação OpenSpec disponível no setup local.

Exemplos:

```txt
/opsx:validate <feature-name>
```

ou comando CLI equivalente, dependendo do ambiente.

Não aplique implementação até a validação passar ou problemas conhecidos serem explicitamente aceitos.

### Passo 7 — Aplicar implementação

Somente após revisão e validação, aprove a implementação.

Use uma instrução controlada:

```txt
O OpenSpec change está aprovado.

Aplique a feature estritamente de acordo com:
- proposal.md
- design.md
- specs/<feature-name>/spec.md
- tasks.md

Não implemente funcionalidade fora do escopo aprovado.
Use a arquitetura e convenções existentes.
Atualize testes e documentação quando o comportamento mudar.
Atualize HANDOFF.md ao final.
```

### Passo 8 — Testar e revisar

Rode:

```bash
poetry run pytest
poetry run lint   # ou o comando de lint configurado
```

Se a feature incluir geração de artefatos ou CLI, rode o comando esperado do Feature Intake Brief.

Revise os outputs gerados manualmente.

### Passo 9 — Atualizar HANDOFF.md

Ao final da sessão de implementação, atualize `HANDOFF.md` com:

- feature implementada;
- arquivos alterados;
- testes executados;
- limitações conhecidas;
- próximas tasks recomendadas;
- questões em aberto.

### Passo 10 — Arquivar change

Após implementação, testes e revisão estarem completos, arquive o OpenSpec change.

O change arquivado deve ser colocado sob:

```txt
openspec/archive/<date>-<feature-name>/
```

`openspec/changes/` deve conter apenas changes ativos/em andamento.

## 5. Checklist de governança

Antes da implementação:

```txt
[ ] Feature Intake Brief existe sob docs/sdd/feature-intakes/
[ ] Safe analysis foi executada
[ ] Escopo foi revisado por um humano
[ ] /opsx:propose criou apenas proposal/design/spec/tasks
[ ] Artefatos OpenSpec foram revisados
[ ] Validação OpenSpec passou ou problemas foram aceitos
```

Durante a implementação:

```txt
[ ] Implementação segue a spec aprovada
[ ] Nenhuma funcionalidade out-of-scope foi adicionada
[ ] Arquitetura existente foi respeitada
[ ] Prompts permanecem artefatos versionados
[ ] Nenhum dado real de cliente foi introduzido
[ ] PII permanece mascarada na fronteira de entrada
[ ] Testes foram adicionados ou atualizados
```

Antes de arquivar:

```txt
[ ] poetry run pytest passa
[ ] lint passa quando aplicável
[ ] README ou docs atualizados quando o comportamento mudou
[ ] HANDOFF.md atualizado
[ ] OpenSpec change arquivado
```

## 6. Anti-patterns

Evite:

- iniciar uma feature diretamente com implementação;
- rodar `/opsx:propose` com apenas um nome de feature quando o escopo não é óbvio;
- usar prompts ad hoc em vez de specs e prompts versionados;
- permitir que o agente de IA de codificação infira escopo de produto sozinho;
- misturar múltiplas features em um único OpenSpec change;
- adicionar UI, APIs, integrações ou RAG sem intake e spec explícitos;
- usar dados reais de cliente em exemplos ou testes.

## 7. Naming recomendado

Nomes de feature devem ser curtos, descritivos e em kebab-case.

Exemplos:

```txt
graph-orchestration
hitl-gate
eval-gate
pii-redaction
sre-feedback-loop
```

## 8. Relação com SDD e SPDD

SDD governa a implementação através de artefatos OpenSpec:

```txt
proposal.md
→ design.md
→ spec.md
→ tasks.md
→ implementation
```

SPDD governa prompts como artefatos versionados:

```txt
prompts/prompt.md
prompts/workflows/*.prompt.md
prompts/evals/*.md
prompts/schemas/*.schema.md
```

Ambos devem ser respeitados em toda nova feature.
