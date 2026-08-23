## ADDED Requirements

### Requirement: Redação de chave Pix aleatória (UUID)

O sistema MUST mascarar chave Pix aleatória em formato UUID no texto da demanda, substituindo por `[CHAVE_PIX]`. A categoria LGPD MUST ser `sensivel`.

#### Scenario: Chave Pix aleatória em texto livre
- **WHEN** o texto contém uma chave Pix aleatória em formato UUID (ex.: `123e4567-e89b-12d3-a456-426614174000`)
- **THEN** `redigir_texto` substitui por `[CHAVE_PIX]`
- **AND** `detectar_pii` classifica como `sensivel`

### Requirement: Redação de conta/agência bancária

O sistema MUST mascarar número de conta/agência bancária com separador (hífen/barra) no texto da demanda, substituindo por `[CONTA]`. A categoria LGPD MUST ser `sensivel`.

#### Scenario: Conta/agência com separador em texto livre
- **WHEN** o texto contém conta/agência com separador (ex.: `ag 1234-5 conta 56789-0`)
- **THEN** `redigir_texto` substitui por `[CONTA]`
- **AND** `detectar_pii` classifica como `sensivel`

### Requirement: Preservação dos padrões existentes

O sistema MUST continuar mascarando os padrões PII já cobertos (CPF, CNPJ, e-mail, telefone, data de nascimento, CEP) após a adição dos novos padrões.

#### Scenario: Padrões existentes continuam funcionando
- **WHEN** o texto contém CPF, e-mail e telefone
- **THEN** `redigir_texto` continua substituindo por `[CPF]`, `[EMAIL]` e `[TELEFONE]`
