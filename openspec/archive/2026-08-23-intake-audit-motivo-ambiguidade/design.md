## Context

A tela Audit (`frontend/app/(dashboard)/audit/page.tsx`) permite ao FDE revisar as classificações de ambiguidade do Intake e corrigir a heurística prospectivamente (RNF-6). O fluxo de correção atual (`corrigirHeuristica` → `POST /auditoria/heuristica`) só adiciona/remove palavra-chave na `heuristica.json`.

A decisão 4 da seção 6 do documento de definições fechou que a evolução da heurística para LLM deve ser disparada por sinal qualitativo: um contador específico de "ambíguo demais para keyword", distinto da taxa bruta de discordância. Esse contador não gera correção de heurística — é apenas o gatilho/sinal.

## Goals / Non-Goals

**Goals:**
- Adicionar o segundo motivo de discordância "ambíguo demais para keyword" na Audit.
- Incrementar um contador em memória via novo endpoint, sem tocar a `heuristica.json`.
- Expor o contador para o frontend e exibi-lo na tela Audit.
- Mudança mínima, sem alterar o grafo nem o modelo de estado do board.

**Non-Goals:**
- Similaridade semântica via pgvector (decisão 2) — depende de infra.
- Evolução efetiva da heurística para LLM (o contador é só o gatilho/sinal).
- Persistência durável do contador (em memória nesta rodada).
- Mudanças no grafo LangGraph ou no modelo de estado.

## Decisions

**D1 — Contador em memória no processo da API.**
O contador de "ambíguo demais para keyword" vive em memória no escopo do app FastAPI (variável de módulo/closure). Simples e suficiente para o gatilho qualitativo inicial. Alternativas consideradas: persistir em JSON (como a `heuristica.json`) — rejeitada por adicionar estado durável sem necessidade imediata; persistir no checkpointer — rejeitada por depender de infra. Reinicia a cada restart, aceito e documentado.

**D2 — Novo endpoint `POST /auditoria/ambigua`.**
Endpoint que recebe `thread_id` (opcional) e incrementa o contador, retornando o novo valor. Não altera a `heuristica.json`. A leitura do contador é exposta via `GET /auditoria/ambigua` (ou incluída no `GET /auditoria`). Alternativa considerada: reutilizar `POST /auditoria/heuristica` com um flag — rejeitada por misturar dois conceitos distintos (correção de heurística vs sinal qualitativo).

**D3 — Segundo motivo de discordância na UI.**
A tela Audit ganha, além de "Manteria"/"Discordo", um botão/ação "Ambíguo demais para keyword" por classificação, que chama o novo endpoint. O contador é exibido em um card/métrica. Rótulos claros distinguem os dois motivos de discordância.

## Risks / Trade-offs

- [Contador reinicia a cada restart] → Aceito para o gatilho qualitativo inicial; evolução futura pode persistir no checkpointer/JSON.
- [Dois motivos de discordância confundem] → Mitigado por rótulos claros na UI ("Faltou palavra-chave" vs "Ambíguo demais para keyword").
