## 1. Backend

- [ ] 1.1 Adicionar contador em memória de "ambíguo demais para keyword" no escopo do app em `api/main.py`.
- [ ] 1.2 Adicionar endpoint `POST /auditoria/ambigua` (incrementa contador, retorna novo valor, não toca a heurística).
- [ ] 1.3 Adicionar leitura do contador (ex.: `GET /auditoria/ambigua`).

## 2. Frontend

- [ ] 2.1 Adicionar funções no `frontend/lib/api.ts` (registrar ambiguidade + ler contador).
- [ ] 2.2 Adicionar segundo motivo de discordância "Ambíguo demais para keyword" na tela Audit (`frontend/app/(dashboard)/audit/page.tsx`).
- [ ] 2.3 Exibir o contador na tela Audit (card/métrica).
- [ ] 2.4 Atualizar mock em `frontend/lib/mock-data.ts` se necessário.

## 3. Testes e validação

- [ ] 3.1 Adicionar testes do endpoint `POST /auditoria/ambigua` em `tests/test_api.py`.
- [ ] 3.2 Rodar `poetry run pytest` e garantir todos verdes.
- [ ] 3.3 Rodar `poetry run ruff check .` e garantir limpo.
- [ ] 3.4 Rodar `npm run lint`, `npm run build` e `npm test` no `frontend/` e garantir verdes.
