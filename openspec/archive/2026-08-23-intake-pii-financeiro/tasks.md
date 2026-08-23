## 1. Implementação dos padrões PII

- [ ] 1.1 Adicionar regex de chave Pix aleatória (UUID) e `PadraoPII` (`CHAVE_PIX`, categoria `sensivel`) em `src/open_agentic_ops/pii/__init__.py`.
- [ ] 1.2 Adicionar regex de conta/agência bancária (permissivo com separador) e `PadraoPII` (`CONTA_BANCARIA`, categoria `sensivel`) em `src/open_agentic_ops/pii/__init__.py`.

## 2. Testes

- [ ] 2.1 Adicionar teste de redação de chave Pix aleatória (UUID) → `[CHAVE_PIX]` em `tests/test_pii.py`.
- [ ] 2.2 Adicionar teste de redação de conta/agência com separador → `[CONTA]` em `tests/test_pii.py`.
- [ ] 2.3 Adicionar teste de classificação `sensivel` dos novos padrões via `detectar_pii` em `tests/test_pii.py`.

## 3. Validação

- [ ] 3.1 Rodar `poetry run pytest` e garantir todos verdes.
- [ ] 3.2 Rodar `poetry run ruff check .` e garantir limpo.
