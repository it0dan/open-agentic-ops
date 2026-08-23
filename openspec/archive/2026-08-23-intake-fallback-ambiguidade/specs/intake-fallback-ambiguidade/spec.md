## ADDED Requirements

### Requirement: Fallback de ambiguidade não reconhecida escala ao FDE

Quando a heurística determinística do Intake não reconhece nenhuma palavra-chave de `alta_ambiguidade` no texto da demanda, o sistema MUST classificar a ambiguidade como `alta` (escalando ao FDE para autoria de spec), em vez de `baixa`. A justificativa MUST ficar vazia (`[]`) para sinalizar "escalado por ausência de reconhecimento", distinto de "escalado por keyword real".

#### Scenario: Texto sem keyword de alta ambiguidade
- **WHEN** o Intake classifica um texto que não contém nenhuma palavra-chave de `alta_ambiguidade`
- **THEN** a ambiguidade é `alta`
- **AND** a justificativa é vazia (`[]`)
- **AND** `spec_autor` é `fde`

#### Scenario: Texto com keyword de alta ambiguidade
- **WHEN** o Intake classifica um texto que contém uma palavra-chave de `alta_ambiguidade`
- **THEN** a ambiguidade é `alta`
- **AND** a justificativa contém as palavras-chave que motivaram a classificação

#### Scenario: Keyword de baixa sem keyword de alta
- **WHEN** o Intake classifica um texto que contém uma palavra-chave de `baixa_ambiguidade` (ex.: "dashboard") mas nenhuma de `alta_ambiguidade`
- **THEN** a ambiguidade é `baixa`
- **AND** a justificativa contém as palavras-chave de `baixa_ambiguidade` que motivaram a classificação
- **AND** `spec_autor` é `intake`
