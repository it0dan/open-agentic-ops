# Sensedia Open Agentic Ops

**Squad agêntica autônoma que opera o ciclo de vida de Open Finance — de norma regulatória, demanda de cliente ou decisão estratégica até deploy monitorado — com um único FDE garantindo julgamento humano onde a ambiguidade exige.**

> Rascunho de trabalho. Consolida as decisões de arquitetura, fluxo e naming fechadas até aqui. Identidade visual segue pendente do brand book Sensedia; os exemplos de cenário abaixo usam um caso regulatório real como gancho, mas o campo técnico específico é ilustrativo (ver Caveats).

---

## O que é

Open Agentic Ops é um time composto majoritariamente por agentes de IA — não um copiloto, não uma automação pontual — que absorve o ciclo completo de desenvolvimento e conformidade de Open Finance: entender uma demanda (regulatória, de cliente, ou estratégica), traduzi-la em especificação técnica, implementá-la em paralelo por domínio (backend/frontend), submeter a revisão e aprovação, e monitorar o resultado em produção — fechando o loop de volta para novas demandas.

A oferta comercial fica ao lado do Sensedia AI Gateway no portfólio: onde o AI Gateway resolve a camada de execução e governança de agentes e modelos, o Open Agentic Ops resolve a camada de **operação de squad** — como uma organização gerencia o trabalho de um time majoritariamente agêntico com supervisão humana mínima e auditável.

**Diferencial central:** um único FDE (Forward Deployed Engineer) sustenta todo o sistema — não porque o volume de demanda é baixo, mas porque a squad tem uma camada de triagem (Intake Agent) que absorve o trabalho repetível e só escala para o humano onde há ambiguidade real. O FDE não é gargalo; é o ponto de julgamento.

---

## Cenários de exemplo

### 1. Regulatório — alta ambiguidade (caso-âncora)

Uma nova Instrução Normativa do Banco Central altera o Manual de Escopo de Dados e Serviços do Open Finance, introduzindo um campo novo ligado à portabilidade de crédito consignado. *(O evento é real e previsto — atualizações desse tipo de manual acontecem com frequência; o campo específico usado nos exemplos técnicos é fictício e ilustrativo.)*

- Entra pela origem **Regulatório/Informes** (fase 1: sinalizado manualmente por alguém que acompanha os atos normativos do BCB).
- Intake Agent classifica: interpretação regulatória nova, sem precedente → **alta ambiguidade** → escalona pro FDE.
- FDE autora a spec e a divide em duas tarefas paralelas, cada uma em seu próprio git worktree:
  - **Backend** — novo campo no contrato da API de dados/consentimento + trilha de auditoria. Toca contrato externo regulado → aciona o **Architecture Agent** (Collaboration síncrona, registra ADR).
  - **Frontend** — reflete o campo na tela de consentimento. Rotineiro, não escala Architecture.
- Ambas passam por Platform Agent (testes/lint/deploy) e Review Agent (feedback de PR).
- Convergência → HITL gate (FDE aprova o merge) → Eval gate (PromptFoo) → deploy → SRE Agent monitora.

### 2. Cliente — baixa ambiguidade

Um cliente pede um ajuste rotineiro: por exemplo, um campo adicional de metadado numa resposta de API já existente, sem impacto em contrato regulado.

- Entra pela origem **Cliente**.
- Intake Agent reconhece precedente (skill de domínio já cobre esse tipo de mudança) → **baixa ambiguidade** → Intake rascunha a spec sozinho, sem envolver o FDE na autoria.
- Segue direto pro Feature Agent do domínio correspondente, Platform Agent, Review Agent.
- FDE só entra no **HITL gate**, como aprovador — não como autor.

### 3. Estratégia/Sensedia — alta ambiguidade (típica, não excepcional)

A liderança de Solutions decide expor uma nova capacidade do AI Gateway como parte da oferta de Open Finance, exigindo mudança de posicionamento técnico e de contrato de API interno.

- Entra pela origem **Estratégia/Sensedia**.
- Decisões estratégicas raramente têm precedente direto — por isso a squad assume, por desenho, que a maior parte dessa origem escalona pro FDE. Isso é aceito como propriedade do sistema: o gargalo do FDE se concentra onde o julgamento importa mais, não onde o volume é maior.

### 4. SRE — origem interna, fechando o loop

Pós-deploy do cenário 1, o SRE Agent detecta que o error budget de um endpoint da API de consentimento está sendo consumido acima do esperado.

- SRE Agent gera uma task automaticamente e a envia ao **mesmo board**, como uma 4ª origem (não um sistema separado).
- Segue o mesmo funil: Intake classifica ambiguidade e decide se resolve sozinho ou escala.
- Isso é o que fecha a topologia como loop pelas duas pontas: Intake Agent = fora→dentro (mercado/cliente/regulador), SRE Agent = dentro→fora (produção).

---

## Squad — agentes e papéis

| Agente | Tipo (Team Topologies) | Modo de interação | Protocolo | Responsabilidade central | Quem aciona |
|---|---|---|---|---|---|
| **Intake Agent** | Platform (extensão) | X-as-a-Service + trigger | MCP | Recebe as 4 origens (Cliente, Regulatório/Informes, Estratégia/Sensedia, SRE), classifica domínio e ambiguidade. Baixa ambiguidade + precedente → rascunha spec e envia direto ao Feature Agent. Alta ambiguidade → escalona ao FDE | Automático, contínuo (entrada manual na fase 1, automatizada na fase 2) |
| **FDE** *(papel humano, não agente)* | — | — | — | (1) Autoria de spec só quando o Intake escalona por alta ambiguidade; (2) aprovador único no HITL gate, inclusive itens autorados pelo Intake; (3) auditor periódico das classificações do Intake — correção é sempre prospectiva, nunca reabre trabalho já implementado | Acionado pelo Intake (escalonamento), pelo HITL gate, ou por pausa de Review/Architecture Agent |
| Feature Agent (backend) | Stream-aligned | — (dono do próprio loop) | — | Implementa a feature no domínio backend, com skill de backend como Guia | Intake Agent (spec pronta) ou FDE |
| Feature Agent (frontend) | Stream-aligned | — (dono do próprio loop) | — | Implementa a feature no domínio frontend, com skill de frontend como Guia | Intake Agent (spec pronta) ou FDE |
| Platform Agent | Platform | X-as-a-Service | MCP | Testes, lint, deploy, observabilidade como serviço — instância única, agnóstica de stack, atende os dois Feature Agents | Chamado por qualquer Feature Agent |
| Review Agent | Enabling | Facilitating | A2A | Feedback de PR contra padrões do time; orienta, não bloqueia por decreto. **Se discordar da classificação do Intake em andamento → pausa e escala pro FDE** | Chamado ao abrir PR |
| Architecture Agent | Complicated-subsystem | Collaboration | A2A | Discussão síncrona time-boxed em contrato de API externo/compliance; segue o Architecture Advice Process, registra ADR — aconselha, não veta. **Se discordar da classificação do Intake em andamento → pausa e escala pro FDE** | Acionado pelo Guia do Feature Agent ao detectar área sensível |
| SRE Agent | Platform (extensão) | X-as-a-Service + trigger | MCP | Monitora SLOs/error budget; gera task automática pós-deploy **e alimenta o board como 4ª origem** — fecha a topologia em loop pelas duas pontas | Automático, contínuo |
| HITL gate | processo | — | — | Aprovação humana (FDE) antes do merge — inclusive specs autoradas só pelo Intake | Após o Review Agent |
| Eval gate | processo | — | — | Trajectory eval (PromptFoo) como gate de deploy | Após o HITL gate |

**Por que protocolo MCP em alguns agentes e A2A em outros, mesmo sendo todos agentes:** o critério não é "há um agente do outro lado", é a natureza da troca. **X-as-a-Service** (contrato fixo, pergunta→resposta determinística, sem negociação) = **MCP** — caso do Intake, Platform e SRE. **Collaboration/Facilitating** (diálogo aberto, ida-e-volta até convergir num julgamento) = **A2A** — caso do Architecture e Review Agent. O protocolo descreve o formato do contrato de interação, não o que o agente é.

---

## Workflow / loop

1. As 4 origens (Cliente, Regulatório/Informes, Estratégia/Sensedia, SRE) alimentam um board único, cada item tagueado por `origem`, `ambiguidade`, `spec_autor`.
2. **Intake Agent** classifica domínio e ambiguidade:
   - **Baixa ambiguidade + precedente existente** → Intake rascunha a spec e envia direto ao Feature Agent do domínio.
   - **Alta ambiguidade** (interpretação nova, decisão estratégica, contrato sem precedente) → escalona ao FDE, que autoria a spec.
3. Spec pronta → **divide em tarefas paralelas por domínio**, cada uma em seu próprio git worktree (padrão nativo do Claude Code desde fev/2026).
4. Cada Feature Agent roda seu próprio loop (mesmo runtime, mesmo `MAX_TURNS`, mesma instrumentação OTel — a diferença entre instâncias é só o skill/Guia carregado):
   - Chama o **Platform Agent** (MCP) para testes, lint, deploy, observabilidade.
   - Se tocar em contrato de API externo/compliance, aciona o **Architecture Agent** (A2A, Collaboration síncrona, registra ADR).
   - Abre PR → **Review Agent** (A2A, Facilitating) dá feedback, orienta sem bloquear.
5. **Se Review Agent ou Architecture Agent discordar da classificação do Intake em andamento** (não a auditoria periódica — uma discordância no meio do fluxo) → **pausa a tarefa e escala pro FDE**. Mesmo padrão para os dois agentes, sem distinção de severidade.
6. As tarefas paralelas convergem → **HITL gate**: FDE aprova o merge, inclusive quando a spec original foi só do Intake (nenhum merge acontece sem humano na cadeia).
7. **Eval gate**: trajectory eval via PromptFoo como condição não-negociável antes do deploy.
8. **SRE Agent** monitora SLOs/error budget em produção e, se necessário, gera task automática — que realimenta o board como a 4ª origem, fechando o loop.
9. **Auditoria periódica do FDE** sobre as classificações do Intake (não sobre o código já implementado): correções realimentam a heurística/skill de triagem do Intake — **é sempre prospectiva**, nunca reabre trabalho já rodado. É o mecanismo de melhoria contínua do time agêntico sem precisar de um segundo FDE.

---

## Regras de design (não reabrir sem motivo forte)

- **Sem QA Agent separado.** Qualidade é propriedade do harness (Sensores + Eval gate), não um papel à parte — evita o antipadrão "jogar por cima do muro pra QA".
- **Platform Agent é uma única instância agnóstica de stack**, não "backend" nem "frontend" — Platform, por definição, serve qualquer stream-aligned team como serviço.
- **Skill de domínio = Guia (feedforward), não agente novo.** O mesmo runtime roda para os dois Feature Agents; a diferença é só qual skill cada instância carrega.
- **Architecture Agent segue o Architecture Advice Process: aconselha, não veta.** A decisão fica com o Feature Agent, registrada como ADR que realimenta os Guias. Não existe "Architecture Team" fixo nem gate de arquitetura — existe um processo.
- **Discordância de Review Agent ou Architecture Agent sobre classificação em andamento → sempre pausa e escala pro FDE.** Não há hierarquia de severidade entre os dois.
- **Correção de auditoria do FDE é sempre prospectiva** — nunca reabre implementação já feita, só realimenta a heurística de triagem do Intake.
- **CPF (e demais PII) sempre mascarado entre agentes** — nunca dado raw em comunicação inter-agente.
- **Protocolo é definido pelo modo de interação (Team Topologies), não por "quem está do outro lado".** X-as-a-Service/trigger → MCP; Collaboration/Facilitating → A2A.

---

## HITL — papel do FDE em detalhe

O FDE tem três funções distintas, não uma:

1. **Autoria de spec** — só para o que o Intake Agent escalona por alta ambiguidade (regulatório novo, decisão estratégica, contrato sem precedente).
2. **Aprovador único no HITL gate** — toda mudança passa por aprovação humana antes do merge, inclusive as que o Intake autorou sozinho. Nenhum código chega à produção sem um humano na cadeia.
3. **Auditor periódico das classificações do Intake** — spot-check retrospectivo sobre os casos tratados como "baixa ambiguidade", realimentando a heurística de triagem. Sempre prospectivo.

**Mecânica técnica do gate (reaproveitada do `credit-analysis-agent`/`compliance-agent` já existentes, mesma stack, domínio novo):** padrão assíncrono via Redis + SSE — o agente serializa o estado, termina a execução, notifica o operador, e retoma via `POST /resume` quando o FDE aprova. Não é um bloqueio síncrono; o sistema não fica "esperando" com um processo ocioso.

---

## Fases de implementação

- **Fase 1 (atual):** entrada manual — alguém sinaliza a demanda regulatória (acompanhamento dos atos normativos do BCB) e alimenta o board; Intake Agent já classifica e triagem, mas a captura de origem ainda depende de intervenção humana pontual.
- **Fase 2:** vigilância automatizada — Intake Agent monitora continuamente fontes regulatórias, sem depender de sinalização manual para a origem Regulatório/Informes.

---

## Caveats

- A squad completa (Intake, FDE reduzido, Feature/Platform/Review/Architecture/SRE Agents) é leitura própria de Dan e Jean — apoiada em Team Topologies (incluindo a atualização "AI-era" 2026) e no Architecture Advice Process (Harmel-Law/Thoughtworks) como fontes de mercado reais, mas a costura completa numa única topologia é original da dupla.
- O cenário regulatório usado como exemplo âncora é real quanto ao tipo de evento (nova versão de manual do BCB obrigando mudança de contrato de API); o campo técnico específico citado nos exemplos é fictício e ilustrativo, não uma citação de norma real.
- Nome e descritivo da oferta (**Sensedia Open Agentic Ops**) foram fechados para posicionamento comercial explícito em Open Finance, seguindo a convenção "Sensedia [Nome]" do portfólio existente (ao lado do AI Gateway).
- Infraestrutura técnica (loop LLM-directed puro, JWT via AI Gateway, HITL assíncrono Redis+SSE, tracing OTel/W3C traceparent, `run_all_evals.sh` como gate de deploy) é reaproveitada do `credit-analysis-agent`/`compliance-agent` já existentes — mesmo runtime, domínio novo. Ainda não iniciado: `proposal.md` (OpenSpec/SPDD) e implementação de código para esta squad especificamente.
