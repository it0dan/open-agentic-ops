## ADDED Requirements

### Requirement: Notificação do FDE no resume do HITL

O sistema SHALL notificar o FDE quando uma demanda é retomada via `POST /resume`, invocando o `NotificationPort.notify` com um payload estruturado `{status: "resumed", decision: {...}}` e sem PII raw.

#### Scenario: Resume no caminho HITL dispara notificação

- **WHEN** o FDE chama `POST /resume` com `decisao` para uma demanda aguardando HITL
- **THEN** o sistema invoca o notifier com `thread_id` e payload `{status: "resumed", decision: {decisao, observacao}}`

#### Scenario: Payload da notificação sem PII raw

- **WHEN** o notifier é invocado com um payload cuja `observacao` contém PII (ex.: CPF)
- **THEN** o payload logado tem a PII mascarada (ex.: `[CPF]`), nunca o valor raw
