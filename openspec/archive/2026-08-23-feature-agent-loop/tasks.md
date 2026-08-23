# Tasks — Feature Agent Loop

Decomposição do `spec.md` em tarefas executáveis. Sequência respeita dependências: estender o modelo (Guia/Worktree) → reescrever o feature_node como loop → atualizar o grafo → testes → validação.

## 1. Modelo de dados

- [x] 1.1 Estender `Guia` (dataclass frozen) com `ferramentas: tuple[str, ...]` e `checklist: tuple[str, ...]`, populados por domínio em `carregar_guia`. (Satisfaz RF-Guia-ferramentas-checklist)
- [x] 1.2 Estender `Worktree` com campos opcionais `iteracoes: int` e `historico: list[dict]`. (Satisfaz RF-Worktree-metadados)

## 2. Loop goal-based no feature_node

- [x] 2.1 Adicionar parâmetro `tools: ToolExecutionPort | None` a `make_feature_node` (default `_NoopTools`). (Satisfaz RF-Fallback-sem-provider)
- [x] 2.2 Adicionar parâmetro `max_iteracoes: int` (default 3). (Satisfaz RF-Teto-configuravel)
- [x] 2.3 Reescrever `feature_node` como loop: implementa (LLM) → roda test/lint (tools) → avalia goal → repete até goal ou teto. (Satisfaz RF-Itera-goal)
- [x] 2.4 Aplicar `pii.redigir_texto` sobre a saída do LLM e sobre o contexto realimentado; registrar `detectar_pii`. (Satisfaz RF-PII-hook)
- [x] 2.5 Preencher `iteracoes` e `historico` no `Worktree`; definir `status` (sucesso/falha) conforme resultado. (Satisfaz RF-Worktree-metadados, RF-Itera-goal)

## 3. Grafo

- [x] 3.1 Atualizar `build_graph` para repassar `tools` aos dois feature nodes. (Satisfaz RF-Fallback-sem-provider)

## 4. Testes

- [x] 4.1 Teste: goal atingido na primeira tentativa (tools ok). (Satisfaz RF-Itera-goal)
- [x] 4.2 Teste: goal atingido após correções (falha → sucesso dentro do teto). (Satisfaz RF-Itera-goal)
- [x] 4.3 Teste: teto de iterações respeitado (falha persistente → status falha, sem exceção). (Satisfaz RF-Teto-configuravel)
- [x] 4.4 Teste: PII redigida na saída e no contexto realimentado. (Satisfaz RF-PII-hook)
- [x] 4.5 Teste: Guia expõe ferramentas e checklist. (Satisfaz RF-Guia-ferramentas-checklist)
- [x] 4.6 Teste: worktree registra iteracoes e historico. (Satisfaz RF-Worktree-metadados)
- [x] 4.7 Teste: execução sem providers (fallback determinístico). (Satisfaz RF-Fallback-sem-provider)

## 5. Validação

- [x] 5.1 Rodar `poetry run pytest` (todos verdes, incluindo os existentes). 
- [x] 5.2 Rodar `poetry run ruff check .` (limpo).
