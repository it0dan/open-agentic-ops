## 1. Implementação do fallback

- [x] 1.1 Alterar `classificar_ambiguidade` em `src/open_agentic_ops/nodes/intake.py`: sem hit de `alta_ambiguidade`, passar a escalar ao FDE em vez de seguir como baixa.

## 2. Preservação do caminho de baixa

- [x] 2.1 Adicionar conjunto `baixa_ambiguidade` ao `Heuristica` (defaults + `heuristica.json`) e à serialização/desserialização.
- [x] 2.2 Atualizar `classificar_ambiguidade` com precedência: keyword de alta → `alta`; senão keyword de baixa → `baixa`; senão → `alta` (fallback invertido, justificativa vazia).
- [x] 2.3 Manter os 4 testes de baixa (`test_intake`, `test_runtime_ext`, `test_graph`, `test_api`) cobrindo o caminho de baixa via keyword de `baixa_ambiguidade` (ex.: "dashboard").
- [x] 2.4 Adicionar teste novo do fallback invertido: texto sem keyword de alta nem de baixa → `("alta", [])`.

## 3. Validação

- [x] 3.1 Rodar `poetry run pytest` e garantir todos verdes.
- [x] 3.2 Rodar `poetry run ruff check .` e garantir limpo.
