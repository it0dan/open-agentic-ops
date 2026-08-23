## 1. Implementação

- [x] 1.1 Adicionar parâmetro `notifier` injetável ao `create_app` (`api/main.py`), com default = log estruturado via `logging.getLogger("open_agentic_ops.hitl")`.
- [x] 1.2 No `create_app`, wirear o `notifier` ao `make_resume_handler(...)` (substituir `make_resume_handler()` por `make_resume_handler(notifier=...)`).
- [x] 1.3 Sanitizar o payload do notifier com `sanitize_for_telemetry` antes de logar (sem PII raw).

## 2. Testes

- [x] 2.1 Novo teste em `tests/test_api.py`: `POST /resume` (caminho HITL) dispara o notifier injetado com `{status: "resumed", decision: {...}}`.
- [x] 2.2 Novo teste: payload do notifier com PII na `observacao` é mascarado (ex.: `[CPF]`), nunca raw.

## 3. Validação

- [x] 3.1 `poetry run pytest` verde (todos os testes, incluindo os existentes de `POST /resume`).
- [x] 3.2 `poetry run ruff check .` limpo.
