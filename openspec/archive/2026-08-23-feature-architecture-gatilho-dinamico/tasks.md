## 1. Implementação (backend)

- [x] 1.1 Adicionar heurística `_toca_contrato_externo(spec)` em `feature_node.py` (keywords: `contrato externo`, `fapi-br`, `endpoint externo`, `schema`, `manual de apis`, `manual de escopo`, `portabilidade`, `instrucao normativa`, `oauth`, `token`).
- [x] 1.2 `feature_node` retorna `toca_contrato_externo: bool` no estado (domínio backend/ambos; `False` para frontend).
- [x] 1.3 `graph/__init__.py`: adicionar `route_by_architecture` e aresta condicional `fan_in → {architecture | review}`.
- [x] 1.4 Remover a flag global `architecture_enabled` do `build_graph` e do bloco de montagem.

## 2. Testes

- [x] 2.1 Novo teste: spec backend que toca contrato externo → Architecture acionado (ADR presente).
- [x] 2.2 Novo teste: spec backend rotineira → Architecture não acionado (sem ADR).
- [x] 2.3 Novo teste: domínio frontend → `toca_contrato_externo: False`.
- [x] 2.4 Atualizar/validar testes existentes do caso-âncora (Architecture ainda acionado na spec regulatória).

## 3. Validação

- [x] 3.1 `poetry run pytest` verde.
- [x] 3.2 `poetry run ruff check .` limpo.
