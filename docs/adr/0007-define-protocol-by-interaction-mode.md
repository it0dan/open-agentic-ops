# Definir protocolo pelo modo de interação (MCP vs A2A)

## Status

Accepted

## Context

Todos os agentes da squad rodam o mesmo runtime LLM-directed. A dúvida era como escolher o protocolo de comunicação entre eles. O critério não é "quem está do outro lado" (todos são agentes), mas a natureza da troca.

## Decision

O protocolo é definido pelo **modo de interação (Team Topologies)**, não por "quem está do outro lado":
- **X-as-a-Service / trigger** (contrato fixo, pergunta→resposta determinística, sem negociação) → **MCP**. Aplica-se a Intake, Platform e SRE — que são nós do grafo que delegam a serviços reais via MCP.
- **Collaboration / Facilitating** (diálogo aberto, síncrono, ida-e-volta até convergir num julgamento) → **A2A**. Aplica-se a Architecture e Review — nós do grafo que chamam A2A via HTTP.

Nós de processo/humano (HITL gate, Eval gate, FDE) não têm protocolo agente-agente.

## Consequences

- A regra de protocolo é preservada dentro do grafo LangGraph.
- Intake/Platform/SRE delegam execução via MCP; Architecture/Review conversam via A2A HTTP.
- Evita a confusão de assumir protocolo pelo tipo de agente em vez do modo de interação.
