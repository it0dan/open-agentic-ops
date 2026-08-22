# Portar run_all_evals.sh e integrar com LangSmith no Eval gate

## Status

Accepted

## Context

O Eval gate usa PromptFoo como condição de deploy. O credit-analysis-agent tem um `run_all_evals.sh` validado (renova token, roda configs PromptFoo serializadas). O ADR-0008 coloca LangSmith como camada de avaliação. Faltava definir como o Eval gate é implementado.

## Decision

Portar o **`run_all_evals.sh`** do credit-analysis-agent como ponto de partida do Eval gate (renovar token do AI Gateway, rodar configs PromptFoo serializadas, abortar na primeira falha), **integrando com LangSmith** como plataforma de avaliação (traces/runs dos nós).

## Consequences

- Reaproveita o padrão validado do credit-analysis (menos risco).
- LangSmith fornece a visão de avaliação agêntica; PromptFoo o gate declarativo.
- Requer adaptar o script para o grafo LangGraph (novos configs por nó).
