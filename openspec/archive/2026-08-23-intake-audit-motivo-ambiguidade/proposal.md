## Why

A tela Audit permite ao FDE revisar as classificações de ambiguidade do Intake e corrigir a heurística prospectivamente. Hoje o fluxo de correção só tem um mecanismo: adicionar/remover palavra-chave. Isso não distingue **por que** o FDE discorda — se faltou uma palavra-chave (resolvível adicionando à lista) ou se a demanda é ambígua de um jeito que nenhuma lista resolve. A decisão 4 da seção 6 do documento de definições fechou que a evolução da heurística para LLM deve ser disparada por **sinal qualitativo**: um contador específico de "ambíguo demais para keyword", não a taxa bruta de discordância. Esse gatilho não tem onde acontecer hoje.

## What Changes

- Adiciona um **segundo motivo de discordância** na Audit: "ambíguo demais para keyword".
- Novo endpoint backend `POST /auditoria/ambigua` que **incrementa um contador em memória** (sem tocar a `heuristica.json`).
- Exposição do contador via leitura para o frontend.
- Tela Audit ganha o segundo motivo de discordância e exibe o contador.

## Capabilities

### New Capabilities
- `intake-audit-motivo-ambiguidade`: sinal qualitativo de "ambíguo demais para keyword" na Auditoria do Intake — contador em memória que serve de gatilho para considerar evoluir a heurística para LLM, sem gerar correção de heurística.

### Modified Capabilities
<!-- Nenhuma spec existente é modificada; não há spec canônica da Audit/Intake em openspec/specs/. -->

## Impact

- **Backend**: `api/main.py` (novo endpoint `POST /auditoria/ambigua` + leitura do contador).
- **Frontend**: `frontend/app/(dashboard)/audit/page.tsx` (segundo motivo + exibição do contador), `frontend/lib/api.ts` (novas funções), `frontend/lib/mock-data.ts` (mock do contador).
- **Testes**: `tests/test_api.py` (novos testes do endpoint).
- **Sem impacto** no grafo LangGraph, modelo de estado do board ou infraestrutura.
