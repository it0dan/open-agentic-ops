# Retomar a spec do FDE via POST /resume

## Status

Accepted

## Context

No fluxo de alta ambiguidade, o Intake escala ao FDE, que autora a spec. Faltava definir como essa spec re-entra no grafo para continuar o fluxo (fan-out dos worktrees). O ADR-0005 já estabelece o `POST /resume` como ponte do HITL.

## Decision

A spec autorada pelo FDE re-entra no grafo via **`POST /resume`** (mesma ponte do HITL). O FDE escreve a spec em `openspec/` (padrão SDD/SPDD) e a injeta no estado do grafo via `POST /resume`, que continua o fluxo a partir do ponto pausado.

## Consequences

- Consistente com o ADR-0005 (interrupt + resume) — uma única ponte de retomada para o FDE.
- A spec vive em `openspec/` (rastreável, versionável), alinhada ao SDD/SPDD.
- O estado permanece no checkpointer; o grafo não reinicia do zero.
