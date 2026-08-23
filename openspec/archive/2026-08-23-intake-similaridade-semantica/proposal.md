## Why

A detecção de precedente no Intake depende de uma keyword literal ("sem precedente") que quase nunca aparece no texto real de uma demanda. O Intake não aproveita o histórico de demandas já resolvidas (status terminal) para inferir precedente por similaridade, escalando ao FDE demandas genuinamente repetitivas e aumentando carga humana e latência.

## What Changes

- Substituir a keyword literal "sem precedente" como mecanismo principal de detecção de precedente por **busca por similaridade semântica** contra o histórico de demandas já resolvidas.
- Adicionar infra opensource: `docker-compose.yml` com Postgres + pgvector (`pgvector/pgvector:pg16`).
- Adicionar módulo de embeddings com **Sentence-Transformers local** (modelo multilíngue, opensource) — a LLM via AI Gateway permanece só para geração de texto, não para embeddings.
- Adicionar camada de similaridade com conector pgvector (mesma `DATABASE_URL` do checkpointer, ADR-0002).
- Adicionar migração SQL: extensão `vector` + tabela de precedentes (thread_id, origem, dominio, texto_sanitizado, embedding, status_terminal).
- Integrar no Intake: gerar embedding do texto sanitizado (pós-PII), buscar precedentes da mesma `origem`+`dominio` com status terminal, reforçar/negar baixa conforme threshold, registrar precedente da demanda atual.
- Tornar `SIMILARIDADE_THRESHOLD` e `SIMILARIDADE_N` configuráveis (não hardcoded).
- Adicionar degradação graciosa quando Postgres/pgvector indisponível (mantém comportamento atual).
- Referenciar o `thread_id` do precedente na `classificacao_intake.justificativa`.

## Capabilities

### New Capabilities
- `intake-similaridade-semantica`: busca por similaridade semântica de precedentes no Intake, usando pgvector + Sentence-Transformers local, para reforçar/negar a classificação de ambiguidade.

### Modified Capabilities
<!-- Nenhuma spec ativa existente é modificada; a decisão 2 é uma nova capacidade backend. -->

## Impact

- **Código**: `src/open_agentic_ops/nodes/intake_node.py` (integração), `src/open_agentic_ops/nodes/intake.py` (heurística), novos módulos `embeddings/` e `similaridade/`, `src/open_agentic_ops/graph/__init__.py` (DI da busca de precedentes).
- **Dependências**: `sentence-transformers` (torch/transformers), `pgvector`, driver Postgres (`psycopg`), extra `langgraph-checkpoint-postgres`.
- **Infra**: novo `docker-compose.yml` (Postgres + pgvector); `DATABASE_URL` e `SIMILARIDADE_THRESHOLD`/`SIMILARIDADE_N` no `.env.example`.
- **Estado**: `classificacao_intake.justificativa` passa a referenciar `thread_id` do precedente (campo já serializado na API, sem novo endpoint).
- **Testes**: novos unit (embeddings, similaridade, integração no intake) + regressão das decisões 1/3/4.

## Non-goals

- Não usar a LLM/AI Gateway para gerar embeddings (embeddings são opensource locais).
- Não adicionar banco de dados separado (pgvector estende o Postgres do checkpointer).
- Não adicionar UI/frontend (decisão 2 é backend).
- Não implementar multi-tenancy (ADR-0015) nesta rodada — tabela de precedentes global.
- Não calibrar finamente threshold/N com dados reais (valores iniciais são defaults razoáveis).
- Não evoluir a heurística para LLM (decisão 4) — independe desta feature.
