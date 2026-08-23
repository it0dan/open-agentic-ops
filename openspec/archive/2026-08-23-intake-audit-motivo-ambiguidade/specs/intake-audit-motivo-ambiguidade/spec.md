## ADDED Requirements

### Requirement: Registro de discordância "ambíguo demais para keyword"

O sistema MUST permitir ao FDE registrar que uma classificação é "ambígua demais para keyword resolver", incrementando um contador específico em memória, SEM alterar a `heuristica.json`.

#### Scenario: FDE sinaliza ambiguidade não resolvível por keyword
- **WHEN** o FDE registra "ambíguo demais para keyword" para uma classificação via `POST /auditoria/ambigua`
- **THEN** o contador em memória é incrementado
- **AND** a `heuristica.json` NÃO é alterada
- **AND** a resposta retorna o novo valor do contador

### Requirement: Exposição do contador de ambiguidade

O sistema MUST expor o valor corrente do contador de "ambíguo demais para keyword" para leitura pelo frontend.

#### Scenario: Leitura do contador
- **WHEN** o frontend consulta o contador (ex.: `GET /auditoria/ambigua`)
- **THEN** a resposta retorna o valor corrente do contador

### Requirement: Segundo motivo de discordância na tela Audit

A tela Audit MUST oferecer o segundo motivo de discordância "ambíguo demais para keyword", distinto do fluxo de correção de palavra-chave, e MUST exibir o valor corrente do contador.

#### Scenario: FDE usa o segundo motivo na UI
- **WHEN** o FDE clica em "Ambíguo demais para keyword" para uma classificação na tela Audit
- **THEN** o contador é incrementado via API
- **AND** o valor atualizado é exibido na tela
