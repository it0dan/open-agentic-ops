## ADDED Requirements

### Requirement: FDE visualiza o board de demandas
O console SHALL exibir a lista de demandas do board, cada uma com origem, ambiguidade, spec_autor, domínio, status e resumo da spec (PII já mascarada na fronteira). A lista SHALL ser obtida da API `GET /board`.

#### Scenario: Lista demandas do board
- **WHEN** o FDE abre a tela de Board
- **THEN** o console exibe as demandas com origem, ambiguidade, spec_autor, domínio, status e resumo da spec

#### Scenario: Board vazio
- **WHEN** não há demandas registradas
- **THEN** o console exibe um estado vazio com mensagem orientativa

### Requirement: FDE visualiza o detalhe de uma demanda
O console SHALL exibir o detalhe completo de uma demanda selecionada, incluindo spec, worktrees (branch/status), ADRs, feedbacks de review, decisão HITL e resultado de eval, obtidos da API `GET /board/{thread_id}`.

#### Scenario: Abre detalhe de demanda
- **WHEN** o FDE seleciona uma demanda na lista
- **THEN** o console exibe o detalhe completo da demanda, incluindo worktrees, ADRs e feedbacks

#### Scenario: Demanda inexistente
- **WHEN** o FDE solicita o detalhe de um thread_id inexistente
- **THEN** a API retorna 404 e o console exibe mensagem de não encontrado

### Requirement: FDE aprova ou rejeita no HITL gate
O console SHALL permitir ao FDE aprovar ou rejeitar uma demanda que esteja aguardando HITL, enviando a decisão via `POST /resume`. A decisão SHALL incluir `aprovado` e um comentário opcional.

#### Scenario: Aprova demanda no HITL
- **WHEN** o FDE clica em "Aprovar" em uma demanda aguardando HITL
- **THEN** o console envia `POST /resume` com `aprovado: true` e o grafo retoma o fluxo

#### Scenario: Rejeita demanda no HITL
- **WHEN** o FDE clica em "Rejeitar" em uma demanda aguardando HITL
- **THEN** o console envia `POST /resume` com `aprovado: false` e o grafo marca a demanda como não aprovada

#### Scenario: Aprovação sem demanda aguardando
- **WHEN** o FDE tenta aprovar uma demanda que não está aguardando HITL
- **THEN** a API retorna erro e o console exibe a mensagem

### Requirement: FDE injeta demanda manualmente
O console SHALL permitir ao FDE injetar uma nova demanda manualmente (origem + texto), enviando via `POST /intake`. O texto SHALL ser mascarado na fronteira pelo Intake.

#### Scenario: Injeta demanda manual
- **WHEN** o FDE preenche origem e texto e submete
- **THEN** o console envia `POST /intake` e o grafo processa a nova demanda

#### Scenario: Texto vazio
- **WHEN** o FDE submete intake com texto vazio
- **THEN** a API retorna erro de validação e o console exibe a mensagem

### Requirement: FDE audita classificações do Intake
O console SHALL exibir, na visão de Auditoria, as classificações registradas pelo Intake (domínio, ambiguidade, justificativa e timestamp) por demanda, obtidas da API `GET /auditoria`.

#### Scenario: Visualiza classificações
- **WHEN** o FDE abre a visão de Auditoria
- **THEN** o console exibe as classificações do Intake com domínio, ambiguidade, justificativa e timestamp

### Requirement: FDE corrige a heurística prospectivamente
O console SHALL permitir ao FDE adicionar ou remover palavras-chave da heurística do Intake via `POST /auditoria/heuristica`. A correção SHALL ser prospectiva — vale para demandas futuras e nunca reabre implementação já feita (RNF-6).

#### Scenario: Adiciona palavra-chave à heurística
- **WHEN** o FDE adiciona uma palavra-chave à heurística de ambiguidade
- **THEN** a heurística passa a considerar a palavra-chave em demandas futuras

#### Scenario: Remove palavra-chave da heurística
- **WHEN** o FDE remove uma palavra-chave da heurística
- **THEN** a heurística deixa de considerar a palavra-chave em demandas futuras

### Requirement: Console segue o brand book Sensedia
O console SHALL aplicar a identidade visual Sensedia: paleta de cores (roxos, laranjas, azuis, neutros), tipografia Montserrat (UI) e Roboto Mono (dados técnicos), corners ≤7pt, e suporte a temas claro e escuro.

#### Scenario: Tema claro
- **WHEN** o FDE usa o tema claro
- **THEN** o console aplica fundos claros, roxo `#8241B0` para destaques e texto `#4C4C4C`

#### Scenario: Tema escuro
- **WHEN** o FDE alterna para o tema escuro
- **THEN** o console aplica fundo escuro e texto claro, mantendo a identidade Sensedia

#### Scenario: Dados técnicos em Roboto Mono
- **WHEN** o console exibe thread_id, branches ou timestamps
- **THEN** esses dados usam a fonte Roboto Mono

### Requirement: Tela de login desenhada
O console SHALL incluir uma tela de login. No MVP, a autenticação SHALL ser mockada (aceita credenciais válidas sem verificação real), mas a tela SHALL ser desenhada para evoluir para OIDC.

#### Scenario: Login com credenciais
- **WHEN** o FDE informa credenciais na tela de login
- **THEN** o console autentica (mock) e libera o acesso às demais telas

#### Scenario: Logout
- **WHEN** o FDE clica em "Sair"
- **THEN** o console encerra a sessão e retorna à tela de login
