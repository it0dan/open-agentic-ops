# Feature Intake Brief — hitl-por-etapa

## 1. Feature name

`hitl-por-etapa`

## 2. Business context

O HITL gate original era único e genérico: pausava uma vez no fim do fluxo para o FDE aprovar o resultado consolidado. Em um sistema regulado (Open Finance/FAPI-BR), o julgamento humano **por etapa** é mais auditável e reduz o risco de uma decisão binária sobre um pacote grande. Além disso, a oferta prevê evoluir a autonomia das etapas (de HITL total para LLM-as-a-judge e, eventualmente, autonomia plena em etapas de baixo risco) — o que exigiria reescrever o grafo a cada mudança sem um ponto único de configuração.

## 3. User / persona

- FDE (Forward Deployed Engineer) — aprova cada etapa individualmente.
- Liderança técnica / operações — audita o reasoning por etapa.

## 4. Problem statement

- Granularidade: o FDE só via o resultado final, sem aprovar/rejeitar cada etapa.
- Sem caminho de evolução de autonomia: não havia como configurar "quanto" cada etapa depende do humano sem reescrever o grafo.

## 5. Feature intention

Permitir que cada etapa do fluxo tenha seu próprio gate HITL, com o nível de autonomia configurado em uma matriz declarativa (ponto único), sem alterar o grafo ao migrar etapas de `humano` → `llm_judge` → `autonomo`.

## 6. Expected user journey

```txt
Intake → hitl_intake → (rascunha_spec | escala_fde → autoria_spec)
→ hitl_feature → feature_backend/frontend → hitl_platform → platform
→ fan_in → (hitl_architecture → architecture | ) → hitl_review → review
→ hitl_deploy → eval → deploy → hitl_sre → sre → END
```

O FDE aprova cada `hitl_*`; o console mostra a etapa pendente (`aguardando_etapa`) e o raciocínio da etapa.

## 7. In scope

- [x] Gate HITL genérico por etapa (`make_hitl_gate(etapa, autonomia)`).
- [x] Matriz de autonomia (`MATRIZ_AUTONOMIA`) + `autonomia_da_etapa`.
- [x] Nós `hitl_intake`, `hitl_feature`, `hitl_platform`, `hitl_review`, `hitl_architecture`, `hitl_deploy`, `hitl_sre` no grafo.
- [x] `aguardando_etapa` na API (`_etapa_pendente`).
- [x] Painel HITL por etapa + aba "Raciocínio" no console.
- [x] Testes de integração/API atualizados + testes da matriz de autonomia.

## 8. Out of scope

- [ ] LLM-as-a-judge real (fase 2) — `llm_judge` fica como fallback determinístico.
- [ ] Autonomia plena em produção (matriz permanece `humano` por padrão).
- [ ] Notificação push (Redis/SSE) real — permanece polling.

## 9. Inputs

- `src/open_agentic_ops/autonomia.py` — matriz + `autonomia_da_etapa`.
- `src/open_agentic_ops/gates/hitl_gate.py` — `make_hitl_gate`.
- `src/open_agentic_ops/graph/__init__.py` — nós e arestas dos gates por etapa.

## 10. Outputs

- Grafo com gates por etapa.
- `aguardando_etapa` nos endpoints `/tasks` e `/tasks/{thread_id}`.
- Painel HITL por etapa no console.
- ADR-0025, Feature Intake Brief, change OpenSpec `hitl-por-etapa`.

## 11. Existing assets to reuse

- `src/open_agentic_ops/gates/hitl_gate.py` (factory existente).
- `src/open_agentic_ops/state/__init__.py` (`DecisaoHitl`, `BoardState`).
- `api/main.py` (`_etapa_pendente`, `_resumo`, `_detalhe`).
- `frontend/app/(dashboard)/tasks/[threadId]/page.tsx` (painel HITL + aba Raciocínio).
- `docs/adr/` (template Nygard).

## 12. Constraints

- Stack tudo-Python (LangGraph + LangSmith).
- PII mascarada na fronteira de entrada (LGPD/FAPI-BR).
- Gates HITL e Eval obrigatórios.
- Checkpointer = board.
- Default de autonomia = `humano` (fail-safe em sistema regulado).

## 13. Acceptance criteria

- [x] Cada etapa tem seu gate HITL; o fluxo feliz exige aprovação em cada um.
- [x] `autonomia_da_etapa` retorna o nível configurado (default `humano`).
- [x] `autonomo` não pausa; `llm_judge` aprova via fallback; `humano` pausa via `interrupt()`.
- [x] `aguardando_etapa` exposto na API e refletido no console.
- [x] Testes de integração/API verdes; testes da matriz de autonomia adicionados.

## 14. Risks and ambiguities

- Mais pontos de pausa para o FDE (custo operacional) — mitigado pela matriz e pelo painel por etapa.
- `llm_judge` ainda é fallback determinístico (fase 2).

## 15. Recommended implementation boundaries

- Não implementar LLM-as-a-judge real.
- Não alterar o protocolo de interação (MCP/A2A).
- Não criar QA Agent separado.

## 16. Suggested OpenSpec change name

`hitl-por-etapa`

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
- docs/adr/*
- docs/sdd/feature-intakes/hitl-por-etapa.md
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/hitl-por-etapa.md

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
/opsx:propose hitl-por-etapa

Use o briefing de:
docs/sdd/feature-intakes/hitl-por-etapa.md

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
