# Proposal — Squad Open Agentic Ops

## Problema

Operar o ciclo de vida de Open Finance (norma regulatória, demanda de cliente, decisão estratégica, sinal de produção) exige um time que traduza demanda em spec, implemente por domínio, revise, aprove e monitore — com supervisão humana mínima e auditável. Hoje isso é feito por um time humano tradicional, com gargalo de julgamento e sem automação da topologia entre agentes.

## Solução

Uma squad majoritariamente agêntica, orquestrada por um **grafo LangGraph** (Graph Engineering), que absorve o ciclo completo: Intake classifica ambiguidade → Feature Agents implementam em worktrees paralelos → Review/Architecture aconselham → HITL gate (FDE aprova) → Eval gate (PromptFoo) → SRE monitora e realimenta o board. Um único FDE (humano) é o ponto de julgamento onde a ambiguidade exige.

### Escopo

- **6 agentes + 2 gates:** Intake, Feature (backend/frontend, nó genérico parametrizado por Guia), Platform, Review, Architecture, SRE; HITL gate e Eval gate.
- **2 protocolos:** MCP (X-as-a-Service: Intake, Platform, SRE) e A2A (Collaboration/Facilitating: Architecture, Review), definidos pelo modo de interação.
- **Fluxo HITL/eval:** `interrupt()` do LangGraph + Redis/SSE para notificar o FDE; `POST /resume` como ponte; PromptFoo como gate de deploy.
- **Orquestração de 2 worktrees paralelos:** fan-out/fan-in no grafo, git via ToolExecutionPort/MCP.
- **Retomada da spec do FDE:** em alta ambiguidade, o FDE autora a spec em `openspec/` e a injeta no grafo via `POST /resume` (mesma ponte do HITL), continuando o fluxo.
- **Loop de fechamento do SRE:** o SRE gera task que realimenta o board como 4ª origem, **passando pelo Intake** (mesmo funil das outras 3 origens).

### Stack

- **Python + LangGraph** (orquestração stateful, checkpointer como board).
- **LangSmith** (tracing agêntico, avaliação) + **OTel** (infra/métricas).
- **Hexagonal leve só nas bordas:** LLMProviderPort, ToolExecutionPort (MCP), PersistencePort (checkpointer), NotificationPort (HITL).
- **PII:** mascaramento na fronteira de entrada (Intake), ancorado em classificação LGPD, informado pelo perfil de segurança do Open Finance (FAPI-BR). Aplicado em todas as fronteiras (comunicação, checkpointer, telemetria, evals, logs). Implementado como skill (`pii-sanitizer`) como guia + módulo de redação determinístico como ferramenta.
- **Eval gate:** portar o `run_all_evals.sh` do credit-analysis-agent (renovar token, configs PromptFoo serializadas) como ponto de partida, integrando com LangSmith como plataforma de avaliação.

### Caso de uso âncora

Nova Instrução Normativa do BCB altera o Manual de Escopo de Dados e Serviços do Open Finance, introduzindo um campo ligado à portabilidade de crédito consignado (campo fictício/ilustrativo). Entra via FDE (alta ambiguidade). Backend toca contrato externo regulado → aciona Architecture Agent; frontend é rotineiro → não escala. Convergem → HITL → Eval → deploy → SRE monitora.

## Resultados esperados

- Squad capaz de levar uma demanda de Open Finance do board ao deploy monitorado com supervisão humana mínima (só o FDE no HITL gate).
- Topologia da squad visível e executável como grafo (Graph Engineering), com checkpointer como board.
- PII protegida por construção (mascarada na fronteira, nunca raw no sistema).
- Qualidade garantida pelo harness (Sensores + Eval gate), sem QA Agent separado.
- Reaproveitamento dos padrões validados do credit-analysis-agent (JWT via AI Gateway, OTel, evals), sem o loop artesanal.

## Non-goals

- Não criar um board separado (o checkpointer é o board).
- Não usar Clean Architecture completa/DDD tático (a lógica mora no system prompt).
- Não misturar TypeScript no runtime (stack tudo-Python).
- Não criar QA Agent separado.

## Referências

- Arquitetura: `Inicio/sensedia-open-agentic-ops.md`, `Inicio/diagrama-squad-open-agentic-ops-texto.md`.
- Decisões: `docs/adr/`, `Inicio/HANDOFF-squad-agentica.md`.
- Visão estrutural: `ARCHITECTURE.md`.
- Glossário: `CONTEXT.md`.
