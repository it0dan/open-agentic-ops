## Context

O módulo `pii/__init__.py` implementa a redação PII determinística na fronteira de entrada (ADR-0006/0012), combinando a skill `pii-sanitizer` (guia) com regex + classificação LGPD (ferramenta). A estrutura `PadraoPII` encapsula categoria, rótulo, regex e substituição; a tupla `PADROES` é iterada por `redigir_texto`, `detectar_pii` e `sanitizar_payload`.

Estado atual: `PADROES` cobre CPF, CNPJ, e-mail, telefone, data de nascimento e CEP. Não cobre padrões específicos de Open Finance (conta/agência bancária e chave Pix aleatória/UUID), que são dados sensíveis no domínio.

A decisão 3 da seção 6 do documento de definições foi fechada: cobrir agora, por precaução, priorizando over-redaction (segurança > precisão).

## Goals / Non-Goals

**Goals:**
- Adicionar padrão de chave Pix aleatória (UUID) → `[CHAVE_PIX]`, categoria `sensivel`.
- Adicionar padrão de conta/agência bancária → `[CONTA]`, categoria `sensivel`, abordagem permissiva com separador.
- Manter os padrões existentes intactos.
- Mudança mínima, sem alterar assinaturas nem o contrato do módulo.

**Non-Goals:**
- Similaridade semântica via pgvector (decisão 2) — depende de infra.
- Novo motivo de discordância na Audit (decisão 4).
- Calibração fina do regex de conta/agência com exemplos reais de múltiplas instituições (evolução futura).
- Mudanças de UI, API pública ou grafo.

## Decisions

**D1 — Chave Pix aleatória (UUID) como padrão novo.**
Os 4 formatos de chave Pix são: CPF, CNPJ, e-mail, telefone e chave aleatória (UUID). Os 4 primeiros já são cobertos pelos regex existentes; apenas a chave aleatória (UUID) é genuinamente nova. Regex UUID padrão: `\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b`. Categoria `sensivel` (identifica recurso financeiro do titular). Alternativa considerada: não adicionar por ser raro — rejeitada pela decisão de over-redaction.

**D2 — Conta/agência bancária com abordagem permissiva com separador.**
O formato de conta/agência varia por instituição, então um regex rígido geraria muitos falsos negativos. Abordagem escolhida: reconhecer padrões com separadores explícitos (hífen/barra) que indicam conta/agência, ex.: `ag 1234-5 conta 56789-0`, `1234-5/56789-0`. Regex permissivo, aceitando mais falso positivo (over-redaction). Alternativas consideradas: contextual (depender de "ag"/"conta") — rejeitada por perder formatos sem palavra-chave; esperar exemplos reais — rejeitada por adiar a proteção (decisão fechada de cobrir agora).

**D3 — Testes novos em `tests/test_pii.py`.**
Adicionar testes que verificam a redação dos novos padrões e a classificação como `sensivel`, seguindo o padrão dos testes existentes.

## Risks / Trade-offs

- [Falso positivo do regex de conta/agência] → Pode mascarar números com hífen/barra que não são conta (ex.: "v7.0"). Aceito pela decisão de over-redaction.
- [Formato variável de conta/agência] → Regex permissivo pode não capturar todos os formatos. Calibração fina fica para evolução futura com exemplos reais.
- [UUID falso positivo] → UUIDs podem aparecer em outros contextos (IDs de sistema). Aceito pela decisão de over-redaction.
