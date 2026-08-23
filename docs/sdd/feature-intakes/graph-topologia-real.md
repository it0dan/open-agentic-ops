# Feature Intake Brief — Graph: topologia real (fan-out/fan-in + SRE→Intake)

## 1. Feature name

`graph-topologia-real`

## 2. Business context

O console do FDE (`/graph`) é a janela visual da topologia da squad. Hoje ele
mostra um fluxo linear simplificado, mas a arquitetura real do grafo LangGraph
(ARCHITECTURE.md) tem ramificações que o FDE precisa enxergar para operar a
squad com fidelidade — especialmente quando há worktrees paralelos e o loop de
fechamento do SRE.

## 3. User / persona

- FDE (Forward Deployed Engineer) — opera a squad pelo console.

## 4. Problem statement

O `loop-canvas.tsx` monta as arestas sempre de forma sequencial
(`source: stages[i].id, target: stages[i+1].id`), representando uma topologia
linear. A arquitetura real (ARCHITECTURE.md) tem:

- **fan-out/fan-in** dos worktrees backend/frontend em paralelo
  (`feature_backend`/`feature_frontend` → `platform` → `fan_in`);
- **aresta de fechamento SRE→Intake** (ADR-0010): o SRE realimenta o board como
  4ª origem passando pelo Intake.

Esses elementos não são visualizados no `/graph`. **Esta rodada é apenas para
registrar a decisão pendente** — não para implementar.

## 5. Feature intention

Representar no `/graph` a topologia real do grafo: fan-out/fan-in dos worktrees
paralelos e a aresta de fechamento SRE→Intake, para que o FDE veja a squad como
ela realmente opera.

## 6. Expected user journey

```txt
FDE abre /graph
→ vê o fluxo principal (Intake → … → SRE)
→ vê o fan-out backend/frontend em paralelo
→ vê a aresta de fechamento SRE → Intake (loop)
```

## 7. In scope

- [ ] Representar fan-out/fan-in dos worktrees backend/frontend no `loop-canvas.tsx`
- [ ] Representar a aresta de fechamento SRE→Intake (ADR-0010)
- [ ] Manter coerência com o glossário (CONTEXT.md: Grafo ≠ Loop)

## 8. Out of scope

- [ ] Implementação nesta rodada — apenas registro da decisão pendente
- [ ] Mudanças no runtime Python (grafo LangGraph)
- [ ] Alterações de comportamento de UI já validado

## 9. Inputs

- `ARCHITECTURE.md` (diagrama C4 nível 3 do grafo)
- `docs/adr/0010-feed-board-back-through-intake.md`
- `frontend/components/loop-canvas.tsx` (montagem atual das arestas)
- `frontend/lib/loop-stages.ts` (estágios exibidos)

## 10. Outputs

- Esta decisão registrada como pendente (intake + nota no HANDOFF)
- (Futuro) atualização do `loop-canvas.tsx` e `loop-stages.ts`

## 11. Existing assets to reuse

- `ARCHITECTURE.md` — diagrama do grafo com fan-out/fan-in e SRE→Intake
- `docs/adr/0010-feed-board-back-through-intake.md`
- `frontend/components/loop-canvas.tsx`
- `frontend/lib/loop-stages.ts`

## 12. Constraints

- Alinhar ao CONTEXT.md (Grafo = topologia inter-agente; Loop = intra-agente)
- Respeitar ADR-0010 (SRE realimenta passando pelo Intake)
- Não alterar o runtime Python nesta rodada

## 13. Acceptance criteria

- [ ] Gap documentado como decisão pendente (não como bug esquecido)
- [ ] Referência cruzada ao intake a partir do HANDOFF.md

## 14. Risks and ambiguities

- Representar fan-out/fan-in pode exigir layout não-linear no React Flow
  (posições manuais ou algoritmo de layout).
- A aresta de fechamento SRE→Intake é um ciclo; precisa de tratamento visual
  para não poluir o grafo.

## 15. Recommended implementation boundaries

- Não implementar nesta rodada.
- Quando implementar, manter o `/graph` legível (evitar cruzamento excessivo de arestas).

## 16. Suggested OpenSpec change name

`graph-topologia-real`

## 17. Suggested safe analysis prompt

_(a definir quando a implementação for iniciada)_

## 18. Suggested OpenSpec propose prompt

_(a definir quando a implementação for iniciada)_
