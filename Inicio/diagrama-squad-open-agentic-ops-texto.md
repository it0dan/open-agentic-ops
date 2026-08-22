# Diagrama — Fluxo da Squad Open Agentic Ops (descrição textual)

Este documento descreve, em texto puro, o diagrama de workflow da squad Open Agentic Ops — sem depender de imagem, cor ou layout visual. Serve como fonte para qualquer LLM texto-a-texto reconstruir ou raciocinar sobre a estrutura do fluxo.

---

## 1. Legenda de cores (mapeamento por tipo Team Topologies)

O diagrama visual usa cor para indicar o tipo de time (Team Topologies) de cada nó. O mapeamento é:

- **Stream-aligned** → verde-água (teal). Nós: Feature Agent (backend), Feature Agent (frontend).
- **Platform** → azul. Nós: Intake Agent, Platform Agent, SRE Agent.
- **Enabling** → roxo. Nós: Review Agent.
- **Complicated-subsystem** → coral. Nós: Architecture Agent.
- **Processo / humano** (neutro, sem cor de categoria) → cinza. Nós: as 4 origens, Baixa/Alta ambiguidade, HITL gate, Eval gate.

A cor não é decorativa: ela reforça que Intake Agent, Platform Agent e SRE Agent são o mesmo tipo de peça na topologia (Platform), mesmo aparecendo em pontos diferentes do fluxo.

---

## 2. Lista de nós (com atributos)

| # | Nó | Tipo Team Topologies | Protocolo | Papel resumido |
|---|---|---|---|---|
| 1 | Cliente | — (origem externa) | — | Demanda de cliente entra no board |
| 2 | Regulatório · Informes | — (origem externa) | — | Demanda regulatória entra no board (fase 1: manual) |
| 3 | Estratégia · Sensedia | — (origem externa) | — | Demanda estratégica interna entra no board |
| 4 | SRE (produção) | — (origem interna) | — | Sinal de produção realimenta o board como origem |
| 5 | Intake Agent | Platform (extensão) | MCP (X-as-a-Service + trigger) | Classifica domínio e ambiguidade das 4 origens |
| 6 | Baixa ambiguidade | processo/decisão | — | Resultado: Intake rascunha a spec sozinho |
| 7 | Alta ambiguidade | processo/decisão | — | Resultado: escalona para o FDE autorar a spec |
| 8 | Feature Agent (backend) | Stream-aligned | — | Implementa a feature no domínio backend (worktree A) |
| 9 | Architecture Agent | Complicated-subsystem | A2A (Collaboration) | Discussão síncrona sobre contrato de API/compliance, só no worktree backend |
| 10 | Platform Agent (instância única, chamada por ambos os worktrees) | Platform | MCP (X-as-a-Service) | Testes, lint, deploy, observabilidade |
| 11 | Review Agent (worktree A) | Enabling | A2A (Facilitating) | Feedback de PR do backend |
| 12 | Feature Agent (frontend) | Stream-aligned | — | Implementa a feature no domínio frontend (worktree B) |
| 13 | Review Agent (worktree B) | Enabling | A2A (Facilitating) | Feedback de PR do frontend |
| 14 | HITL gate | processo/humano | — | FDE aprova o merge |
| 15 | Eval gate | processo | — | Trajectory eval (PromptFoo) antes do deploy |
| 16 | SRE Agent | Platform (extensão) | MCP (X-as-a-Service + trigger) | Monitora SLOs/error budget pós-deploy |

Nota: o nó 16 (SRE Agent) e a origem 4 (SRE — produção) são o mesmo agente em dois momentos do ciclo: ele aparece no fim do fluxo como quem monitora, e no início como uma das 4 origens que alimentam o Intake — é o que fecha o loop.

O FDE não é um nó do diagrama — é um papel humano que se conecta a três pontos: recebe escalonamento da "Alta ambiguidade" (nó 7), aprova no HITL gate (nó 14), e recebe escalonamento por pausa quando Architecture Agent (nó 9) ou Review Agent (nós 11/13) discordam de uma classificação do Intake em andamento.

---

## 3. Fluxo sequencial (arestas, em ordem de leitura de cima para baixo)

```
[Cliente] ─┐
[Regulatório · Informes] ─┤
[Estratégia · Sensedia] ─┼──> [Intake Agent]
[SRE (produção)] ─┘

[Intake Agent] ──classifica ambiguidade──> ramifica em dois caminhos:

  caminho 1: [Baixa ambiguidade] ──"Intake rascunha a spec"──┐
  caminho 2: [Alta ambiguidade] ──"escalona para o FDE, que autora a spec"──┤
                                                                             │
                                              (os dois caminhos convergem para "spec pronta")
                                                                             ▼
                                          divide em 2 tarefas paralelas (git worktrees)

  ┌─────────────────────────────────────┐        ┌─────────────────────────────────────┐
  │ WORKTREE A — BACKEND                 │        │ WORKTREE B — FRONTEND                │
  │                                       │        │                                       │
  │ [Feature Agent (backend)]            │        │ [Feature Agent (frontend)]           │
  │        │                              │        │        │                              │
  │        ▼                              │        │        ▼                              │
  │  ┌──────────────┐  ┌───────────────┐ │        │  [Platform Agent]                    │
  │  │Architecture   │  │Platform Agent │ │        │        │                              │
  │  │Agent          │  │               │ │        │        ▼                              │
  │  │(se tocar em   │  │(testes, lint, │ │        │  [Review Agent]                      │
  │  │contrato       │  │deploy)        │ │        │  (se discordar do Intake em          │
  │  │externo)       │  │               │ │        │   andamento → pausa, escala FDE)     │
  │  │(se discordar  │  │               │ │        │                                       │
  │  │do Intake em   │  │               │ │        └───────────────────┬───────────────────┘
  │  │andamento →    │  │               │ │                            │
  │  │pausa, escala  │  │               │ │                            │
  │  │FDE)           │  │               │ │                            │
  │  └──────┬────────┘  └───────┬───────┘ │                            │
  │         └──────────┬────────┘         │                            │
  │                     ▼                  │                            │
  │              [Review Agent]            │                            │
  │        (se discordar do Intake em      │                            │
  │         andamento → pausa, escala FDE) │                            │
  └──────────────────────┬────────────────┘                            │
                          │                                             │
                          └──────────────┬──────────────────────────────┘
                                         ▼
                              as duas PRs convergem
                                         │
                                         ▼
                                 [HITL gate]
                    "FDE aprova o merge — inclusive specs
                     que o Intake rascunhou sozinho"
                                         │
                                         ▼
                                 [Eval gate]
                       "PromptFoo trajectory eval → deploy"
                                         │
                                         ▼
                                [SRE Agent]
                    "monitora SLOs e error budget em produção"
                                         │
                                         ▼
                    ↻ realimenta o Intake Agent como 4ª origem
                      (fecha o loop de volta ao topo do fluxo)
```

---

## 4. Pontos de decisão e regras associadas (explícitas, para não se perderem na descrição textual)

1. **Decisão no Intake Agent:** classifica cada item por `domínio` (backend/frontend) e `ambiguidade` (baixa/alta).
   - Baixa ambiguidade + já existe precedente → Intake rascunha a spec sozinho, sem envolver o FDE na autoria.
   - Alta ambiguidade (interpretação regulatória nova, decisão estratégica, contrato sem precedente) → escalona para o FDE, que autora a spec.
2. **Decisão de escalonamento no Architecture Agent:** só é acionado pelo Feature Agent (backend) quando a mudança toca um contrato de API externo/regulado. Segue o Architecture Advice Process — aconselha via ADR, não veta; a decisão final fica com o Feature Agent.
3. **Regra de discordância em andamento:** se Architecture Agent ou Review Agent, em qualquer um dos dois worktrees, discordar da classificação de ambiguidade que o Intake deu a um item que já está em execução, a tarefa **pausa e escala para o FDE** — sem distinção de severidade entre os dois agentes.
4. **HITL gate:** é sempre o FDE que aprova, mesmo quando a spec foi autorada só pelo Intake (nunca há merge sem humano na cadeia).
5. **Auditoria periódica (não aparece como nó no fluxo em tempo real, mas é um mecanismo de fundo):** o FDE revisa periodicamente as classificações que o Intake fez como "baixa ambiguidade". Se encontrar erro, a correção é **sempre prospectiva** — realimenta a heurística/skill do Intake para classificações futuras, mas **nunca reabre** um item que já foi implementado e passou pelos gates.
6. **Loop de fechamento:** o SRE Agent, ao final do fluxo, não gera apenas uma tarefa avulsa — ele alimenta o mesmo board de onde as outras 3 origens (Cliente, Regulatório/Informes, Estratégia/Sensedia) partem. É isso que faz o sistema fechar como loop pelas duas pontas: Intake Agent = entrada de fora para dentro (mercado/cliente/regulador), SRE Agent = saída de dentro para fora (produção) que volta a entrar.

---

## 5. Critério de protocolo (MCP vs. A2A), para reforço textual

O protocolo de cada nó não depende de "quem está do outro lado" (todos são agentes rodando o mesmo runtime LLM-directed) — depende do **modo de interação**:

- **X-as-a-Service / trigger** (contrato fixo, pergunta → resposta determinística, sem negociação) → protocolo **MCP**. Se aplica a: Intake Agent, Platform Agent, SRE Agent.
- **Collaboration / Facilitating** (diálogo aberto, síncrono, ida-e-volta até convergir num julgamento) → protocolo **A2A**. Se aplica a: Architecture Agent, Review Agent.
- Nós de processo/humano (HITL gate, Eval gate, FDE) não têm protocolo agente-agente — a interface é humana ou de checkpoint, não uma troca entre dois agentes.
