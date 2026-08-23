# Feature Intake Brief — graph-topologia-real

## 1. Feature name

`graph-topologia-real`

## 2. Business context

O console do FDE (`/graph`) é a janela visual da topologia da squad. Hoje ele mostra um fluxo linear simplificado, mas a arquitetura real do grafo LangGraph (ARCHITECTURE.md) tem ramificações que o FDE precisa enxergar para operar a squad com fidelidade — especialmente quando há worktrees paralelos e o loop de fechamento do SRE.

Esta rodada implementa a decisão pendente registrada em `docs/sdd/feature-intakes/graph-topologia-real.md` (item 10 dos próximos passos do HANDOFF).

## 3. User / persona

- FDE (Forward Deployed Engineer) — opera a squad pelo console e precisa ver a topologia real.

## 4. Problem statement

O `loop-canvas.tsx` monta as arestas sempre de forma sequencial (`source: stages[i].id, target: stages[i+1].id`), representando uma topologia linear. A arquitetura real (ARCHITECTURE.md) tem:

- **fan-out/fan-in** dos worktrees backend/frontend em paralelo (`feature_backend`/`feature_frontend` → `platform` → `fan_in` → `review`);
- **aresta de fechamento SRE→Intake** (ADR-0010): o SRE realimenta o board como 4ª origem passando pelo Intake.

Esses elementos não são visualizados no `/graph`.

## 5. Feature intention

Representar no `/graph` a topologia real do grafo: fan-out/fan-in dos worktrees paralelos (backend/frontend) e a aresta de fechamento SRE→Intake, para que o FDE veja a squad como ela realmente opera.

## 6. Expected user journey

```txt
FDE abre /graph
→ vê o fluxo principal (Intake → … → Monitor)
→ vê o fan-out backend/frontend em paralelo (Intake → Feature Backend e Feature Frontend)
→ vê o fan-in convergindo no Review
→ vê a aresta de fechamento Monitor → Intake (loop SRE→Intake, ADR-0010)
```

## 7. In scope

- [ ] `montarStages` (`loop-stages.ts`): dividir o stage `feature` em `feature_backend` e `feature_frontend` (worktrees paralelos).
- [ ] `loop-canvas.tsx`: montar nós e arestas com a topologia real — fan-out (`intake → feature_backend`, `intake → feature_frontend`), fan-in (`feature_backend → review`, `feature_frontend → review`), fluxo linear (`review → hitl → eval → deploy → monitor`) e ciclo (`monitor → intake`, ADR-0010).
- [ ] Posições padrão: backend e frontend em paralelo (y distinto), demais nós em linha.
- [ ] Manter coerência com o glossário (CONTEXT.md: Grafo ≠ Loop).

## 8. Out of scope

- [ ] Mudanças no runtime Python (grafo LangGraph).
- [ ] Alterações de comportamento de UI já validado (drawer do agente, HITL, eval).
- [ ] Representar `platform_node` e `architecture_node` como nós separados (mantém-se implícito no fluxo para legibilidade).
- [ ] Multi-tenancy (ADR-0015).

## 9. Inputs

- `ARCHITECTURE.md` (diagrama C4 nível 3 do grafo).
- `docs/adr/0010-feed-board-back-through-intake.md`.
- `frontend/components/loop-canvas.tsx` (montagem atual das arestas).
- `frontend/lib/loop-stages.ts` (estágios exibidos).
- `frontend/components/loop-status.tsx` (tipo `LoopStage`, usado no dashboard).

## 10. Outputs

- `frontend/lib/loop-stages.ts` — stages com `feature_backend`/`feature_frontend`.
- `frontend/components/loop-canvas.tsx` — topologia real (fan-out/fan-in + ciclo SRE→Intake).
- Validação: `npm run lint`, `npm run build`, `npm test`.

## 11. Existing assets to reuse

- `ARCHITECTURE.md` — diagrama do grafo com fan-out/fan-in e SRE→Intake.
- `docs/adr/0010-feed-board-back-through-intake.md`.
- `frontend/components/loop-canvas.tsx`.
- `frontend/lib/loop-stages.ts`.
- `frontend/components/loop-status.tsx` (tipo `LoopStage`).

## 12. Constraints

- Alinhar ao CONTEXT.md (Grafo = topologia inter-agente; Loop = intra-agente).
- Respeitar ADR-0010 (SRE realimenta passando pelo Intake).
- Não alterar o runtime Python nesta rodada.
- Manter o `/graph` legível (evitar cruzamento excessivo de arestas).
- `LoopStatus` (dashboard) continua iterando a lista de stages linearmente — não pode quebrar.

## 13. Acceptance criteria

- [ ] `montarStages` retorna `feature_backend` e `feature_frontend` (em vez de `feature`).
- [ ] `/graph` mostra fan-out (`intake → feature_backend`, `intake → feature_frontend`) e fan-in (`feature_backend → review`, `feature_frontend → review`).
- [ ] `/graph` mostra a aresta de fechamento `monitor → intake` (SRE→Intake, ADR-0010).
- [ ] Dashboard (`LoopStatus`) continua funcionando com a nova lista de stages.
- [ ] `npm run lint`, `npm run build` e `npm test` verdes.

## 14. Risks and ambiguities

- Dividir `feature` em `feature_backend`/`feature_frontend` afeta o dashboard (`LoopStatus`), que itera a lista — verificar que não quebra (ele não depende de ids específicos).
- A aresta de fechamento SRE→Intake é um ciclo; precisa de tratamento visual (curva/posição) para não poluir o grafo.
- Posições padrão precisam acomodar o paralelismo sem sobrepor nós.

## 15. Recommended implementation boundaries

- Não alterar o runtime Python.
- Não adicionar HTTP API pública nova.
- Não usar dados reais de cliente.
- Não criar QA Agent separado.
- Não representar `platform_node`/`architecture_node` como nós separados nesta rodada (mantém o grafo legível).

## 16. Suggested OpenSpec change name

`graph-topologia-real`

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
- docs/sdd/feature-intakes/graph-topologia-real.md
- prompts/
- src/
- tests/
- frontend/

Analise a feature descrita em:

docs/sdd/feature-intakes/graph-topologia-real.md

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
/opsx:propose graph-topologia-real

Use o briefing de:
docs/sdd/feature-intakes/graph-topologia-real.md

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
