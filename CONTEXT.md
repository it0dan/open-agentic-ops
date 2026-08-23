# CONTEXT.md — Open Agentic Ops

Glossário do domínio da squad agêntica que opera o ciclo de vida de Open Finance. Define os termos canônicos usados na arquitetura, nos ADRs e no código. Não é spec nem scratch pad — é só vocabulário.

## Linguagem

**Board**:
O estado corrente de todas as demandas da squad, materializado pelo checkpointer do grafo LangGraph (cada execução = um thread). Não é um sistema separado.
_Avoid_: backlog, fila, kanban
_Nota de UI_: no console do FDE, a tela que lista as demandas chama-se **Registry** (rota `/registry`) — "Board" permanece como termo arquitetural (o checkpointer), não como nome de tela, para não colidir com Dashboard nem evocar Kanban.

**Origem**:
Uma das 4 entradas que alimentam o board: Cliente, Regulatório/Informes, Estratégia/Sensedia, SRE (produção). Cada item do board é tagueado pela origem.
_Avoid_: fonte, canal, gatilho

**Ambiguidade**:
Classificação dada pelo Intake Agent a cada item, em baixa ou alta. Baixa + precedente → Intake rascunha a spec; alta → escala ao FDE.
_Avoid_: complexidade, dificuldade, incerteza

**Guia**:
O skill de domínio (feedforward) que parametriza o Feature Agent — a única diferença entre as instâncias backend e frontend. Não é um agente novo. Em implementação, é uma skill (SKILL.md) carregada pelo nó Feature Agent e injetada no system prompt.
_Avoid_: skill de domínio, prompt de agente, role

**Worktree**:
Branch paralelo de implementação (git worktree) onde um Feature Agent roda seu loop. Backend e frontend rodam em worktrees distintos que convergem.
_Avoid_: branch, sandbox, ambiente

**Gate**:
Checkpoint de processo que bloqueia o avanço até uma condição ser satisfeita. HITL gate (aprovação humana do FDE antes do merge) e Eval gate (trajectory eval PromptFoo antes do deploy).
_Avoid_: approval, review step, stage

**FDE**:
Forward Deployed Engineer — o único papel humano da squad. Três funções: autoria de spec (só alta ambiguidade), aprovador único no HITL gate, auditor periódico das classificações do Intake (sempre prospectivo).
_Avoid_: operador, admin, dono

**PII**:
Dado pessoal ou dado sensível, no vocabulário LGPD. Escopo informado pelo perfil de segurança do Open Finance (FAPI-BR): claim `sub` quando identifica pessoa, claims OIDC (data de nascimento, endereço, telefone), CPF, CNPJ. Sempre mascarado na fronteira de entrada (Intake).
_Avoid_: CPF, dado do cliente, dado confidencial

**Grafo**:
A topologia da squad modelada como grafo LangGraph — nós (agentes), arestas e arestas condicionais (branch de ambiguidade, fan-out/fan-in dos worktrees), checkpoints. É o que torna o Graph Engineering literal.
_Avoid_: fluxo, pipeline, workflow

**Loop**:
O ciclo intra-agente de tool-calling de uma instância (o `while` até o LLM parar de chamar ferramentas). Distinto do Grafo (inter-agente).
_Avoid_: iteração, turno, ciclo

**Resume**:
A ponte `POST /resume` pela qual o FDE se conecta ao grafo para retomar uma execução pausada. Usada em dois momentos: aprovação no HITL gate e injeção da spec autorada (alta ambiguidade).
_Avoid_: retomar, continuar, callback

**Redação PII**:
O mecanismo de mascaramento de PII na fronteira de entrada (Intake). Combina uma skill (`pii-sanitizer`) como guia (feedforward) com um módulo de redação determinístico como ferramenta. Ancorado em classificação LGPD.
_Avoid_: anonimização, ofuscação, sanitização
