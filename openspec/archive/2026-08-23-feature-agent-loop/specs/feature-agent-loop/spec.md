## ADDED Requirements

### Requirement: Feature Agent itera até goal verificável
O Feature Agent SHALL operar como um goal-based loop: itera chamando o LLM para implementar, roda test/lint via `ToolExecutionPort` e repete até o goal (test e lint passando) ser atingido ou o teto de iterações ser alcançado.

#### Scenario: Goal atingido na primeira tentativa
- **WHEN** o Feature Agent implementa e test/lint passam na primeira iteração
- **THEN** o worktree sai do loop com `status` indicando sucesso e `iteracoes == 1`

#### Scenario: Goal atingido após correções
- **WHEN** test/lint falham nas primeiras tentativas e passam numa iteração posterior (dentro do teto)
- **THEN** o worktree sai do loop com sucesso e `iteracoes` refletindo o número de tentativas

#### Scenario: Teto de iterações atingido sem goal
- **WHEN** test/lint continuam falhando até o teto de iterações
- **THEN** o worktree sai do loop com `status` indicando falha, sem lançar exceção

### Requirement: Teto de iterações configuravel
O Feature Agent SHALL aceitar um limite máximo de iterações (`max_iteracoes`) e NUNCA ultrapassá-lo, prevenindo loop infinito.

#### Scenario: Limite respeitado
- **WHEN** o loop atinge `max_iteracoes` tentativas sem sucesso
- **THEN** o loop para imediatamente e o worktree registra o teto atingido

### Requirement: PII como hook deterministico
O Feature Agent SHALL aplicar redação PII determinística (`pii.redigir_texto`) sobre a saída do LLM e sobre o contexto de test/lint realimentado, antes de qualquer valor virar estado.

#### Scenario: PII redigida na saida
- **WHEN** a saída do LLM contém PII (ex.: CPF, email)
- **THEN** o valor armazenado no worktree tem a PII substituída por rótulo determinístico (ex.: `[CPF]`)

#### Scenario: PII redigida no contexto realimentado
- **WHEN** o resultado de test/lint contém PII
- **THEN** o contexto enviado de volta ao LLM na próxima iteração tem a PII redigida

### Requirement: Guia com ferramentas e checklist
O `Guia` SHALL expor, além do `system_prompt`, um conjunto de `ferramentas` disponíveis e um `checklist` de verificação por domínio.

#### Scenario: Guia expoe ferramentas e checklist
- **WHEN** um `Guia` é carregado para um domínio (backend/frontend/ambos)
- **THEN** ele contém `ferramentas` (ex.: test, lint) e `checklist` não vazios

### Requirement: Worktree registra metadados do loop
O `Worktree` SHALL registrar o número de iterações e o histórico de resultados de test/lint por tentativa.

#### Scenario: Historico registrado
- **WHEN** o loop executa múltiplas tentativas
- **THEN** o worktree contém `iteracoes` e um `historico` com o resultado de test/lint de cada tentativa

### Requirement: Fallback deterministico sem provider
Quando não há `LLMProviderPort` ou `ToolExecutionPort` injetado, o Feature Agent SHALL usar fallbacks determinísticos, mantendo o grafo executável e testável.

#### Scenario: Execucao sem providers
- **WHEN** o grafo roda sem LLM/tools injetados
- **THEN** o loop executa com fallbacks e o worktree é produzido sem erro
