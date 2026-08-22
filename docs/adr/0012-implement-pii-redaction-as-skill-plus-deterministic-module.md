# Implementar redação PII como skill-guia + módulo determinístico

## Status

Accepted

## Context

O ADR-0006 define *o que* (escopo LGPD/FAPI-BR) e *onde* (todas as fronteiras) mascarar PII, mas não a mecânica de implementação na fronteira do Intake.

## Decision

Implementar a redação PII na fronteira do Intake combinando:
- **Skill `pii-sanitizer` como guia** (feedforward) — orienta o Intake sobre o que é PII e como mascarar.
- **Módulo de redação determinístico como ferramenta** — executa o mascaramento de forma confiável (regex + classificação LGPD), sem depender do LLM para a redação em si.

## Consequences

- Redação determinística e auditável (não depende do julgamento do LLM).
- A skill orienta o Intake; o módulo executa — separação entre guia e ferramenta.
- PII raw nunca entra no sistema (ver ADR-0006).
