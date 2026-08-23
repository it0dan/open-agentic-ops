## Why

O módulo `pii/__init__.py` mascara PII na fronteira de entrada (Intake), mas cobre apenas padrões genéricos (CPF, CNPJ, e-mail, telefone, data de nascimento, CEP). Não reconhece padrões específicos de Open Finance — **número de conta/agência bancária** e **chave Pix aleatória (UUID)** — que são dados sensíveis no domínio. Se um texto de demanda contiver esses dados, eles passam em claro para o sistema, violando o princípio do ADR-0006 ("PII raw nunca entra no sistema"). A decisão 3 da seção 6 do documento de definições foi fechada: cobrir agora, por precaução, priorizando over-redaction.

## What Changes

- Adiciona 2 novos `PadraoPII` à tupla `PADROES` em `src/open_agentic_ops/pii/__init__.py`:
  - **Chave Pix aleatória (UUID)** — categoria `sensivel`, rótulo `CHAVE_PIX`, substituição `[CHAVE_PIX]`. Os outros 3 formatos de Pix (CPF, CNPJ, e-mail, telefone) já são cobertos pelos regex existentes.
  - **Conta/agência bancária** — categoria `sensivel`, rótulo `CONTA_BANCARIA`, substituição `[CONTA]`. Abordagem permissiva com separador (hífen/barra), aceitando mais falso positivo (over-redaction).
- Adiciona testes para os novos padrões em `tests/test_pii.py`.

## Capabilities

### New Capabilities
- `intake-pii-financeiro`: cobertura de PII financeira específica de Open Finance (chave Pix aleatória/UUID e conta/agência bancária) na redação determinística da fronteira de entrada.

### Modified Capabilities
<!-- Nenhuma spec existente é modificada; não há spec canônica do Intake/PII em openspec/specs/. -->

## Impact

- **Código**: `src/open_agentic_ops/pii/__init__.py` (tupla `PADROES`).
- **Testes**: `tests/test_pii.py` (novos testes).
- **Consumidores**: `redigir_texto`, `detectar_pii`, `sanitizar_payload` — herdam a proteção automaticamente (sem mudança de assinatura).
- **Sem impacto** em API pública, frontend, grafo ou infraestrutura.
