## Why

O HITL gate (ADR-0005/0009) pausa o fluxo via `interrupt()` até o FDE aprovar/rejeitar via `POST /resume`. O desenho prevê notificação (push) ao FDE, mas `NotificationPort.notify` nunca é chamado: `api/main.py:107` cria `make_resume_handler()` sem `notifier`, deixando o canal de notificação como porta morta. O FDE depende exclusivamente de polling (~4s) para descobrir que precisa agir.

## What Changes

- Wirear um `notifier` concreto (log estruturado) no `make_resume_handler` dentro do `create_app` (`api/main.py`).
- `NotificationPort.notify` passa a ser chamado quando o FDE retoma uma demanda via `POST /resume` (payload `{status: "resumed", decision: {...}}`).
- Sanitizar o payload do notifier (sem PII raw) antes de logar, reutilizando `sanitize_for_telemetry`.
- Teste novo: `POST /resume` (caminho HITL) dispara o notifier.

## Capabilities

### New Capabilities
- `hitl-notifier`: notificação do FDE quando há ação de HITL a retomar via `POST /resume`, com payload sanitizado (sem PII raw).

### Modified Capabilities
<!-- Nenhuma spec existente muda de comportamento. -->

## Impact

- `api/main.py` — `create_app` passa `notifier` ao `make_resume_handler`.
- `src/open_agentic_ops/gates/hitl_gate.py` — assinatura já aceita `notifier`; sem mudança de lógica.
- `src/open_agentic_ops/observability/__init__.py` — reuso de `sanitize_for_telemetry`.
- `tests/test_api.py` — teste novo do disparo do notifier.
- Sem mudanças de API pública, frontend, grafo ou dependências.
