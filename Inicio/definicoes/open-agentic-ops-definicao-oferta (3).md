# Open Agentic Ops — Definição da Oferta

> Documento de trabalho. Consolida decisões já tomadas (README, ARCHITECTURE.md, CONTEXT.md, ADRs, diagrama de referência) e abre pontos que ainda precisam de decisão do FDE/Head. Pontos em aberto estão marcados com `[DECISÃO PENDENTE]`.

---

## 1. Nome da oferta e descrição

**Nome:** Open Agentic Ops (Sensedia)

**Descrição:** Squad agêntica autônoma que opera o ciclo de vida completo de uma mudança em Open Finance — da entrada da demanda (norma regulatória, pedido de cliente, decisão estratégica ou sinal de produção) até o deploy monitorado — modelada como um grafo LangGraph (Graph Engineering), com um único FDE (Forward Deployed Engineer) garantindo julgamento humano exatamente onde a ambiguidade exige, e em nenhum outro ponto.

Não é um copiloto de código nem um gerador de PRs isolado. É uma squad completa — cada papel de um time de engenharia tradicional (intake/triagem, implementação, arquitetura, review, SRE) existe como um nó do grafo, com o FDE ocupando o único papel que a squad não terceiriza para IA: julgamento sobre ambiguidade.

---

## 2. Por que essa oferta e para quem

### Por que agora

Open Finance no Brasil tem cadência regulatória alta e crescente: o Banco Central publica Instruções Normativas com frequência atualizando os manuais técnicos do ecossistema (Segurança, APIs, Experiência do Cliente, Serviços da Estrutura de Governança), além de Resoluções Conjuntas CMN+BCB e Comunicados que mudam regras de participação, prazos e obrigações. Cada atualização gera trabalho real de interpretação → design → implementação → teste → deploy, com prazo definido pelo regulador, não pelo backlog do time.

Um time de engenharia tradicional escala esse trabalho linearmente com headcount. O gargalo não é escrever código — é o volume de decisões de baixo julgamento (interpretar um manual já visto antes, implementar um padrão já resolvido, revisar contra um contrato já conhecido) competindo pelo tempo escasso de decisões de alto julgamento (uma interpretação regulatória genuinamente nova, uma decisão estratégica sem precedente). A oferta ataca essa proporção: agentes absorvem o volume de baixo julgamento; o FDE garante que nada de alto julgamento passe sem revisão humana.

### Para quem

- **Instituições participantes do Open Finance Brasil** (bancos, fintechs, provedores de infraestrutura) que precisam manter conformidade contínua com o cronograma do BCB — que não pausa — enquanto seguem entregando demanda de cliente e de produto no mesmo pipeline de engenharia, sem duplicar processo por tipo de demanda.
- **Internamente na Sensedia**: o time de Solutions, que hoje faz esse trabalho de arquitetura/implementação manualmente por cliente. A oferta é tanto produto quanto forma de operar o próprio time.

**Decisão:** produto vendável — instituições participantes do Open Finance Brasil contratam a squad, não só a Sensedia usa internamente.

**Implicação de arquitetura que isso destrava** (não coberta hoje em `ARCHITECTURE.md`/`CONTEXT.md`, vale registrar como próxima decisão, não como código a fazer agora):
- **Multi-tenancy real, não hipotética.** O Board (checkpointer, `thread_id` por execução) precisa de um `tenant_id`/`cliente_id` associado a cada thread — hoje o modelo de dados não distingue de qual cliente é cada demanda.
- **Isolamento de PII já é por fronteira (Intake), mas falta isolamento por tenant.** A máscara de PII na entrada (ADR-0006) resolve "não vaza dado pessoal entre agentes/telemetria" — não resolve "cliente A não pode ver demanda do cliente B" no console do FDE. São dois problemas diferentes que hoje só o primeiro está desenhado.
- **O console (`/registry`, `/dashboard`, `/graph`) hoje mostra tudo globalmente**, sem filtro de tenant — correto para uso interno, insuficiente para produto vendável com múltiplos clientes operando a squad simultaneamente.
- Vale abrir um ADR específico para isso (`multi-tenancy-e-isolamento-por-cliente`) antes de qualquer trabalho de UI multi-tenant — é decisão de arquitetura, não de frontend.

---

## 3. Alto nível — Squad Open Agentic Ops

A squad é um grafo LangGraph. Cada agente é um nó; o loop intra-agente de tool-calling roda dentro de cada nó (Loop Engineering ⊂ Graph Engineering). O board é o checkpointer do grafo — estado persistido, não um sistema à parte.

| Agente/Nó | Tipo (Team Topologies) | Protocolo | Responsabilidade |
|---|---|---|---|
| **Intake Agent** | Platform | MCP | Classifica origem, domínio (backend/frontend) e ambiguidade (baixa/alta) de cada demanda. Mascara PII na fronteira de entrada (LGPD/FAPI-BR). Decide a rota: rascunha a spec sozinho (baixa ambiguidade + precedente) ou escala ao FDE (alta ambiguidade). |
| **Feature Agent** | Stream-aligned | — | Nó genérico parametrizado por um Guia (skill de domínio — backend ou frontend). Implementa a spec em worktree próprio. Backend e frontend rodam em instâncias paralelas (fan-out). |
| **Architecture Agent** | Complicated-subsystem | A2A (Collaboration) | Acionado condicionalmente pelo Feature Agent (backend) quando a mudança toca contrato de API externo/regulado. Aconselha via ADR — não veta; a decisão final é do Feature Agent. |
| **Platform Agent** | Platform | MCP | Testes, lint, deploy, observabilidade como serviço. Instância única, chamada por ambos os worktrees. |
| **Review Agent** | Enabling | A2A (Facilitating) | Feedback de PR, um por worktree. Orienta, não bloqueia. Se discordar da classificação de ambiguidade que o Intake deu a um item em execução, pausa e escala ao FDE. |
| **SRE Agent** | Platform (extensão) | MCP | Monitora SLOs e error budget pós-deploy. Gera task que realimenta o Intake como 4ª origem — fecha o loop. |
| **HITL gate** | processo/humano | — | Checkpoint onde o FDE aprova ou rejeita o merge — inclusive specs que o Intake rascunhou sozinho. Nunca há merge sem humano na cadeia. |
| **Eval gate** | processo | — | Trajectory eval (PromptFoo) antes do deploy. |
| **Board** | checkpointer | — | Estado corrente de todas as demandas, persistido por thread_id. Não é um agente, é onde o estado de todos os agentes vive. |

**FDE (Forward Deployed Engineer)** — o único papel humano da squad, com três funções, sem sobreposição:
1. **Autoria de spec** — só para itens de alta ambiguidade (o Intake nunca escreve a spec sozinho nesse caso).
2. **Aprovador único no HITL gate** — todo merge passa por aqui, sem exceção.
3. **Auditor prospectivo da heurística do Intake** — revisão periódica das classificações de baixa ambiguidade; correção sempre prospectiva (afeta classificações futuras), nunca reabre item já implementado.

---

## 4. Origens / Gatilhos — visão geral

Quatro entradas alimentam o Intake Agent. Três entram de fora para dentro (mercado/cliente/regulador); a quarta fecha o loop de dentro para fora (produção realimentando o próprio funil):

1. **Cliente Sensedia** — pedido direto de um cliente que usa a plataforma Sensedia no contexto de Open Finance.
2. **Regulatório Open Finance** — norma, manual ou comunicado publicado pelo Banco Central ou pela Estrutura de Governança do Open Finance.
3. **Sensedia (Estratégia)** — decisão interna de produto/roadmap, sem pedido externo direto.
4. **SRE (produção)** — sinal de operação em produção (bug, degradação, risco de SLO) gerado pelo próprio SRE Agent.

Detalhamento de cada uma a seguir.

---

## 5. Detalhamento por origem

### 5.1 Cliente Sensedia

**Definição:** Demanda que chega de um cliente que opera Open Finance sobre a plataforma Sensedia — um pedido de feature, ajuste ou correção que não é gerado internamente nem imposto por regulação.

**Como entra hoje:** Manual — via tela Intake, campo Origem = "Cliente", intermediado por alguém do lado Sensedia (CS, Solutions, Suporte).

**Decisão de canal (roadmap):** multi-canal — e-mail, Slack, Zendesk, formulário — cada um como um adaptador de ingestão próprio que normaliza a solicitação para o mesmo schema de demanda antes de tocar o Intake Agent. Implicações de design:
- Cada canal precisa de um conector/webhook dedicado (ex.: parser de e-mail, Slack event subscription, Zendesk trigger, endpoint de formulário) — todos convergindo no mesmo `POST /intake` que já existe na API, não múltiplos pontos de entrada com lógica duplicada.
- A normalização por canal é trabalho de mapeamento (texto do e-mail/ticket/mensagem → campo `texto` + `origem: cliente`), não um novo agente — o Intake Agent continua sendo o único ponto de classificação.
- Mantém ou não a intermediação humana como filtro de qualidade é uma escolha por canal: e-mail/Zendesk tendem a manter alguém do CS revisando antes de disparar; Slack/formulário podem ir direto ao Intake sem intermediário, dependendo do nível de confiança que o cliente tem no canal.
- `[DECISÃO PENDENTE]` — ordem de prioridade de implementação dos canais (qual entra primeiro na Fase 2) e se todos herdam a mesma máscara de PII na fronteira ou se cada canal precisa de tratamento específico (ex.: e-mail costuma carregar mais PII solta no corpo do texto do que um formulário estruturado).

**Ambiguidade típica:** Predominantemente baixa quando há precedente (ex: "adicionar botão de exportação em X" — já existe padrão de exportação em outra tela). Sobe para alta quando o pedido implica mudança de contrato de dados exposto pela API, ou quando o cliente pede algo que conflita com uma norma vigente (nesse caso, a origem é "Cliente" mas a ambiguidade nasce de uma tensão regulatória — vale o Intake sinalizar essa interseção, não só classificar isoladamente).

**Domínio típico:** Frontend na maioria dos casos observados hoje (ex.: "Adicionar botão de download no dashboard de investimentos"); backend quando envolve novo campo ou endpoint.

**Exemplo real no sistema:** *"Adicionar botão de download no dashboard de investimentos."* — origem Cliente, domínio Frontend, baixa ambiguidade.

**Quem é a fonte de verdade:** O relacionamento comercial/CS do cliente — hoje sem sistema de origem formal (CRM, ticket) integrado ao Intake.

**Critério de sucesso:** Feature entregue e monitorada sem gerar chamado de suporte recorrente relacionado — métrica hoje não instrumentada no board.

`[DECISÃO PENDENTE]` — deve existir um vínculo entre a demanda e o cliente que a originou (para rastreabilidade e para medir SLA por cliente), ou o sistema trata "Cliente" como origem genérica sem discriminar qual cliente?

---

### 5.2 Regulatório Open Finance

**Definição:** Demanda originada por um ato normativo do Banco Central ou por um manual técnico publicado sob a Estrutura de Governança do Open Finance — o corpo responsável por elaborar, junto às instituições participantes, os padrões técnicos e operacionais do ecossistema, que depois são incorporados formalmente pela regulamentação do BCB.

**Taxonomia real dos instrumentos** (para o Intake reconhecer, hoje classificados manualmente pelo FDE):

| Instrumento | O que costuma mudar |
|---|---|
| Instrução Normativa BCB | Divulga nova versão de um dos manuais técnicos vigentes — os mais recorrentes são o Manual de APIs, o Manual de Segurança, o Manual de Experiência do Cliente e o Manual de Serviços da Estrutura de Governança |
| Resolução Conjunta (CMN + BCB) | Regras estruturais — critérios de participação obrigatória, novas jornadas de produto (ex.: portabilidade de crédito, iniciação de pagamento) |
| Resolução BCB | Regras específicas de execução dentro de uma Resolução Conjunta |
| Circular | Incorporação formal de padrão técnico já acordado pelas instituições participantes à regulamentação |
| Comunicado | Avisos de processo — cronogramas, prazos de teste em produção, composição de órgãos de governança |

**Como entra hoje:** Manual — o `diagrama-squad-open-agentic-ops-texto.md` já registra isso explicitamente como decisão de fase 1. O FDE lê o ato normativo e digita a demanda na tela Intake, origem = "Regulatório".

**Ambiguidade típica:** Predominantemente alta — por definição, uma nova IN introduz algo sem precedente direto no sistema (mesmo que o padrão de implementação seja simples, a *interpretação* do texto normativo é nova). Baixa ambiguidade só ocorre em atualizações incrementais de um manual já implementado, com mudança mecânica e sem ambiguidade de leitura.

**Domínio típico:** Frequentemente Backend (mudança de contrato de API/schema) com propagação para Frontend quando o novo campo precisa de UI (ex.: campo de portabilidade de crédito consignado exigindo formulário + máscara).

**Exemplo real no sistema:** *"Nova Instrução Normativa do BCB altera o Manual de Escopo de Dados e Serviços do Open Finance, introduzindo um campo ligado à portabilidade de crédito consignado."* — origem Regulatório, domínio Backend, alta ambiguidade, spec autorada pelo FDE.

**Quem é a fonte de verdade:** Publicações oficiais do BCB e da Estrutura de Governança do Open Finance.

**Criticidade:** A mais alta das quatro origens — atos normativos têm prazo de adequação definido pelo regulador, com risco de sanção em caso de não cumprimento. Vale o Intake/Board carregar um campo de prazo regulatório explícito, hoje ausente do modelo de dados.

**Decisão (Fase 2 confirmada):** automatizar a detecção — monitorar a publicação de atos normativos (página de atos normativos do Open Finance Brasil / BCB) e pré-popular o Intake automaticamente quando algo novo sai. A leitura/interpretação do texto normativo continua humana (é exatamente o tipo de julgamento que define alta ambiguidade); o que a automação resolve é o gatilho — "saiu norma nova" deixa de depender de o FDE descobrir manualmente navegando o site do regulador.

`[DECISÃO PENDENTE]` — mecanismo de detecção: polling periódico da página de atos normativos, assinatura de algum feed/RSS se existir, ou webhook se a Estrutura de Governança oferecer um no futuro. Vale um spike técnico antes de comprometer com uma abordagem, já que hoje não há garantia de que exista notificação estruturada — pode ser scraping da página, o que é mais frágil e merece ADR próprio sobre resiliência (o que acontece se o layout da página mudar).

---

### 5.3 Sensedia (Estratégia)

**Definição:** Demanda originada internamente pela Sensedia — decisão de produto, melhoria estratégica ou aposta de roadmap sem pedido externo direto de cliente nem imposição regulatória.

**Como entra hoje:** Manual — tela Intake, origem = "Estratégia".

**Decisão de autoridade:** time de P&D da Sensedia — não é aberto a qualquer arquiteto de Solutions injetar demanda nessa origem; é o P&D quem decide o que entra como estratégico.

**Decisão de subtipo:** esta origem ganha subtipo, ao contrário das outras três. Subtipos confirmados:
- **Nova funcionalidade** — capacidade que não existe hoje na plataforma.
- **Melhoria** — evolução de algo que já existe (performance, UX, robustez) sem ser correção de bug (isso already é escopo do SRE) nem pedido de cliente.

`[DECISÃO PENDENTE]` — isso implica mudar o `Origem` type no modelo de dados (`lib/mock-data.ts` e o schema equivalente no backend Python) de valor único para incluir um subtipo estruturado. Vale decidir se o subtipo é um campo novo (`origem_subtipo`) ou se "Estratégia" vira dois valores de origem distintos (`estrategia_feature`, `estrategia_melhoria`) — a primeira opção preserva a origem como um dos 4 conceitos canônicos do CONTEXT.md; a segunda infla a lista de origens além das 4 definidas. Recomendo a primeira (subtipo como campo adicional), para não contradizer a definição de "4 origens" já fixada no glossário.

**Ambiguidade típica:** Tende a alta para o subtipo "nova funcionalidade" — por não ter precedente de pedido externo, frequentemente envolve decisão de posicionamento (ex.: "para qual segmento construir isso primeiro") que só um humano com contexto de negócio resolve. Tende a baixa para "melhoria" quando é evolução técnica sem ambiguidade de escopo (ex.: otimizar uma rotina já existente).

**Domínio típico:** Variável — não tem viés observado até agora, ao contrário de Cliente (mais Frontend) e Regulatório (mais Backend).

**Quem é a fonte de verdade:** Roadmap/decisão do Head de Solutions ou liderança de produto — hoje sem sistema formal (ex.: doc de roadmap) integrado ao Intake.

**Tensão a resolver:** É a origem mais fácil de confundir com "Cliente" quando a demanda estratégica nasce de um padrão observado em múltiplos clientes (ex.: "3 clientes pediram X, vamos generalizar"). Vale uma regra explícita: se a demanda tem *um* cliente identificável como origem direta → Cliente; se é uma generalização de um padrão observado → Estratégia.

`[DECISÃO PENDENTE]` — essa origem deveria ter uma sub-classificação (nova feature vs. melhoria vs. débito técnico), já que hoje o modelo de dados (`Origem` type) trata "estrategia" como valor único sem subtipo?

---

### 5.4 SRE (produção)

**Definição:** Sinal gerado pelo próprio SRE Agent ao monitorar SLOs e error budget em produção — bug, degradação de performance, ou risco de confiabilidade identificado depois do deploy.

**Como entra:** A única origem estruturalmente automática. O SRE Agent, ao final do grafo, gera a task que realimenta o Intake — não depende de o FDE digitar nada. É isso que fecha o loop: Intake Agent é a entrada de fora para dentro; SRE Agent é a saída de dentro para fora que volta a entrar.

**Ambiguidade típica:** Geralmente baixa quando o sintoma e a causa são claros (ex.: endpoint específico com p95 acima do SLO, correção é otimização direta). Sobe para alta quando o problema de confiabilidade exige uma decisão de produto para resolver (ex.: renegociar um SLA, não só otimizar código).

**Domínio típico:** Backend na quase totalidade dos casos observados — a métrica de SLO tipicamente mede latência/erro de API.

**Exemplo real no sistema:** *"Reduzir latência p95 do endpoint de extrato abaixo de 500ms."* — origem SRE, domínio Backend, baixa ambiguidade.

**Quem é a fonte de verdade:** Os próprios sistemas de observabilidade que o SRE Agent consome (SLOs/error budget) — via MCP, hoje sem detalhamento de quais métricas/thresholds disparam a geração automática da task.

**Critério de disparo:** julgamento do próprio agente — não é threshold fixo determinístico. O SRE Agent avalia o sinal de observabilidade (SLO, error budget, anomalia) e decide, por si, se aquilo justifica virar task. É consistente com a filosofia da squad inteira ("Agent = Foundation Model + Harness", julgamento como capacidade central, não regra hardcoded) — mas é a única origem em que o **julgamento de quando agir** também é feito por um agente, não por um humano nem por uma regra fixa.

**Implicação importante — isso é uma heurística que também precisa de auditoria prospectiva.** A tela Audit hoje audita só a heurística de classificação de ambiguidade do Intake Agent (CONTEXT.md: "auditor prospectivo das classificações do Intake"). Se o SRE Agent também decide por julgamento (não por regra fixa) quando gerar uma task, ele tem uma heurística própria sujeita ao mesmo risco de drift que a do Intake — e hoje não tem superfície de auditoria equivalente. Duas heurísticas agênticas na squad, uma auditada (Intake) e uma não (SRE).

`[DECISÃO PENDENTE]` — estender a Audit para cobrir também a heurística de disparo do SRE Agent (ex.: "o SRE decidiu não abrir task para esse sinal — o FDE concordaria?", simétrico ao que já existe para o Intake), ou tratar como fora de escopo por ora porque o volume de decisões de "não disparar" do SRE é mais difícil de observar (o Intake decide sobre itens que existem no board; o SRE decide sobre sinais que talvez nem cheguem a virar registro nenhum se ele decidir não agir).

---

## Decisões fechadas nesta rodada

1. **Produto vendável.** Destrava necessidade real de multi-tenancy e isolamento por cliente no Board/console — hoje não desenhado, vira próxima decisão de arquitetura (ADR dedicado).
2. **Cliente — multi-canal confirmado** (e-mail, Slack, Zendesk, formulário), todos convergindo no mesmo `POST /intake` via adaptadores de normalização por canal.
3. **Regulatório — automação de detecção confirmada para Fase 2**, mecanismo de detecção (polling/feed/webhook) ainda em aberto.
4. **Estratégia — autoridade é o P&D da Sensedia**, origem ganha subtipo (nova funcionalidade / melhoria) — recomendo campo adicional, não nova origem, para não contradizer as "4 origens" do CONTEXT.md.
5. **SRE — disparo por julgamento do agente**, não threshold fixo — levanta a necessidade de estender a Audit prospectiva também para a heurística de disparo do SRE, hoje sem essa cobertura.

## Pontos ainda em aberto (novos, derivados das decisões acima)

1. Fronteiras exatas de tenant no modelo de dados (Board, thread_id, console) — vale ADR próprio antes de qualquer mudança de UI.
2. Ordem de prioridade dos canais de intake do Cliente e se cada canal tem tratamento de PII próprio.
3. Mecanismo técnico de detecção de atos normativos novos (polling vs. feed vs. webhook) — spike antes de comprometer.
4. Campo novo (`origem_subtipo`) vs. nova origem para o subtipo de Estratégia — modelo de dados frontend e backend precisam mudar juntos.
5. Se a auditoria prospectiva se estende ao SRE Agent, e como observar decisões de "não disparar" que hoje não deixam rastro nenhum no board.

---

## 6. Intake Agent — detalhamento

### 6.1 O que ele faz, na ordem real de execução (`intake_node.py`)

1. Recebe `origem` (já definida por quem chamou o grafo — o Intake não decide a origem, só recebe) e o texto bruto da demanda.
2. **Sanitiza PII primeiro**, antes de qualquer classificação — o texto que a heurística de domínio/ambiguidade enxerga já está mascarado. Ordem correta: nada de PII raw chega a influenciar (ou vazar via) a classificação.
3. Classifica `dominio` (backend/frontend/ambos) e `ambiguidade` (baixa/alta) sobre o texto sanitizado.
4. Decide `spec_autor`: `intake` se ambiguidade baixa, `fde` se alta.
5. Grava `classificacao_intake` no estado — domínio, ambiguidade, **justificativa** (lista de palavras-chave que bateram) e timestamp. É esse campo que alimenta a tela Audit.
6. Status vira `triado`. A aresta condicional (`route_by_ambiguity`) manda para `rascunha_spec` (baixa) ou `fde` (alta).

### 6.2 Mecanismo de classificação — heurística determinística, não LLM

`classificar_dominio` e `classificar_ambiguidade` fazem substring match contra listas de palavras-chave em `heuristica.json` (o mesmo arquivo que a tela Audit corrige via "Palavra-chave adicionada/removida"). Não há chamada a foundation model nesse nó hoje.

**Isso é uma escolha válida, não um bug** — dá um ponto de controle rápido, barato e 100% auditável (toda classificação vem com a lista exata de palavras que a motivou, o que é ótimo para compliance: você consegue explicar exatamente por que algo foi classificado como alta ambiguidade, sem depender de interpretar o raciocínio de um LLM). Mas tem três comportamentos de borda que valem decisão explícita:

**a) Fallback de "nenhuma palavra bateu" empurra para o caminho de MENOS fricção, não mais.**
- Domínio sem hit nenhum → cai em `"ambos"` (não em algo como "indefinido").
- Ambiguidade sem hit nenhum → cai em `"baixa"` (segue direto para o Intake rascunhar a spec sozinho, sem passar pelo FDE).

Numa lógica de fail-safe para sistema regulado, o comportamento esperado seria o oposto: texto que a heurística não reconhece deveria escalar para o FDE (alta ambiguidade), não seguir como se fosse simples. Hoje, silêncio na heurística = menos supervisão humana, exatamente ao contrário do que você quer.

**Decisão:** opção B — inverter o fallback. Nenhuma palavra-chave de `alta_ambiguidade` reconhecida no texto → classifica como `alta` (escala ao FDE), não `baixa`. Prioriza segurança sobre throughput: melhor sobrecarregar o FDE ocasionalmente com item que era simples do que deixar passar sem revisão algo que a heurística ainda não sabia reconhecer.

Implementação: em `classificar_ambiguidade` (`nodes/intake.py`), a condição `if hits: return "alta", hits` já existe — só falta trocar o `return "baixa", []` do caminho sem hit para `return "alta", []` (justificativa vazia sinaliza "escalado por ausência de reconhecimento", distinto de "escalado por keyword real" — útil para a Audit diferenciar os dois motivos ao longo do tempo, mesmo sem precisar de um terceiro estado no tipo `Ambiguidade`).

**b) "Sem precedente" é uma keyword literal, não um conceito estrutural.**
Hoje, para uma demanda ser classificada como alta ambiguidade por falta de precedente, o texto precisa conter literalmente a string "sem precedente" — o que só acontece se alguém escrever isso explicitamente. Não há comparação real contra o histórico de demandas já resolvidas.

**Decisão:** opção B — busca por similaridade semântica contra o histórico de demandas já implementadas, via pgvector no Postgres que já é o checkpointer (ADR-0002) — não introduz infraestrutura nova, só uma extensão do banco que já existe.

Desenho de implementação:
- Ao classificar uma nova demanda, o Intake gera embedding do texto sanitizado (pós-PII, mesma ordem já correta hoje) e busca as N demandas mais similares já com `status` terminal (`monitorado` ou `deployado`) da mesma `origem`+`dominio`.
- Threshold de similaridade define "tem precedente" — acima do threshold + já resolvido com baixa ambiguidade antes → reforça a classificação de baixa; abaixo do threshold → não conta como precedente, cai no fallback de alta (decisão 1, já fechada).
- A keyword literal "sem precedente" continua existindo como sinal explícito adicional (se o FDE escrever isso explicitamente na spec, é um forte indício de alta ambiguidade mesmo que a busca por similaridade encontre algo parecido) — não é substituída, é complementada.
- `classificacao_intake.justificativa` ganha um novo tipo de entrada além de palavra-chave: referência ao `thread_id` do precedente encontrado, para a Audit conseguir mostrar não só "por que foi baixa" mas "com base em qual caso anterior".

`[DECISÃO PENDENTE]` — threshold de similaridade (quão parecido precisa ser para contar como precedente) e N (quantos candidatos buscar) são parâmetros a calibrar com dados reais, não a definir agora sem histórico suficiente para testar contra. Fica como parâmetro configurável desde o início, não hardcoded.

**c) Cobertura de PII no domínio financeiro específico.**
`pii/__init__.py` cobre CPF, CNPJ, e-mail, telefone, data de nascimento, CEP — bom conjunto genérico LGPD. Não cobre padrões específicos de Open Finance como número de conta/agência ou chave Pix, que são dados sensíveis no seu domínio mas não em um sistema genérico.

**Decisão:** opção B — cobrir agora, por precaução. Mesmo que raro em texto livre, quando aparece é dado mais sensível que CEP/telefone, e o custo de over-redaction (mascarar um número que não era PII) é bem menor que under-redaction em contexto financeiro regulado.

Padrões a adicionar em `pii/__init__.py` (mesma estrutura dos existentes — `PadraoPII` com regex + rótulo de substituição):
- **Conta/agência bancária** — formato mais variável que CPF/CNPJ (varia por instituição), então o regex precisa ser mais permissivo e vai gerar mais falso positivo do que os padrões atuais. Aceitável dado a decisão de priorizar over-redaction.
- **Chave Pix** — quatro formatos possíveis (CPF/CNPJ já cobertos, e-mail já coberto, telefone já coberto, chave aleatória em formato UUID) — só a chave aleatória (UUID) é um padrão genuinamente novo a adicionar; os outros três reaproveitam os regex que já existem.

`[DECISÃO PENDENTE]` — formato exato de conta/agência a reconhecer (dígitos separados por hífen/barra, quantos dígitos mínimo/máximo) precisa de exemplos reais para calibrar o regex sem gerar falso positivo excessivo (ex.: confundir com outros números que aparecem em texto de demanda, como versão de manual "Manual de APIs v7.0"). Vale revisar com um conjunto pequeno de exemplos reais antes de fechar o regex definitivo.

### 6.3 Evolução para LLM — quando e o quê

Se/quando o Intake ganhar um LLM real por trás da classificação, a heurística atual não devia ser descartada — ela vira o **Guia** (feedforward) que orienta o LLM, exatamente como o Guia já parametriza o Feature Agent hoje. A heurística determinística continua existindo como fallback determinístico e como conjunto de exemplos/poucos-shots para o prompt, não é substituída — é promovida de "único mecanismo" para "uma camada do harness".

**Decisão:** opção B — sinal qualitativo, não volume bruto. A evolução para LLM é disparada quando a Audit acumula casos em que a correção do FDE não é resolvível adicionando palavra-chave — esse é o sinal real de que o determinismo bateu no teto, não a taxa de correção em si (que mistura "heurística errou por faltar palavra" com "isso é ambíguo de um jeito que nenhuma lista resolve").

Implicação de UI (Audit): hoje o fluxo de correção (`corrigirHeuristica`) só tem "adicionar/remover palavra-chave". Precisa ganhar um segundo motivo de discordância, distinto:
- **"Faltou palavra-chave"** → resolve na hora, adicionando à `heuristica.json` via o fluxo que já existe.
- **"Ambíguo demais para keyword resolver"** → não gera correção de heurística nenhuma; só incrementa um contador específico desse motivo. Esse contador (não a taxa geral de discordância) é o gatilho real para considerar LLM.

`[DECISÃO PENDENTE]` — threshold de quantos casos desse segundo tipo justificam a evolução ainda não tem número, pelo mesmo motivo das decisões 2 e 3: não dá para calibrar sem volume real rodando. Fica como algo a revisar quando a Audit acumular histórico suficiente, não uma data ou contagem fixada hoje.

### 6.4 O que já está bem resolvido (validação, não é tudo lacuna)

- Ordem PII-antes-de-classificação está correta.
- `classificacao_intake` com justificativa por palavra-chave já alimenta a Audit sem gap — a auditoria prospectiva funciona exatamente como desenhada.
- Roteamento condicional (`route_by_ambiguity`) é simples e correto: só duas saídas, sem estado intermediário confuso.
- Separação entre heurística (`intake.py`, testável isoladamente) e nó do grafo (`intake_node.py`, orquestra a chamada) já segue o hexagonal leve do ADR-0004 — não precisa mexer na estrutura, só no conteúdo da heurística.

### Resumo das decisões desta seção

1. ~~Inverter o fallback de ambiguidade não reconhecida~~ — **Fechado: opção B**, fallback vira `alta`.
2. ~~Substituir "sem precedente" por mecanismo real~~ — **Fechado: opção B**, similaridade semântica via pgvector contra histórico de demandas resolvidas (threshold/N a calibrar com dados reais).
3. ~~Cobertura de PII de conta/agência/chave Pix~~ — **Fechado: opção B**, cobrir agora por precaução (formato exato do regex de conta/agência ainda a calibrar com exemplos reais).
4. ~~Critério de evolução da heurística para LLM~~ — **Fechado: opção B**, sinal qualitativo via novo motivo de discordância na Audit ("ambíguo demais para keyword"), não taxa bruta de correção.

Seção 6 (Intake Agent) fechada — as 4 decisões pendentes têm direção clara; os parâmetros numéricos específicos (threshold de similaridade, formato de regex de conta, contagem-gatilho para LLM) ficam para calibrar com dados reais de uso, não para chutar agora.

---

## 7. Feature Agent, Platform Agent, Architecture Agent, Review Agent — detalhamento

### 7.1 O que existe hoje (grounded no código)

- **Feature Agent** (`feature_node.py`): nó genérico parametrizado por Guia (backend/frontend). Monta um prompt com a spec, chama `LLMProviderPort.invoke()` **uma única vez**, grava o resultado como `Worktree` com `status: "implementado"`.
- **Platform Agent** (`platform_node.py`): instância única, chamada por ambos os worktrees. A topologia do grafo (`feature_backend → platform`, `feature_frontend → platform`) confirma o desenho do diagrama de referência (nó 10: "instância única, chamada por ambos os worktrees") — LangGraph sincroniza as duas chegadas no mesmo superstep, então o Platform roda uma vez com o estado combinado, não duas vezes. Isso está correto, não é bug.
- **Architecture Agent** (`architecture_node.py`): existe e funciona, mas é **ligado/desligado no build do grafo inteiro** (`architecture_enabled: bool`), não decidido dinamicamente por spec.
- **Review Agent** (`review_node.py`): fallback determinístico sempre retorna "sem bloqueios" e `discorda_classificacao: False` fixo — nunca dispara a regra de pausa/escalonamento no estado atual (esperado para um stub, mas vale registrar que a regra real ainda não tem lugar para "acontecer" de fato).

### 7.2 Achado central — não há loop de tool-calling ainda

`LLMProviderPort.invoke(prompt, system) -> str` é assinatura de chamada única. O Feature Agent não itera: não edita um arquivo, roda teste, lê o resultado, corrige e tenta de novo — ele gera uma "resposta" de uma vez e marca como implementado. Isso é Graph Engineering (a topologia inter-agente) sem Loop Engineering (o comportamento intra-agente) por trás — exatamente a distinção que o `CONTEXT.md` já registra entre os dois conceitos, só que hoje só o primeiro está implementado.

Esse é provavelmente o design mais importante a fechar agora, porque tudo mais (Platform Agent como ferramenta MCP, Guia como feedforward, evals de trajetória) só faz sentido pleno quando o Feature Agent de fato itera.

**Decisão:** Goal-based loop (não turn-based), seguindo a taxonomia de loop engineering da Anthropic. Turn-based (o que existe hoje — uma chamada, o próprio LLM julga se terminou) é insuficiente para um sistema onde "terminei" precisa ser verificável antes de chegar ao HITL, não decidido por autoavaliação do modelo.

**Desenho fechado:**
- **Goal explícito e determinístico**: spec implementada + testes passando + lint limpo. Não é o LLM que decide se está bom — é o resultado de test/lint que decide.
- **Ferramentas dentro do loop**: edição de arquivo/git (sempre disponíveis) + test/lint do Platform Agent **migram para dentro do loop como ferramenta chamada pelo Feature Agent**, não mais um nó separado que só roda depois. Deploy/observabilidade continuam como nó de grafo pós-fan-in — não fazem parte do critério de "terminei de implementar", só fazem sentido depois do HITL/Eval aprovarem.
- **Teto de iterações**: guardrail explícito contra loop infinito (mesmo padrão do `/goal ... stop after N tries`). Cada tentativa que falha volta ao Feature Agent com o resultado do test/lint como contexto novo, não é só "tenta de novo".
- **Guardrail de PII vira hook determinístico, não instrução de prompt**: hoje "PII nunca deve ser manipulada em claro" é só uma frase no `system_prompt` do Guia — o lugar errado para uma garantia que não pode falhar. Reaproveita o módulo `pii.py` que já existe (mesmo do Intake) como verificação determinística sobre qualquer saída do loop, antes de virar estado — não é ferramenta nova, é o mesmo mecanismo já testado aplicado num ponto novo do harness.
- **Guia ganha uma segunda função**: além de instrução de implementação (feedforward), passa a carregar um checklist de verificação por domínio (o que checar antes de declarar pronto — específico por backend/frontend), inspirado no padrão de skill de verificação separado do de implementação.

### 7.2.1 Verificação e ferramentas por domínio — o que muda de fato entre backend e frontend

O ponto acima ficou como promessa sem conteúdo na primeira passada — aqui vai o desenho fechado.

**Checklist de verificação — Frontend** (adaptado do exemplo de skill de verificação do artigo de loop engineering):
1. Sobe o dev server, abre a página editada.
2. Interage de fato com a mudança — clica, confirma a mudança de estado, screenshot antes/depois.
3. Checa console do browser: zero erro/warning novo.
4. Audita Core Web Vitals via MCP de browser.
5. Se qualquer passo falhar, corrige e reinicia do passo 1 — nunca devolve trabalho parcialmente verificado.

**Checklist de verificação — Backend** (mesma lógica, natureza diferente):
1. Valida o endpoint novo/alterado contra o schema do Manual de APIs referenciado na spec.
2. Roda teste de contrato (conformidade de schema, não só teste unitário).
3. Roda teste de integração contra o endpoint em ambiente de teste.
4. **Checa vazamento de PII no payload de resposta** — reaproveita `detectar_pii()` do módulo `pii.py` que já existe (mesmo usado no Intake), como verificação backend-específica adicional ao hook genérico que já roda sobre toda saída do loop (7.2).
5. Mesma regra: falhou, corrige e reinicia do passo 1.

**Ferramentas — `Guia` ganha campo estruturado, não só texto.** Hoje `Guia` (`guia.py`) só carrega `system_prompt`. Passa a carregar também a lista de ferramentas disponíveis pro loop daquele domínio:
- Frontend: dev server, navegação de browser, screenshot, leitura de console, auditoria Lighthouse.
- Backend: validação de schema, teste de contrato, teste de integração, scan de PII na resposta.

**Roteamento de test/lint — explícito, não inferido por nome de branch.** `Worktree` já carrega o campo `dominio` — a correção é passar esse campo adiante na chamada ao Platform Agent (`call_tool("test", {"branch": wt["branch"], "dominio": wt["dominio"]})`), em vez de deixar o MCP inferir pytest vs. vitest/Playwright pelo padrão do nome da branch. Consistente com o resto do sistema: classificação explícita e auditável, não convenção implícita que pode driftar silenciosamente se alguém nomear uma branch fora do padrão esperado.

Ver desenho visual do loop logo abaixo desta seção.

### 7.3 Architecture Agent — condicional deveria ser por spec, não por build do grafo

O diagrama de referência é claro: Architecture Agent "só é acionado pelo Feature Agent (backend) quando a mudança toca um contrato de API externo/regulado" — isso é uma decisão por demanda, não uma configuração fixa do grafo inteiro. Hoje `architecture_enabled=True/False` liga ou desliga para **todas** as execuções do grafo, o que não corresponde ao comportamento condicional descrito.

**Decisão:** resolvida como consequência do desenho do loop (7.2). É o próprio Feature Agent, durante seu loop, que avalia se a spec toca contrato externo e invoca Architecture Agent como uma chamada isolada tipo subagent — contexto próprio, só o ADR resultante volta para o loop principal, sem poluir o contexto de trabalho do Feature Agent. Não precisa de aresta condicional nova no grafo nem de heurística própria separada — o julgamento fica onde o loop já está acontecendo.

### 7.4 Nota cruzada — SRE stub contradiz a decisão já fechada (seção 5.4)

Na seção 5.4 vocês fecharam "disparo por julgamento do agente" para a origem SRE. O `sre_node.py` atual usa um check puramente threshold (`slo_ok: bool`) — é só o fallback/stub determinístico, não a implementação real, então não é contradição de fato, só um lembrete: quando o SRE Agent ganhar implementação real (provavelmente também dependente do loop de 7.2, já que "julgamento" pressupõe algum raciocínio, não checagem de boolean), ela precisa refletir julgamento de verdade, não virar outro threshold disfarçado.

### 7.5 Desenho visual do loop
### 7.6 Review Agent — detalhamento

**O que existe hoje (grounded no código):** `review_node.py` é um fallback determinístico — `_revisar(branch: str) -> str` recebe só o nome da branch e devolve uma frase fixa ("PR {branch}: sem bloqueios; seguir com os padrões do time."). `discorda_classificacao` é `False` hardcoded, nunca calculado. `FeedbackReview` no estado (`{worktree, feedback, discorda_classificacao}`) não carrega motivo nem reclassificação sugerida. No grafo, `review → hitl` é aresta incondicional — HITL já bloqueia todo merge independente de concordância (ADR-0005: "nunca há merge sem humano na cadeia"), então "pausa" no sentido de bloquear já acontece sempre. O gap real está em `hitl_gate.py`: o payload do `interrupt()` que dispara a notificação Redis/SSE pro FDE carrega `thread`, `spec_resumo`, `worktrees` — **não carrega `feedback_review`**. O campo só aparece em `_detalhe()` (`api/main.py`), ou seja, só se o FDE abrir o card. Se aprovar direto da notificação, uma discordância passa despercebida — o cenário exato que a promessa "pausa e escala" deveria evitar.

**Achado colateral:** `architecture_node.py` tem a mesma frase no docstring ("Se discordar da classificação do Intake em andamento, pausa e escala ao FDE"), mas Architecture não tem campo de discordância nenhum no estado nem lógica pra isso — docstring copiado sem implementação correspondente.

**Decisões fechadas:**

1. **Contexto real do reviewer** — Fechado: opção B. O reviewer A2A passa a receber branch + diff (via MCP git/SCM, reaproveitando o conector do Platform Agent) + spec original + resultado do checklist de verificação do loop (7.2.1) — o feedback foca no que a verificação automática não cobre (padrão do time, legibilidade, decisões de design), não repete o que schema/PII scan/Lighthouse já validaram.

2. **`discorda_classificacao` vira estruturado** — Fechado: opção B. `FeedbackReview` ganha `motivo: str | None` e `ambiguidade_sugerida: Ambiguidade | None` — mesmo padrão de justificativa explícita já usado no Intake (`classificacao_intake.justificativa`) e no precedente por similaridade (6.2b). O FDE passa a ver o argumento e a reclassificação proposta, não só um booleano.

3. **Payload do `interrupt()` do `hitl_gate` passa a carregar o resumo de `feedback_review`** — Fechado. Quando qualquer `discorda_classificacao=True` no lote, o payload ganha `review_discordancia: True` + os motivos, para aparecer destacado na notificação que acorda o FDE, não só no drawer sob demanda.

4. **Discordância do Review alimenta a Audit prospectiva** — Fechado: sim. Mesmo padrão já fechado pro SRE (5.4) e pro motivo "ambíguo demais" do Intake (6.3): toda discordância do Review vira entrada revisável na Audit, incrementando o mesmo tipo de contador qualitativo, não a taxa bruta. Isso faz a Audit agregar sinal de discordância de duas fontes distintas sobre a mesma heurística do Intake — Review (pós-implementação) e FDE (revisão periódica). Quando a Audit ganhar esse campo, vale distinguir a origem do sinal (`origem_discordancia: "review" | "fde"`) para não misturar as duas naturezas de correção.

5. **Docstring do Architecture Agent** — Fechado: remove a frase "pausa e escala ao FDE" de `architecture_node.py`. Direção assumida (não a de implementar discordância lá também) porque o papel do Architecture já está fechado como puramente consultivo — "aconselha, não veta; decisão final é do Feature Agent" (seção 3, tabela da squad). Dar a ele um mecanismo de pausa/escalonamento contradiria essa divisão de responsabilidade já fechada. Se a leitura não for essa, é só corrigir numa próxima rodada.

`[DECISÃO PENDENTE]` — schema exato de `origem_discordancia` na Audit, e se o threshold de evolução pra LLM (6.3) deveria contar as duas fontes (Review + FDE) juntas ou separadamente. Fica para calibrar quando a Audit tiver histórico real, mesmo critério já usado nos demais parâmetros numéricos desta seção.

### Resumo das decisões desta seção

1. ~~Desenho do loop real do Feature Agent~~ — **Fechado**: goal-based, test/lint como ferramenta in-loop, teto de iterações, PII como hook determinístico, Guia com checklist de verificação. Ver desenho visual abaixo.
2. ~~Gatilho dinâmico do Architecture Agent~~ — **Fechado** (consequência de 7.2): Feature Agent decide durante o loop, chamada tipo subagent.
3. ~~Contexto real do Review Agent~~ — **Fechado: opção B**, branch + diff + spec + resultado do checklist de verificação (7.2.1).
4. ~~Estrutura de `discorda_classificacao`~~ — **Fechado: opção B**, ganha `motivo` e `ambiguidade_sugerida`.
5. ~~Payload do HITL carregando discordância~~ — **Fechado**: `interrupt()` do `hitl_gate` passa a incluir `review_discordancia` + motivos.
6. ~~Discordância do Review na Audit~~ — **Fechado: sim**, mesmo padrão do SRE/Intake, com campo de origem do sinal a decidir depois.
7. (nota) — docstring do Architecture Agent corrigido para remover promessa de pausa/escalonamento que não existe de fato no papel dele.

---

## 8. Eval gate, nó de deploy e roteamento condicional (HITL + Eval)

### 8.1 O que existe hoje (grounded no código)

- **`eval_gate.py`** é noop total: `_run_evals` sempre retorna `{"aprovado": True, "detalhes": "eval noop: aprovado"}`. Nenhum PromptFoo, nenhum LangSmith real — só o fallback determinístico.
- **Não existe nó de deploy no grafo.** A seção 3 desta doc e o `ARCHITECTURE.md` falam em "Eval gate antes do deploy" e "SRE monitora pós-deploy", mas `graph.py` não tem nenhum nó de deploy — `platform_node` só chama `test`/`lint`.
- **Achado mais sério — os gates não gateiam de fato.** Em `graph.py`, as arestas `hitl → eval → sre → END` são todas incondicionais. Mesmo que o FDE rejeite no HITL (`aprovado=False`) ou o Eval reprove, o grafo segue em frente do mesmo jeito — o resultado fica gravado no estado (`decisao_hitl`, `resultado_eval`), mas nada no grafo reage a ele. `test_graph.py` só testa o caminho feliz (`aprovado=True` nos dois); não há teste de rejeição.
- **`langsmith` já é dependência** (`pyproject.toml`) e `observability/__init__.py` já configura tracing via `configure_langsmith()` (env vars `LANGSMITH_TRACING`/`LANGSMITH_PROJECT`) — mas só tracing, nenhum código de avaliação. `evals/__init__.py` está vazio (0 bytes): greenfield total.

### 8.2 Nó de deploy

**Decisão:** cria-se um nó `deploy` explícito (Platform Agent, MCP, chama tool `deploy`), inserido entre a aprovação do Eval gate e o SRE. Consistente com a decisão já fechada na seção 7.2 ("Deploy/observabilidade continuam como nó de grafo pós-fan-in — não fazem parte do critério de 'terminei de implementar'").

### 8.3 Roteamento condicional do HITL

**Decisão:** opção 1. `aprovado=False` → status terminal `rejeitado`, o grafo termina ali. Rejeição do FDE pode significar qualquer coisa (direção errada, spec ruim, timing errado) — não é seguro assumir um caminho de retry automático genérico; retrabalho vira nova demanda ou intervenção manual fora do grafo.

Implementação: `hitl_gate.py` precisa corrigir o status do branch reprovado — hoje retorna `"aguardando_hitl"` (rótulo obsoleto de antes do resume, tecnicamente incorreto depois que o `interrupt()` já foi resolvido) para `"rejeitado"`. `graph.py` ganha aresta condicional nova:

```python
builder.add_conditional_edges(
    "hitl",
    route_by_hitl_decision,
    {"aprovado": "eval", "rejeitado": END},
)
```

### 8.4 Roteamento condicional do Eval

**Decisão:** opção 1. `aprovado=False` → volta para `hitl` (não para o Feature Agent). O Eval é uma camada de julgamento mais alta que test/lint local (já garantido dentro do loop do Feature Agent, por 7.2) — uma falha de trajectory eval é o tipo de ambiguidade que cabe ao FDE decidir, coerente com "FDE garante julgamento humano exatamente onde a ambiguidade exige".

```python
builder.add_conditional_edges(
    "eval",
    route_by_eval_result,
    {"aprovado": "deploy", "reprovado": "hitl"},
)
builder.add_edge("deploy", "sre")
```

Não há risco de loop infinito automático: o retorno a `hitl` sempre passa por um novo `interrupt()` — precisa de uma decisão humana nova a cada volta, não é um bounce automático entre nós. Se o mesmo problema persistir numa segunda passada, cabe ao FDE rejeitar (8.3), não ao grafo decidir sozinho.

### 8.5 Eval gate real — LangSmith puro, duas camadas separadas

O ADR-0013 fala em "portar `run_all_evals.sh`" — mas esse script (do credit-analysis-agent) é um runner PromptFoo via CLI, padrão de suíte de regressão batch. LangSmith em 2026 tem duas modalidades distintas: **offline evaluation** (roda contra um `Dataset` curado, gera um `Experiment` — suíte de regressão, desacoplada de uma transação específica) e **online evaluation** (avalia o trace de uma execução real, em tempo real). O `eval_gate.py` atual é assinado como `_run_evals(spec: str)`, chamado uma vez por demanda dentro do grafo — estruturalmente o padrão online, não o padrão offline que `run_all_evals.sh` implementava. Portar 1:1 não fecha.

**Decisão:** duas camadas separadas, não uma.

1. **Eval gate real (dentro do grafo, por demanda)** — vira um evaluator **online** do LangSmith: LLM-as-judge aplicado ao trace da execução que o LangSmith já captura (via o tracing já configurado em `observability/__init__.py`), pontuando três categorias (adaptadas do padrão trajectory/finops/security do credit-analysis-agent, sem "finops" por não haver execução de pagamento aqui):
   - **Trajectory** — a classificação de ambiguidade fez sentido, Architecture foi acionado quando devia, o roteamento do grafo foi coerente com a spec.
   - **Segurança/PII** — reaproveita `pii.py`; nenhum dado raw vazou nas fronteiras.
   - **Compliance regulatório** — quando `origem=regulatorio`, o ADR/spec resultante reflete corretamente a norma de origem.
   
   Roda via `aevaluate()` (assíncrono — consistente com o `asyncio.run()` que `platform_node.py` já usa), não `evaluate()` síncrono.

2. **Suíte de regressão (fora do grafo, CI, gate de deploy do código da squad)** — herdeira direta do `run_all_evals.sh`, via SDK LangSmith em vez de CLI PromptFoo: um `Dataset` com golden trajectories, versionado, rodado em CI antes de qualquer deploy de mudança nos agentes. O caso-âncora que já existe em `test_graph.py` (Instrução Normativa → alta ambiguidade → Architecture acionado → aprovação) é candidato natural a virar o primeiro exemplo desse dataset — migra de assert Python solto para exemplo curado formal via `client.create_dataset`/`client.create_examples`, servindo tanto de teste unitário quanto de baseline de regressão.

`[DECISÃO PENDENTE]` — critério de pontuação/threshold do LLM-as-judge por categoria (o que conta como reprovação em "trajectory" vs. "compliance regulatório") e quantos golden trajectories compõem o dataset inicial de regressão além do caso-âncora — calibrar com casos reais, mesmo critério já usado nos demais parâmetros numéricos do documento.

### Resumo das decisões desta seção

1. ~~Nó de deploy explícito~~ — **Fechado**: novo nó `deploy` (Platform Agent, MCP), entre Eval aprovado e SRE.
2. ~~Roteamento condicional do HITL~~ — **Fechado: opção 1**, reprovação vira status terminal `rejeitado`, grafo termina.
3. ~~Roteamento condicional do Eval~~ — **Fechado: opção 1**, reprovação volta para `hitl` (não para o Feature Agent).
4. ~~Mecanismo real do Eval gate~~ — **Fechado**: duas camadas via LangSmith puro — evaluator online por demanda (dentro do grafo) + suíte de regressão offline via Dataset/Experiment (CI, fora do grafo).

---

## 9. HITL gate — detalhamento e correções

### 9.1 O que existe hoje (grounded no código)

- **A promessa de Redis+SSE do ADR-0005 nunca foi implementada.** Sem dependência `redis` no `pyproject.toml`, sem módulo de notificação real. `hitl_gate.py` tem um hook `notifier: Callable | None` em `make_resume_handler`, mas nada o preenche. O ADR-0014 (mais recente, descreve a implementação real) confirma: **"O tempo real é implementado via polling (~4s)... streaming real (SSE/WebSocket) fica como evolução futura no backend."** A frase do ADR-0005 ("o FDE não precisa fazer polling — recebe notificação push") não reflete o que existe.
- **`BoardView.pending()` está incompleto** — filtra por `status in {"aguardando_hitl", "em_implementacao", "em_revisao"}`, sem incluir `"aguardando_autoria"`. Itens de alta ambiguidade escalados ao FDE para autoria de spec não aparecem na fila de pendências do board.
- **`Status` (`state.py`) não tem `"rejeitado"`** — necessário para a decisão 8.3 (reprovação no HITL vira status terminal).
- **`DecisaoHitl` é binária** — `{aprovado: bool, comentario: str | None}`. Console (ADR-0014) só tem botões Aprovar/Rejeitar.

### 9.2 Decisões fechadas

**A) `Status` ganha `"rejeitado"`; `hitl_gate.py` corrige o retorno.** Consequência direta e não-opcional da 8.3 — o branch reprovado deixa de usar `"aguardando_hitl"` (rótulo obsoleto, descreve "ainda esperando" quando o `interrupt()` já foi resolvido) e passa a retornar `"rejeitado"`.

**B) `BoardView.pending()` passa a incluir `"aguardando_autoria"`** no conjunto de status filtrados. Correção de bug, não escolha de design.

**C) Granularidade da decisão do FDE — Fechado: opção 2.** Ganha um terceiro caminho, "aprovar com ressalvas": aprova e o fluxo segue normalmente, mas a preocupação fica registrada. Implementação: `DecisaoHitl` ganha `com_ressalvas: bool` (default `False`) — quando `True`, `aprovado` continua `True` (o fluxo não é bloqueado) e `comentario` passa a carregar o texto da ressalva. Console ganha um terceiro botão além de Aprovar/Rejeitar.

**D) Rejeição do FDE alimenta a Audit prospectiva — Fechado: sim**, com uma ressalva para não gerar ruído: nem toda rejeição é sobre a heurística de classificação do Intake (pode ser spec ruim, timing, decisão de negócio sem relação nenhuma com ambiguidade/domínio). Por isso, a rejeição carrega um campo adicional `impacta_classificacao: bool` — só quando `True` (o motivo da rejeição aponta que a classificação de ambiguidade/domínio estava errada) é que a rejeição vira entrada na Audit. Isso também refina a decisão 7.6.4: o valor `origem_discordancia="fde"` (que hoje mistura duas coisas — auditoria periódica retrospectiva e rejeição pontual no HITL) se divide em `"fde_auditoria"` (revisão periódica, já existente) e `"fde_hitl"` (rejeição pontual que aponta erro de classificação), mantendo `"review"` como já fechado. Três fontes distintas de sinal sobre a mesma heurística do Intake, sem misturar naturezas diferentes de correção.

**E) Polling vs. push real — Fechado: opção 1.** Aceita o polling de ~4s como suficiente para o MVP; o ADR-0005 é formalmente superado nesse ponto específico (a mecânica de `interrupt()`/`Command(resume=...)` continua válida — só a parte de "notificação push via Redis/SSE" deixa de ser a direção, substituída pelo polling que já está implementado e funcionando).

`[DECISÃO PENDENTE]` — texto exato do label/copy do terceiro botão no console ("Aprovar com ressalvas" ou outra redação) e se `impacta_classificacao` é um campo que o próprio FDE marca explicitamente no momento da rejeição, ou é inferido depois por quem audita — fica para quando o fluxo de UI dessa tela for desenhado.

### Resumo das decisões desta seção

1. ~~`Status` ganha `"rejeitado"`~~ — **Fechado**.
2. ~~`BoardView.pending()` inclui `"aguardando_autoria"`~~ — **Fechado** (correção de bug).
3. ~~Granularidade da decisão do FDE~~ — **Fechado: opção 2**, ganha "aprovar com ressalvas" via `com_ressalvas: bool`.
4. ~~Rejeição do FDE na Audit~~ — **Fechado: sim**, condicionado a `impacta_classificacao: bool`; `origem_discordancia` se refina em `"review" | "fde_auditoria" | "fde_hitl"`.
5. ~~Polling vs. push real~~ — **Fechado: opção 1**, polling aceito para o MVP, ADR-0005 superado nesse ponto.

---

## 10. SRE Agent — implementação real

### 10.1 O que existe hoje (grounded no código)

- **`sre_node.py` é o threshold puro já sinalizado como contradição na seção 7.4** — `task_gerada = not metricas.get("slo_ok", True)`. `_monitorar()` é hardcoded pra sempre devolver saúde OK. Sem MCP real, sem julgamento nenhum.
- **O loop de fechamento do ADR-0010 nunca foi implementado.** `sre_task_gerada: bool` fica gravado no estado final da execução, mas não existe scheduler/handler/worker que reaja a essa flag e dispare um novo `POST /intake` com `origem="sre"`. É um bool sem consequência.
- **O SRE está amarrado como último nó de cada execução individual do grafo** — checagem síncrona, pontual, logo após aquele item ser "deployado" (canary check daquele item específico), não um monitor contínuo da produção como um todo.

### 10.2 Decisões fechadas

**A) Onde o SRE Agent roda — Fechado: opção 1**, mantém como nó síncrono no fim de cada execução do grafo (canary check pontual pós-deploy daquele item).

**Limitação registrada, por pedido explícito:** esse desenho só cobre regressão que aparece imediatamente após o deploy do item que acabou de passar pelo grafo. Não cobre degradação lenta, error budget se esgotando ao longo de dias, ou problemas em endpoints que não tiveram deploy recente nenhum — cenário mais comum de monitoramento de SRE real. Fechar isso como opção 1 é uma decisão consciente de escopo para a Fase 2 (evita a complexidade de um scheduler novo agora), não uma cobertura completa de SRE. Fica registrado como lacuna conhecida a revisitar quando o monitoramento contínuo entrar em pauta — possivelmente como extensão futura (opção 3 da rodada anterior: nó síncrono + processo contínuo separado).

**B) Mecanismo real de julgamento — desenho fechado.** Segue o mesmo padrão de fallback determinístico + reasoner real já usado em `review_node.py`/`architecture_node.py`:

```python
class ResultadoMonitoramento(TypedDict):
    task_gerada: bool
    motivo: str                    # sempre presente, mesmo quando task_gerada=False
    descricao_task: str | None     # texto da demanda gerada — vira o `texto` do POST /intake
    metricas_brutas: dict          # anexado para rastreabilidade/auditoria
```

O reasoner (`julgar`) recebe métricas brutas + SLOs definidos por endpoint + histórico/tendência recente (não só o snapshot pontual atual) — julgamento de verdade pesa múltiplos sinais junto, não compara um número contra um threshold isolado. `motivo` é obrigatório mesmo no caminho "não gerar task" — é esse campo que sustenta a decisão D (auditoria de decisões de não agir). Substitui o `sre_task_gerada: bool` solto por um resultado estruturado — mesma lógica já aplicada ao `FeedbackReview` na seção 7.6.

**C) Quem dispara o `POST /intake` novo — Fechado, consequência de A.** Como o SRE roda síncrono dentro do próprio grafo (opção 1), o `sre_node` precisa de um novo port — `criar_demanda: Callable[[str], str] | None` —, análogo ao `ToolExecutionPort`/`LLMProviderPort` já existentes, que internamente chama o mesmo caminho usado por `POST /intake` (gera `thread_id`, invoca o grafo compilado com `origem="sre"` e `texto=descricao_task`). Esse port só pode ser wireado no nível da aplicação (`create_app()` em `api/main.py`), porque é ali que o grafo compilado e o checkpointer já existem — `make_sre_node()` sozinho, fora do contexto da API, não tem como invocar uma nova execução do próprio grafo.

**D) Auditoria da heurística do SRE — Fechado: estende.** Como `ResultadoMonitoramento.motivo` agora existe em toda checagem (não só nas que geram task), toda passagem do SRE — incluindo as que decidem não agir — fica registrada e auditável, fechando a lacuna apontada na seção 5.4 ("decisões de 'não disparar' que hoje não deixam rastro nenhum"). Mesmo padrão de `origem_discordancia` já fechado nas seções 7.6 e 9.2 — o FDE pode revisar prospectivamente tanto "o SRE gerou task e não devia" quanto "o SRE não gerou task e devia", com o texto de `motivo` como base do julgamento retrospectivo.

`[DECISÃO PENDENTE]` — onde `ResultadoMonitoramento` de cada checagem fica persistido para a Audit revisar depois (hoje o board só guarda o estado por `thread_id` de demandas que efetivamente entraram no funil; checagens que não geram task não criam thread novo, então precisam de um registro separado, fora do checkpointer do grafo) — fica para quando o schema da Audit for desenhado com os três `origem_discordancia` já fechados.

### Resumo das decisões desta seção

1. ~~Onde o SRE roda~~ — **Fechado: opção 1** (nó síncrono, canary pós-deploy), com limitação de cobertura registrada explicitamente.
2. ~~Mecanismo de julgamento real~~ — **Fechado**: `ResultadoMonitoramento` estruturado (task_gerada, motivo, descricao_task, métricas brutas), reasoner recebe métricas + SLOs + tendência recente.
3. ~~Disparo do `POST /intake`~~ — **Fechado**: novo port `criar_demanda`, wireado só no nível da API.
4. ~~Auditoria da heurística do SRE~~ — **Fechado: estende**, toda checagem (inclusive "não agir") fica auditável via `motivo`; local de persistência das checagens que não geram thread fica `[DECISÃO PENDENTE]`.

---

## 11. Board/checkpointer — multi-tenancy e isolamento por cliente

Fecha o ADR pendente desde a seção 2 ("multi-tenancy-e-isolamento-por-cliente").

### 11.1 O que existe hoje (grounded no código)

- **Nenhum campo de tenant existe em lugar nenhum.** `IntakeBody`, `BoardState`, `Origem` — nada carrega isolamento por cliente.
- **`BoardView.list_threads()`/`.all()` fazem full scan sem filtro** — não há ponto de extensão pronto pra plugar um filtro depois.
- **O checkpointer (Postgres em prod) não tem coluna nativa de tenant** — só `thread_id` + `checkpoint_ns`/`checkpoint_id`. Isolamento por tenant não vem de graça do LangGraph, precisa ser desenhado por cima.
- **Não existe auth real ainda.** ADR-0014: "Auth é mockada no MVP... OIDC é o caminho futuro, com a API preparada para auth." Tenant e auth são, na prática, a mesma lacuna.

### 11.2 Decisões fechadas

**A) Onde `tenant_id` vive — Fechado: opção 1.** Vira campo de `BoardState` (`tenant_id: str`) — mesma filosofia já fechada de "o board é o checkpointer, não um sistema à parte" (ADR-0002/seção 3), roundtrip automático via `channel_values`, zero infra nova.

**B) `thread_id` sem namespace — Fechado: opção 1.** Continua `uuid4()` puro; tenant só existe no campo de estado. **Consequência que precisa ficar registrada:** sem namespace no próprio `thread_id`, não há defesa em profundidade estrutural — o isolamento depende inteiramente de disciplina de enforcement em *todo* endpoint que toca o board (11.2C). Não existe uma segunda camada (ex.: colisão de ID entre tenants impossível por construção) pegando um filtro esquecido.

**C) Origem do `tenant_id` — desenho (seguindo boas práticas de Keycloak multi-tenant):**
- **Realm único do Keycloak**, com um atributo de usuário `tenant_id` por FDE, mapeado para o access token via Protocol Mapper (User Attribute → claim). Evita a complexidade operacional de um realm por tenant, mantendo o isolamento na camada de aplicação.
- **Dependency FastAPI (`get_current_tenant`)** decodifica o JWT (já necessário para auth) e extrai a claim — vira a única fonte de verdade.
- **`POST /intake`**: `tenant_id` vem do JWT, nunca do corpo — `IntakeBody` não ganha esse campo.
- **`GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`**: toda leitura/escrita filtra ou valida contra o tenant do JWT. Mismatch retorna **404**, não 403 — prática padrão anti-enumeração, pra não confirmar a um tenant que uma thread de outro tenant existe.
- **Exceção — demandas geradas pelo SRE Agent** (port `criar_demanda`, seção 10.2C): essa chamada é interna, sem contexto de JWT (não é uma requisição humana). `tenant_id` nesse caso propaga do próprio `state` da execução corrente (o item que acabou de ser deployado), não de claim nenhuma.

**D) FDE por tenant — Fechado: opção 1.** Fecha também uma pergunta que a seção 3 tinha deixado implícita — "FDE, único papel humano da squad" foi fechado antes de "produto vendável" (seção 2) entrar em cena. Com opção 1, cada instituição participante tem seu(s) próprio(s) FDE(s), autenticado só pro tenant dele — mais fiel ao próprio nome "Forward Deployed Engineer" (engenheiro embarcado no cliente) do que um FDE Sensedia global operando múltiplos tenants. Consequência direta em C: como cada FDE pertence a exatamente um tenant, o atributo Keycloak é uma string única, não uma lista — simplifica a claim e a checagem de autorização para uma comparação 1:1.

`[DECISÃO PENDENTE]` — se instituições participantes muito grandes precisam de múltiplos FDEs simultâneos no mesmo tenant (provável) e como isso se reflete no atributo Keycloak (um atributo por usuário continua servindo, múltiplos usuários podem compartilhar o mesmo valor de `tenant_id` — só fechar se há necessidade de papéis diferentes dentro do mesmo tenant, o que hoje não foi levantado).

### Resumo das decisões desta seção

1. ~~Onde `tenant_id` vive~~ — **Fechado: opção 1**, campo de `BoardState`.
2. ~~Namespace do `thread_id`~~ — **Fechado: opção 1**, sem namespace — isolamento depende de enforcement disciplinado em todo endpoint, sem defesa em profundidade estrutural.
3. ~~Origem do `tenant_id`~~ — **Fechado**: claim JWT via Keycloak (realm único, protocol mapper de atributo de usuário), com exceção para demandas internas do SRE Agent (propaga do state, não de JWT).
4. ~~FDE por tenant~~ — **Fechado: opção 1**, FDE autenticado e escopado a um único tenant.
