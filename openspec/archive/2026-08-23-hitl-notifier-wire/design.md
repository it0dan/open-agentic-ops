## Context

O HITL gate (ADR-0005/0009) usa `interrupt()` nativo do LangGraph; o FDE aprova/rejeita via `POST /resume`, que injeta a decisão via `Command(resume=...)`. O desenho prevê notificação (push) ao FDE, formalizada na porta `NotificationPort.notify` (`ports/__init__.py:48-58`). Porém `api/main.py:107` cria `make_resume_handler()` sem `notifier`, então o callback de notificação nunca é invocado — o canal de push é uma porta morta.

`make_resume_handler(notifier=...)` (`gates/hitl_gate.py:42-52`) já aceita o parâmetro e chama `notifier(thread_id, {"status": "resumed", "decision": decision})` quando fornecido. Falta apenas wirear um notifier concreto no `create_app`.

## Goals / Non-Goals

**Goals:**
- Wirear um `notifier` concreto (log estruturado) no `make_resume_handler` dentro do `create_app`.
- `NotificationPort.notify` passa a ser chamado no resume (payload `{status: "resumed", decision: {...}}`).
- Payload do notifier sanitizado (sem PII raw), reutilizando `sanitize_for_telemetry`.
- Teste novo cobrindo o disparo do notifier no caminho HITL.

**Non-Goals:**
- Redis/SSE real (push) — Camada 2, depende de infra.
- Notificação no momento em que a demanda **entra** no HITL (só no resume nesta rodada).
- Mudanças no grafo, gates, frontend ou outros nós.
- Multi-tenancy (ADR-0015).

## Decisions

**D1 — Notifier concreto = log estruturado (Camada 1).**
Um closure `notifier(thread_id, payload)` que emite log estruturado via `logging.getLogger("open_agentic_ops.hitl")`. Alternativas: Redis/SSE (adiado para Camada 2, depende de infra) e no-op (não resolve o gap). O log estruturado é o canal mínimo que fecha o loop estruturalmente e é observável.

**D2 — Sanitização do payload antes de logar.**
O payload do `notify` contém `decision` (decisão do FDE). Embora a decisão seja tipada (`decisao`/`observacao`), a `observacao` é texto livre do FDE e pode conter PII. Reutilizar `sanitize_for_telemetry` (`observability/__init__.py`) para mascarar PII antes de logar, alinhado ao ADR-0006 (PII em todas as fronteiras).

**D3 — Teste via injeção de notifier no `create_app`.**
Para testar sem depender do log, `create_app` ganha um parâmetro `notifier` injetável (default = log estruturado). O teste injeta um spy e verifica que `POST /resume` (caminho HITL) o dispara com `{status: "resumed", decision: {...}}`. Alternativa: capturar logs via `caplog` — menos direto e frágil.

## Risks / Trade-offs

- [Notifier chamado em ambos os caminhos (HITL e autoria de spec)] → O teste cobre o caminho HITL especificamente; o comportamento nos dois caminhos é desejado (ambos são ações do FDE).
- [Log pode vazar PII na `observacao`] → Sanitização via `sanitize_for_telemetry` antes de logar (D2).
- [Quebrar testes existentes de `POST /resume`] → `create_app` mantém default compatível (log estruturado); testes existentes não injetam notifier e continuam válidos.
