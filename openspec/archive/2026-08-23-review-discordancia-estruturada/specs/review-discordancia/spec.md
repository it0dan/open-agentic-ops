## ADDED Requirements

### Requirement: FeedbackReview estruturado com motivo e ambiguidade sugerida

O sistema SHALL representar a discordância de classificação do Review Agent de forma estruturada, com `motivo` (argumento da discordância) e `ambiguidade_sugerida` (reclassificação proposta), além do booleano `discorda_classificacao`.

#### Scenario: Review discorda com motivo e reclassificação

- **WHEN** o Review Agent discorda da classificação do Intake
- **THEN** o `FeedbackReview` correspondente contém `discorda_classificacao: True`, `motivo` preenchido e `ambiguidade_sugerida` com o valor proposto

#### Scenario: Review concorda sem motivo

- **WHEN** o Review Agent concorda com a classificação do Intake
- **THEN** o `FeedbackReview` correspondente contém `discorda_classificacao: False` e `motivo`/`ambiguidade_sugerida` ausentes (None)

### Requirement: Review node com contexto real e caminho para discordar

O nó Review SHALL receber contexto real (branch + diff + spec + checklist de verificação do Guia) e SHALL produzir discordância estruturada quando o contexto indicar violação, em vez de retornar `discorda_classificacao: False` hardcoded.

#### Scenario: Checklist aponta violação e gera discordância

- **WHEN** o checklist de verificação do domínio indica uma violação (ex.: PII em claro na resposta)
- **THEN** o Review produz um `FeedbackReview` com `discorda_classificacao: True`, `motivo` descrevendo a violação e `ambiguidade_sugerida` preenchida

#### Scenario: Checklist sem violação mantém fluxo feliz

- **WHEN** o checklist de verificação não indica violação
- **THEN** o Review produz `FeedbackReview` com `discorda_classificacao: False` e o fluxo segue sem escalonamento

### Requirement: Payload do HITL carrega discordância do Review

O payload do `interrupt()` do HITL SHALL incluir `review_discordancia: True` e a lista de motivos quando qualquer `feedback_review` discordar da classificação, para que o FDE veja a discordância na notificação.

#### Scenario: Há discordância no lote

- **WHEN** pelo menos um `feedback_review` tem `discorda_classificacao: True`
- **THEN** o payload do `interrupt()` do HITL contém `review_discordancia: True` e os motivos das discordâncias

#### Scenario: Nenhuma discordância no lote

- **WHEN** nenhum `feedback_review` discorda da classificação
- **THEN** o payload do `interrupt()` do HITL não contém `review_discordancia`

### Requirement: Origem da discordância registrada e auditável

O sistema SHALL registrar a origem do sinal de discordância (`origem_discordancia`) no estado e SHALL expô-la na Audit, distinguindo a fonte do sinal (`review`, `fde_auditoria`, `fde_hitl`).

#### Scenario: Discordância do Review registrada com origem

- **WHEN** o Review Agent discorda da classificação
- **THEN** o estado registra `origem_discordancia: "review"` e a Audit expõe a discordância com essa origem

#### Scenario: Tipos de origem reservados

- **WHEN** o sistema modela a origem da discordância
- **THEN** os valores `"review"`, `"fde_auditoria"` e `"fde_hitl"` são os únicos válidos para `origem_discordancia`

### Requirement: Docstring do Architecture sem promessa de pausa/escala

O docstring do `architecture_node.py` SHALL NOT conter a promessa de "pausa e escala ao FDE", pois o papel do Architecture Agent é puramente consultivo (aconselha, não veta).

#### Scenario: Docstring reflete papel consultivo

- **WHEN** o `architecture_node.py` é inspecionado
- **THEN** seu docstring não contém a frase "pausa e escala ao FDE"
