# Mascarar PII na fronteira de entrada (Intake)

## Status

Accepted

## Context

O handoff original dizia "CPF sempre mascarado entre agentes". A maturação ampliou o escopo: PII é definida pela classificação LGPD (dado pessoal vs. sensível), informada pelo perfil de segurança do Open Finance (FAPI-BR) — claim `sub` quando identifica pessoa, claims OIDC (data de nascimento, endereço, telefone), CPF, CNPJ. O mascaramento interno entre agentes não é mandato oficial, mas decisão de engenharia informada por essa definição. LangSmith/OTel capturam payloads — se um nó recebe PII raw, ela vaza para a telemetria.

## Decision

Mascarar PII **na fronteira de entrada (Intake Agent)**, ancorado em classificação LGPD (não lista fixa de campos). Aplicar em todas as fronteiras: comunicação inter-agente, estado do checkpointer, telemetria (LangSmith/OTel), evals (PromptFoo) e logs. Sanitizar payloads antes de enviar à telemetria. A regra mais robusta: **PII raw nunca entra no sistema** — mascarada na entrada, as demais fronteiras herdam a proteção.

## Consequences

- PII raw nunca chega ao LangSmith/OTel, mesmo que um agente intermediário receba dado por engano.
- A classificação LGPD define *o que* é PII; o mascaramento na entrada define *onde* ela é neutralizada.
- Necessário implementar redaction de payloads na telemetria e sanitização no checkpointer.
- Requer manter a classificação LGPD atualizada conforme novas APIs do Open Finance adicionam campos sensíveis.
