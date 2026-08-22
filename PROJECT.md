# Project Context — Sensedia Open Agentic Ops

## Problema

Operar o ciclo de vida de Open Finance (norma regulatória, demanda de cliente, decisão estratégica, sinal de produção) exige um time que traduza demanda em spec, implemente por domínio, revise, aprove e monitore — com supervisão humana mínima e auditável. Hoje isso é feito por um time humano tradicional, com gargalo de julgamento e sem automação da topologia entre agentes.

## Oportunidade

Criar uma squad majoritariamente agêntica, orquestrada por um grafo LangGraph (Graph Engineering), que absorve o ciclo completo: Intake classifica ambiguidade → Feature Agents implementam em worktrees paralelos → Review/Architecture aconselham → HITL gate (FDE aprova) → Eval gate (PromptFoo) → SRE monitora e realimenta o board. Um único FDE (humano) é o ponto de julgamento onde a ambiguidade exige.

## Usuários

- FDE (Forward Deployed Engineer) — único papel humano
- Solution Architects
- Solutions Analysts
- Liderança técnica
- Stakeholders de cliente
- Equipe de operações (SRE)

## Resultado esperado

Uma squad capaz de levar uma demanda de Open Finance do board ao deploy monitorado com supervisão humana mínima (só o FDE no HITL gate), com topologia visível e executável como grafo, PII protegida por construção e qualidade garantida pelo harness (Sensores + Eval gate).

## Princípios

- Não inventar fatos sobre cliente.
- Separar fatos, hipóteses e recomendações.
- Explicitar premissas.
- PII sempre mascarada na fronteira de entrada (LGPD/FAPI-BR).
- Nenhum merge sem humano na cadeia (FDE no HITL gate).
- Correção de auditoria do FDE é sempre prospectiva.
- Manter trilha de decisão (ADRs) e versionamento.
