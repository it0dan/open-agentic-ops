# Realimentar o board via Intake (4ª origem)

## Status

Accepted

## Context

O design diz que o SRE gera task que realimenta o board como 4ª origem, fechando o loop pelas duas pontas. Faltava definir se essa task passa pelo Intake ou vai direto ao Feature Agent.

## Decision

O SRE gera a task e ela **entra no board passando pelo Intake** (mesmo funil das outras 3 origens). O Intake classifica domínio e ambiguidade da task do SRE como faria com qualquer outra origem.

## Consequences

- Fecha o loop pelas duas pontas: Intake = fora→dentro, SRE = dentro→fora que volta a entrar.
- Triagem uniforme — a task do SRE não pula a classificação de ambiguidade.
- O diagrama de arquitetura reflete essa passagem pelo Intake.
