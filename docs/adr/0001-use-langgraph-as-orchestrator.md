# Usar LangGraph como orquestrador/board único da squad

## Status

Accepted

## Context

A squad é uma topologia entre agentes (Intake → branch de ambiguidade → Feature Agents paralelos → Review/Architecture → HITL → Eval → SRE), não um único loop. O handoff original previa um loop LLM-directed artesanal (`while finish_reason == "tool_calls"`) reaproveitado do credit-analysis-agent. Com a decisão de adotar Graph Engineering como eixo inter-agente, precisávamos de um runtime que modelasse a topologia inteira como grafo, não apenas o loop de uma instância.

## Decision

Adotar **LangGraph nativo** como orquestrador/board único da squad. Um único grafo supervisor modela a topologia inteira: nós (agentes), arestas e arestas condicionais (branch de ambiguidade, fan-out/fan-in dos worktrees), checkpointers e `interrupt()` para HITL. Cada agente é um nó do grafo. O loop intra-agente de tool-calling continua existindo dentro de cada nó (Loop Engineering), mas a orquestração entre agentes é o grafo (Graph Engineering).

## Consequences

- A topologia da squad fica visível e executável como grafo — "squad = grafo de loops".
- O loop artesanal do credit-analysis-agent não é reaproveitado para orquestração; só os padrões auxiliares (JWT, OTel, evals) são portados.
- O checkpointer do grafo vira a persistência de estado (ver ADR-0002).
- Curva de aprendizado de LangGraph para o time; dependência de um framework de orquestração.
