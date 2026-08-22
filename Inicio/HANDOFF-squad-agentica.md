# Handoff — Squad Agêntica e Loop Engineering (para o live coding)

**Contexto:** esta squad é o cenário do Bloco 4 (Live Coding) da palestra "Times Agênticos e Loop Engineering" (TDC Stage / Hacktown 2026). Detalhes narrativos/timing da talk ficam na outra conversa deste projeto — aqui o foco é **construir de verdade**. Todo o histórico de decisão está na seção "Arquitetura da squad agêntica" e "Caso de uso do live coding" do `estrutura-palestra-times-agenticos-hacktown-v2.md` (anexar se precisar do racional completo) — este handoff resume o estado para retomar direto na implementação.

## Estado atual: arquitetura e caso de uso fechados. Falta: `proposal.md` (OpenSpec/SPDD) e código.

> **Atualização (ago/2026):** este handoff foi trazido para o repo e atualizado com as decisões de maturação fechadas em sessão de grilling. A arquitetura evoluiu: o runtime de orquestração passou a ser **LangGraph nativo** (não o loop artesanal), a stack é **tudo Python + LangGraph + LangSmith**, e o item 4 (fork TS do compliance-agent) foi **descartado**. Ver seção "Decisões de maturação" abaixo e os ADRs em `docs/adr/`.

### Arquitetura da squad (fechada)

Modelada em cima do Team Topologies mais atual (incluindo a atualização "AI-era" 2026 e o Architecture Advice Process de Harmel-Law/Thoughtworks). Runtime único e reutilizável para todos os Feature Agents — a diferença entre instâncias é o **skill carregado** (Guia/feedforward), não o código. A orquestração da squad inteira é um **grafo LangGraph** (Graph Engineering): a topologia entre agentes é modelada como nós, arestas e arestas condicionais, com o checkpointer como board.

| Agente | Tipo (Team Topologies) | Modo de interação | Protocolo | Responsabilidade | Quem aciona |
|---|---|---|---|---|---|
| Feature Agent (backend) | Stream-aligned | — | — | Implementa a feature no domínio backend, com skill de backend como Guia | Trigger automático ou FDE |
| Feature Agent (frontend) | Stream-aligned | — | — | Implementa a feature no domínio frontend, com skill de frontend como Guia | Trigger automático ou FDE |
| Platform Agent | Platform | X-as-a-Service | MCP | Testes, lint, deploy, observabilidade como serviço — instância única atende os dois Feature Agents | Chamado por qualquer Feature Agent |
| Review Agent | Enabling | Facilitating | A2A | Feedback de PR contra padrões do time; orienta, não bloqueia | Chamado ao abrir PR |
| Architecture Agent | Complicated-subsystem | Collaboration | A2A | Discussão síncrona time-boxed em decisões de contrato de API/compliance; registra ADR (Architecture Advice Process) | Acionado pelo guia do Feature Agent ao detectar área sensível |
| SRE Agent | Platform (extensão) | X-as-a-Service + trigger | MCP | Monitora SLOs/error budget; gera task automática pós-deploy — fecha o sistema inteiro como loop | Automático, contínuo |
| HITL gate | processo | — | — | Aprovação humana antes do merge | Após o Review Agent |
| Eval gate | processo | — | — | Trajectory eval (PromptFoo) como gate de deploy | Após o HITL gate |

**Decisões de design que não devem ser reabertas sem motivo forte:**
- Sem QA Agent separado — qualidade é propriedade do harness (Sensores + Eval gate), não um papel à parte (evita o antipadrão "jogar por cima do muro pra QA").
- Platform Agent é uma única instância agnóstica de stack, não "backend" nem "frontend".
- Architecture Agent segue o Architecture Advice Process: aconselha, não veta — decisão fica com o Feature Agent, registrada como ADR que realimenta os Guias.

### Caso de uso (fechado): Open Finance

Gatilho: nova Instrução Normativa do BCB altera o Manual de Escopo de Dados e Serviços do Open Finance, introduzindo um campo novo ligado à portabilidade de crédito consignado (evento real previsto pra nov/2026; o campo específico da demo é fictício/ilustrativo). Entra via **FDE** (demanda ambígua, exige interpretação regulatória — não é trigger automático).

Duas tarefas paralelas, cada uma em seu próprio **git worktree** (`feat/of-consent-field` backend, `feat/of-consent-ui` frontend — padrão validado: Claude Code tem suporte nativo a `--worktree` desde fev/2026):
- **Backend** — novo campo no contrato da API de dados/consentimento + trilha de auditoria. Toca contrato externo regulado → **aciona Architecture Agent (Collaboration)**.
- **Frontend** — reflete o campo na tela de consentimento (Jornada Sem Redirecionamento). Rotineiro, **não escala** — o contraste que prova que Collaboration é cara e usada com parcimônia.

Para o momento de live coding (8 min): rodar ao vivo (a) a Collaboration síncrona Feature Agent↔Architecture Agent e (b) o HITL gate; pré-carregar/narrar o resto (chamadas ao Platform Agent, feedback do Review Agent, eval final).

## Próximos passos técnicos

1. **`proposal.md`** (OpenSpec/SPDD) para o cenário completo — ainda não iniciado. Deve cobrir: os 6 agentes, os 2 protocolos (MCP/A2A), o fluxo HITL/eval, e a orquestração dos 2 worktrees paralelos.
2. Depois do proposal: `design.md → spec.md → tasks.md → prompt.md`, seguindo o processo padrão.
3. **Reaproveitar do `credit-analysis-agent`/`compliance-agent` já existentes:** autenticação JWT via AI Gateway, tracing OTel/W3C traceparent, e o `run_all_evals.sh` como gate de deploy. **Não** reaproveitar o loop artesanal (`while finish_reason == "tool_calls"`) — a orquestração agora é LangGraph.
4. ~~Fork simplificado do `compliance-agent` (Fastify/TS) como ponto de partida pro Review Agent e pro Architecture Agent~~ — **DESCARTADO.** Com a stack tudo-Python/LangGraph, Review Agent e Architecture Agent são nós Python/LangGraph (A2A via HTTP), reaproveitando o padrão do credit-analysis-agent.
5. ~~Decidir a interface do "board de tarefas"~~ — **RESOLVIDO.** O checkpointer do LangGraph é o board; não há board separado (ver ADR-0002).

## Decisões de maturação (ago/2026)

Fechadas em sessão de grilling. Registradas como ADRs em `docs/adr/`.

1. **Graph Engineering como eixo novo** — Loop Engineering = intra-agente (loop de tool-calling de uma instância); Graph Engineering = inter-agente (topologia da squad: nós, arestas, arestas condicionais, checkpoints). "Squad = grafo de loops."
2. **PII além de CPF** — ancorado em classificação LGPD (dado pessoal vs. sensível), não lista fixa. Escopo informado pelo perfil de segurança oficial do Open Finance (FAPI-BR): claim `sub` quando identifica pessoa, claims OIDC (data de nascimento, endereço, telefone), CPF, CNPJ. Mascaramento na fronteira de entrada (Intake) + sanitização de telemetria.
3. **Stack: tudo Python + LangGraph + LangSmith** — orquestrador único, sem fronteira de linguagem entre agentes.
4. **Arquitetura: hexagonal leve só nas bordas** — LLMProviderPort, ToolExecutionPort (MCP), PersistencePort (checkpointer), NotificationPort (HITL). Sem camadas de domínio/DDD (a lógica mora no system prompt).

### Decisões de arquitetura do grafo (Rodadas 1–2)

- **Q1:** LangGraph = orquestrador/board único (grafo supervisor da topologia inteira).
- **Q2:** checkpointer do LangGraph é o board (sem board separado).
- **Q3:** Intake/Platform/SRE = nós do grafo que delegam via MCP.
- **Q4:** Review/Architecture = nós do grafo que chamam A2A via HTTP.
- **Q5:** 1 nó genérico "Feature Agent" parametrizado por Guia.
- **Q6:** git via ToolExecutionPort/MCP.
- **Q7:** HITL = `interrupt()` nativo + Redis/SSE só para notificar o FDE; `POST /resume` como ponte.
- **Q8:** LangSmith para tracing agêntico + OTel para infra/métricas.
- **Q9/Q10:** mascaramento na fronteira (Intake) + sanitização de payloads na telemetria; PII em todas as fronteiras (comunicação, checkpointer, telemetria, evals, logs).
- **Q11:** citar wiki da Área do Desenvolvedor do Open Finance Brasil (vigente) + GitHub specs-seguranca (histórico, em arquivamento).

## Fontes-chave desta frente

Team Topologies aplicado a agentes (Prompt Pals, fev/2026; prommer.net, mai/2026) · Architecture Advice Process (thoughtworks.com/en-us/radar/techniques/architecture-advice-process) · FDE 2026 (crescimento de 729% em vagas, Indeed) · Git worktrees + Claude Code `--worktree` nativo (fev/2026), tip do Boris Cherny · Open Finance Brasil — atos normativos do BCB (openfinancebrasil.org.br/atos-normativos/) · Perfil de Segurança do Open Finance Brasil (FAPI-BR) — wiki da Área do Desenvolvedor (openfinancebrasil.atlassian.net/wiki/spaces/OF) e GitHub specs-seguranca (em arquivamento) · LGPD (Lei 13.709/2018) e Resolução CD/ANPD nº 15/2024 · LangGraph 1.0 GA (out/2025) · LangSmith.

## Caveats

- A squad inteira (5 agentes + 2 gates) é leitura/síntese própria de Dan e Jean — apoiada em fontes de mercado reais, mas a costura completa é original.
- O campo regulatório específico da demo é fictício — os atos normativos citados (datas, números) são reais, o conteúdo técnico do campo não é.
