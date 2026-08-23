## ADDED Requirements

### Requirement: Geração de embedding opensource local
O sistema SHALL gerar o embedding do texto sanitizado (pós-PII) de uma demanda usando um modelo de embedding opensource local (Sentence-Transformers), sem utilizar a LLM via AI Gateway para essa finalidade.

#### Scenario: Embedding gerado de texto sanitizado
- **WHEN** o Intake processa uma demanda com texto sanitizado
- **THEN** o sistema gera um vetor de embedding a partir do texto sanitizado usando o modelo opensource local

#### Scenario: Embedding não usa AI Gateway
- **WHEN** o sistema gera um embedding
- **THEN** ele não realiza chamada ao AI Gateway da Sensedia para essa geração

### Requirement: Busca de precedentes por similaridade semântica
O sistema SHALL buscar, via pgvector no Postgres do checkpointer, as N demandas mais similares ao texto sanitizado da demanda atual, restringindo aos registros da mesma `origem` e `dominio` com status terminal (`monitorado` ou `deployado`).

#### Scenario: Precedente similar encontrado
- **WHEN** existe uma demanda resolvida da mesma `origem` e `dominio` com similaridade acima do threshold
- **THEN** o sistema retorna o `thread_id` desse precedente como candidato

#### Scenario: Nenhum precedente similar
- **WHEN** não existe demanda resolvida da mesma `origem` e `dominio` com similaridade acima do threshold
- **THEN** o sistema retorna nenhum precedente

### Requirement: Influência do precedente na classificação de ambiguidade
O sistema SHALL reforçar a classificação de baixa ambiguidade quando houver precedente similar acima do threshold; na ausência de precedente, a demanda SHALL cair no fallback de alta ambiguidade (decisão 1 preservada).

#### Scenario: Precedente reforça baixa
- **WHEN** a demanda tem precedente similar acima do threshold e a classificação determinística resulta em baixa
- **THEN** o sistema mantém a ambiguidade como baixa e referencia o `thread_id` do precedente na justificativa

#### Scenario: Sem precedente cai no fallback de alta
- **WHEN** a demanda não tem precedente similar acima do threshold e nenhuma keyword de baixa é reconhecida
- **THEN** o sistema classifica a ambiguidade como alta (fallback)

### Requirement: Keyword literal "sem precedente" preservada
O sistema SHALL continuar tratando a keyword literal "sem precedente" como sinal explícito de alta ambiguidade, adicional à busca por similaridade.

#### Scenario: Keyword explícita de alta
- **WHEN** o texto da demanda contém "sem precedente"
- **THEN** o sistema classifica a ambiguidade como alta, independentemente da busca por similaridade

### Requirement: Justificativa referencia o precedente
O sistema SHALL incluir na `classificacao_intake.justificativa` a referência ao `thread_id` do precedente encontrado, quando aplicável.

#### Scenario: Justificativa com precedente
- **WHEN** um precedente similar é encontrado e reforça a baixa
- **THEN** a justificativa da classificação contém a referência ao `thread_id` do precedente

### Requirement: Registro do precedente da demanda atual
O sistema SHALL registrar o embedding e os metadados (thread_id, origem, dominio, texto sanitizado, status) da demanda atual na tabela de precedentes quando ela atingir status terminal, para alimentar buscas futuras.

#### Scenario: Demanda atinge status terminal
- **WHEN** uma demanda atinge status terminal (`monitorado` ou `deployado`)
- **THEN** o sistema registra seu embedding e metadados na tabela de precedentes

### Requirement: Configuração de threshold e N
O sistema SHALL tornar `SIMILARIDADE_THRESHOLD` e `SIMILARIDADE_N` configuráveis via variáveis de ambiente, com valores default.

#### Scenario: Valores default
- **WHEN** as variáveis de ambiente não estão definidas
- **THEN** o sistema usa os valores default de threshold e N

#### Scenario: Valores customizados
- **WHEN** as variáveis de ambiente estão definidas
- **THEN** o sistema usa os valores fornecidos

### Requirement: Degradação graciosa sem infra de similaridade
O sistema SHALL degradar graciosamente quando o Postgres/pgvector estiver indisponível, mantendo o comportamento atual de classificação (keyword + fallback) sem quebrar o pipeline.

#### Scenario: Postgres indisponível
- **WHEN** o Postgres/pgvector está indisponível durante a classificação
- **THEN** o sistema trata a busca de precedentes como vazia e mantém a classificação determinística atual
