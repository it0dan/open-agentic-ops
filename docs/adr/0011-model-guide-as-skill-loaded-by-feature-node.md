# Modelar o Guia como skill carregada pelo nó Feature Agent

## Status

Accepted

## Context

O design diz que a diferença entre Feature Agents (backend/frontend) é só o skill/Guia carregado. Faltava definir a mecânica concreta do Guia em termos de implementação.

## Decision

O **Guia é uma skill** (arquivo SKILL.md) carregada pelo nó Feature Agent e injetada no system prompt. O nó `feature_node` é genérico e parametrizado pelo Guia (backend ou frontend) — não há nós distintos por domínio.

## Consequences

- Fiel ao design ("skill de domínio = Guia, não agente novo").
- Reutiliza o mecanismo de skills já instalado no ambiente.
- Um único nó `feature_node` serve os dois domínios, diferenciados apenas pelo Guia.
