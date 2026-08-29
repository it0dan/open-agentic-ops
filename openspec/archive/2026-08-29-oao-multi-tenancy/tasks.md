## Grupo 1 — BoardView com filtro por tenant (C.2/D18)

- [ ] 1.1 `BoardView.all(tenant_id=None)` filtra por `tenant_id`.
- [ ] 1.2 `BoardView.snapshot(thread_id, tenant_id=None)` valida tenant (None se mismatch).

## Grupo 2 — Isolamento por tenant nos endpoints (C.1/D19)

- [ ] 2.1 `GET /tasks` filtra por tenant do JWT.
- [ ] 2.2 `GET /tasks/{thread_id}` valida tenant (mismatch → 404).
- [ ] 2.3 `POST /resume` valida tenant (mismatch → 404).
- [ ] 2.4 `POST /intake` usa tenant do JWT (não `TENANT_DEFAULT`).
- [ ] 2.5 `GET /auditoria` filtra por tenant do JWT.

## Grupo 3 — Auth real no console (D20)

- [ ] 3.1 Dependency `get_current_tenant` aplicada aos endpoints de dados do console.
- [ ] 3.2 Endpoints sem token → 401/403.

## Grupo 4 — Testes e validação

- [ ] 4.1 Atualizar `tests/test_api.py` para injetar provider mockado (`HeaderScopeProvider`).
- [ ] 4.2 Novos testes de isolamento por tenant (mismatch → 404, filtro por tenant, intake com tenant do JWT).
- [ ] 4.3 `poetry run pytest` verde; `poetry run ruff check .` limpo.

## Grupo 5 — Docs e arquivamento

- [ ] 5.1 Criar ADR-0023 (isolamento por tenant no console + auth real).
- [ ] 5.2 Atualizar `HANDOFF.md`, `README.md`, `ARCHITECTURE.md`.
- [ ] 5.3 Arquivar o change `oao-multi-tenancy` em `openspec/archive/`.
- [ ] 5.4 Commits coesos + push (após confirmação).
