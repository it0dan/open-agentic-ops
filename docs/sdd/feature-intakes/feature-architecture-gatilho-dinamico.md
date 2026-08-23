# Feature Intake Brief — feature-architecture-gatilho-dinamico

## 1. Feature name

`feature-architecture-gatilho-dinamico`

## 2. Business context

O Architecture Agent é o papel *complicated-subsystem* da squad: discute contrato de API externo/compliance de forma síncrona (A2A), registra ADR e aconselha sem vetar. O diagrama de referência é claro: ele "só é acionado pelo Feature Agent (backend) quando a mudança toca um contrato de API externo/regulado" — uma decisão **por demanda**, não uma configuração fixa do grafo inteiro.

Hoje o acionamento é global: `architecture_enabled: bool` liga/desliga o Architecture para **todas** as execuções do grafo (`graph/__init__.py:185`). Isso não corresponde ao comportamento condicional descrito — uma demanda backend rotineira (ex.: "adicionar botão de download") aciona o Architecture desnecessariamente, e não há como uma demanda específica acioná-lo se a flag estiver desligada.

A decisão 7.3 do documento de definições fechou a direção: é o próprio Feature Agent, durante seu loop, que avalia se a spec toca contrato externo e invoca o Architecture como chamada isolada tipo subagent. Nesta rodada (Camada 1/harness), o julgamento é feito por heurística determinística no `feature_node`, sem depender de LLM real.

## 3. User / persona

- FDE (Forward Deployed Engineer) — vê o Architecture acionado apenas quando a demanda realmente toca contrato externo.
- Liderança técnica — audita a coerência do roteamento do grafo com a spec.
- Feature Agent — decide, durante o loop, se a spec exige aconselhamento de arquitetura.

## 4. Problem statement

O `architecture_enabled: bool` no `build_graph` (`graph/__init__.py:127,185`) é uma flag global que liga/desliga o Architecture para todas as execuções. Isso diverge da decisão 7.3 (acionamento por demanda, decidido pelo Feature Agent) e do diagrama de referência (Architecture só quando toca contrato externo/regulado). O resultado: o Architecture é acionado em demandas que não precisam dele, e não há granularidade por spec.

## 5. Feature intention

Acionar o Architecture Agent **condicionalmente por demanda**: o Feature Agent (backend) avalia, por heurística determinística, se a spec toca contrato de API externo/regulado e, se sim, o Architecture é invocado (registra ADR); se não, o fluxo segue direto ao Review. Remover a flag global `architecture_enabled`.

## 6. Expected user journey

```txt
Origem (Cliente/Regulatório/Estratégia/SRE)
→ Intake classifica ambiguidade
→ Feature Agent implementa em worktree
   └─ avalia se a spec toca contrato externo (heurística)
      ├─ sim → Architecture aconselha (ADR) → Review
      └─ não → Review
→ HITL gate (FDE aprova)
→ Eval gate (PromptFoo)
→ SRE monitora e realimenta
```

## 7. In scope

- [ ] Heurística determinística `_toca_contrato_externo(spec)` no `feature_node.py` (keywords: `contrato externo`, `fapi-br`, `endpoint externo`, `schema`, `manual de apis`, `oauth`, `token`).
- [ ] `feature_node` retorna campo `toca_contrato_externo: bool` no estado (quando domínio backend).
- [ ] `graph/__init__.py`: substituir `architecture_enabled: bool` por aresta condicional `fan_in → {architecture | review}` baseada em `state["toca_contrato_externo"]`.
- [ ] Remover a flag global `architecture_enabled` do `build_graph`.
- [ ] Testes (Camada 1/harness): spec backend que toca contrato → Architecture acionado (ADR presente); spec backend rotineira → não acionado (sem ADR).

## 8. Out of scope

- [ ] Integração real A2A do Architecture (serviço externo) — Camada 2, depende de infra.
- [ ] Chamada tipo subagent com contexto isolado (desenho completo da decisão 7.3) — nesta rodada o Architecture continua como nó do grafo, só com acionamento condicional.
- [ ] Mudanças no Review Agent, HITL, Eval ou SRE.
- [ ] Multi-tenancy (ADR-0015).

## 9. Inputs

- `BoardState` com `spec` (texto sanitizado) e `domino` (backend/frontend/ambos).
- `feature_node.py` — nó Feature (será estendido com a heurística).
- `graph/__init__.py` — montagem do grafo (aresta condicional).

## 10. Outputs

- `feature_node.py` com `_toca_contrato_externo` e campo `toca_contrato_externo` no retorno.
- `graph/__init__.py` com aresta condicional `fan_in → {architecture | review}`.
- `build_graph` sem `architecture_enabled`.
- Testes novos em `tests/`.

## 11. Existing assets to reuse

- `src/open_agentic_ops/nodes/feature_node.py` — nó Feature (será estendido).
- `src/open_agentic_ops/nodes/architecture_node.py` — nó Architecture (aconselha via ADR; sem mudança de lógica).
- `src/open_agentic_ops/graph/__init__.py` — montagem do grafo (aresta condicional).
- `src/open_agentic_ops/state/__init__.py` — `BoardState`, `Dominio`.
- `tests/test_graph.py` — testes existentes a preservar/atualizar.
- Padrão de heurística determinística já usado no Intake (`intake.py`).

## 12. Constraints

- Stack tudo-Python (LangGraph + LangSmith).
- Hexagonal leve só nas bordas.
- PII mascarada na fronteira de entrada (LGPD/FAPI-BR).
- Protocolo por modo de interação (MCP vs A2A).
- Gates HITL e Eval obrigatórios.
- Checkpointer = board.
- Camada 1 (harness + testes) — fallbacks determinísticos, sem infra real.

## 13. Acceptance criteria

- [ ] `feature_node` (backend) retorna `toca_contrato_externo: bool` no estado.
- [ ] Spec backend que toca contrato externo → Architecture acionado (ADR presente no estado).
- [ ] Spec backend rotineira → Architecture **não** acionado (sem ADR).
- [ ] `build_graph` não tem mais `architecture_enabled`.
- [ ] `poetry run pytest` verde; `poetry run ruff check .` limpo.

## 14. Risks and ambiguities

- O caso-âncora (`test_fluxo_completo_caso_ancora`) usa spec regulatória com "portabilidade", "Manual de Escopo", "Instrução Normativa" — precisa garantir que a heurística detecte contrato externo nesse caso (senão o teste quebra).
- A heurística é determinística e pode gerar falso negativo/positivo — aceitável na Camada 1; o reasoner real (LLM) fica para Camada 2.
- Remover `architecture_enabled` pode quebrar chamadas existentes ao `build_graph` — verificar todos os call sites (API, testes).

## 15. Recommended implementation boundaries

- Não adicionar UI nova.
- Não adicionar HTTP API pública nova.
- Não adicionar banco de dados separado (checkpointer é o board).
- Não usar dados reais de cliente.
- Não criar QA Agent separado.
- Não implementar a chamada tipo subagent com contexto isolado nesta rodada.

## 16. Suggested OpenSpec change name

`feature-architecture-gatilho-dinamico`

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
- docs/sdd/feature-intakes/feature-architecture-gatilho-dinamico.md
- prompts/
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/feature-architecture-gatilho-dinamico.md

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
/opsx:propose feature-architecture-gatilho-dinamico

Use o briefing de:
docs/sdd/feature-intakes/feature-architecture-gatilho-dinamico.md

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
