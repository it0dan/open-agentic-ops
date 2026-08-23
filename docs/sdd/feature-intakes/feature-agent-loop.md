# Feature Intake Brief — feature-agent-loop

## 1. Feature name

`feature-agent-loop`

## 2. Business context

O Feature Agent é o coração da squad: é quem transforma a spec aprovada em código no worktree. Hoje ele faz **uma única chamada** ao LLM e declara o worktree `implementado` sem nenhuma verificação. Para uma squad que opera o ciclo de vida de Open Finance (norma regulatória → deploy monitorado), "implementado" precisa ser **verificável** (testes passando + lint limpo) antes de chegar ao HITL gate — não uma autoavaliação do modelo.

Esta feature implementa o **Loop Engineering** (comportamento intra-agente) que falta ao Feature Agent, complementando o Graph Engineering (topologia inter-agente) já existente. É o achado central da definição da oferta (ADR-0016) e destrava o Architecture dinâmico e o Review com contexto real.

## 3. User / persona

- **FDE (Forward Deployed Engineer)** — recebe no HITL gate apenas worktrees que passaram em test/lint, reduzindo ruído e retrabalho.
- **Equipe de operações (SRE)** — recebe deploys de código que já passou por verificação determinística.
- **Liderança técnica** — garante qualidade verificável no pipeline, não dependente de autoavaliação do modelo.

## 4. Problem statement

O `feature_node.py` chama `LLMProviderPort.invoke()` **uma única vez** e marca o worktree como `implementado`. Não há iteração: não edita arquivo, roda teste, lê o resultado, corrige e tenta de novo. Test/lint rodam como nó separado (`platform_node.py`) **depois** do fan-in, não como ferramenta in-loop. O `Guia` (`guia.py`) só carrega `system_prompt`, sem campo de ferramentas nem checklist. Resultado: o Feature Agent não consegue garantir que o que produziu está correto — "terminei" é decidido pelo próprio modelo, não por evidência.

## 5. Feature intention

Transformar o Feature Agent em um **goal-based loop** (taxonomia de loop engineering da Anthropic): o agente itera até que um **goal determinístico** seja atingido (test/lint passando) ou até um **teto de iterações**, com **PII como hook determinístico** sobre toda saída e o **Guia** carregando ferramentas + checklist por domínio.

## 6. Expected user journey

```txt
Spec aprovada (baixa: Intake; alta: FDE via autoria)
→ Feature Agent entra no loop goal-based
   → implementa (LLM)
   → roda test/lint (ferramenta in-loop)
   → PII hook verifica a saída
   → se falhou e há iterações restantes: corrige e tenta de novo
   → se passou ou atingiu teto: sai do loop
→ worktree com resultado verificável
→ fan-in → Review/Architecture → HITL gate (FDE aprova)
→ Eval gate → deploy → SRE monitora
```

## 7. In scope

- [ ] Harness do loop goal-based no `feature_node` (goal = test/lint passando)
- [ ] Teto de iterações (guardrail anti-loop infinito)
- [ ] PII como hook determinístico sobre a saída do loop (reuso do `pii.py`)
- [ ] Contexto de retorno de test/lint a cada tentativa (realimenta o LLM)
- [ ] `Guia` ganha campo de ferramentas + checklist por domínio
- [ ] `feature_node` recebe acesso ao `ToolExecutionPort` (test/lint in-loop)
- [ ] Testes do harness com stubs (goal atingido, teto respeitado, PII hook, contexto de retorno)

## 8. Out of scope

- [ ] Integração real com LLM (Sensedia AI Gateway/JWT) — depende de infra
- [ ] Ferramentas MCP reais de git/test — depende de infra
- [ ] Checklists ricos por domínio (dev server, browser, screenshot, Lighthouse/CWV, schema do Manual de APIs, teste de contrato) — evolução posterior
- [ ] Alterar o `platform_node` (deploy/observabilidade) — pertence ao ADR-0017
- [ ] Roteamento condicional dos gates (ADR-0017)
- [ ] SRE real (ADR-0019)
- [ ] Multi-tenancy (ADR-0015)

## 9. Inputs

- `BoardState` com `spec` aprovada e `dominio` (backend/frontend/ambos)
- `LLMProviderPort` (fallback determinístico quando ausente)
- `ToolExecutionPort` (fallback determinístico quando ausente) — novo no `feature_node`
- `Guia` com `system_prompt`, `ferramentas` e `checklist`

## 10. Outputs

- `Worktree` com `status` refletindo o resultado do loop (`implementado` se goal atingido, `falhou`/`atingiu_teto` caso contrário)
- Metadados do loop no worktree: número de iterações, resultado de test/lint por tentativa
- Saída do loop com PII redigida (hook determinístico)

## 11. Existing assets to reuse

- `src/open_agentic_ops/nodes/feature_node.py` — nó a transformar
- `src/open_agentic_ops/nodes/guia.py` — `Guia` a estender
- `src/open_agentic_ops/nodes/platform_node.py` — padrão de uso do `ToolExecutionPort`
- `src/open_agentic_ops/ports/__init__.py` — `LLMProviderPort`, `ToolExecutionPort`
- `src/open_agentic_ops/pii/__init__.py` — `redigir_texto`, `detectar_pii`
- `src/open_agentic_ops/state/__init__.py` — `Worktree`, `BoardState`
- `src/open_agentic_ops/graph/__init__.py` — `build_graph` (passar `tools` ao feature)
- `docs/adr/0016-goal-based-feature-agent-loop.md` — decisão de design
- `tests/test_graph.py`, `tests/test_runtime_ext.py` — padrões de teste

## 12. Constraints

- Stack tudo-Python (LangGraph + LangSmith)
- Hexagonal leve só nas bordas (portas)
- PII mascarada na fronteira de entrada (LGPD/FAPI-BR) e como hook determinístico no loop
- Gates HITL e Eval obrigatórios
- Checkpointer = board
- Fallbacks determinísticos mantidos quando não há provider injetado
- Mudanças mínimas e alinhadas à tarefa

## 13. Acceptance criteria

- [ ] `feature_node` itera até test/lint passarem ou atingir o teto de iterações
- [ ] Teto de iterações respeitado (sem loop infinito)
- [ ] PII redigida na saída do loop (hook determinístico)
- [ ] Contexto de test/lint retornado ao LLM a cada tentativa
- [ ] `Guia` expõe `ferramentas` e `checklist`
- [ ] `feature_node` recebe `ToolExecutionPort`
- [ ] Testes do harness verdes (goal, teto, PII, contexto)
- [ ] `poetry run pytest` verde; `poetry run ruff check .` limpo

## 14. Risks and ambiguities

- **Compatibilidade do grafo**: mudar a assinatura de `make_feature_node`/`build_graph` pode afetar testes existentes — manter fallbacks e atualizar callers.
- **Loop infinito**: mitigado pelo teto de iterações.
- **PII no contexto de retorno**: o resultado de test/lint pode conter PII — aplicar hook determinístico também no contexto realimentado.
- **Escopo da Camada 2**: não prometer integração real nesta rodada (depende de infra).

## 15. Recommended implementation boundaries

- Não adicionar UI
- Não adicionar HTTP API pública
- Não adicionar banco de dados separado (checkpointer é o board)
- Não usar dados reais de cliente
- Não criar QA Agent separado
- Não alterar o `platform_node` (pertence ao ADR-0017)
- Não implementar a Camada 2 (integração real LLM/MCP)

## 16. Suggested OpenSpec change name

`feature-agent-loop`

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
- docs/sdd/feature-intakes/feature-agent-loop.md
- prompts/
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/feature-agent-loop.md

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
/opsx:propose feature-agent-loop

Use o briefing de:
docs/sdd/feature-intakes/feature-agent-loop.md

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
