## ADDED Requirements

### Requirement: Representação do fan-out/fan-in dos worktrees no /graph

O sistema SHALL representar no `/graph` o fan-out dos worktrees backend/frontend em paralelo a partir do Intake e o fan-in convergindo no Review.

#### Scenario: Fan-out do Intake para os worktrees paralelos

- **WHEN** o FDE abre `/graph`
- **THEN** o grafo mostra arestas de `intake` para `feature_backend` e `feature_frontend` (paralelos)

#### Scenario: Fan-in dos worktrees no Review

- **WHEN** o FDE abre `/graph`
- **THEN** o grafo mostra arestas de `feature_backend` e `feature_frontend` convergindo em `review`

### Requirement: Aresta de fechamento SRE→Intake no /graph

O sistema SHALL representar no `/graph` a aresta de fechamento do SRE de volta ao Intake (ADR-0010), realimentando o board como 4ª origem.

#### Scenario: Ciclo Monitor → Intake

- **WHEN** o FDE abre `/graph`
- **THEN** o grafo mostra uma aresta de `monitor` para `intake` (fechamento do loop SRE→Intake)

### Requirement: Dashboard continua funcional com os worktrees divididos

O sistema SHALL manter o dashboard (`LoopStatus`) funcional quando `montarStages` retorna `feature_backend` e `feature_frontend` em vez de um único `feature`.

#### Scenario: Dashboard renderiza os stages divididos

- **WHEN** o dashboard renderiza o `LoopStatus` com a nova lista de stages
- **THEN** os stages `feature_backend` e `feature_frontend` são exibidos sem erro
