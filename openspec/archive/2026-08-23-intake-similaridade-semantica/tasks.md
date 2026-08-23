## 1. Infra opensource

- [x] 1.1 Criar `docker-compose.yml` com serviço Postgres + pgvector (`pgvector/pgvector:pg16`), volume persistente, porta 5432 e healthcheck
- [x] 1.2 Adicionar `DATABASE_URL`, `SIMILARIDADE_THRESHOLD` e `SIMILARIDADE_N` ao `.env.example`

## 2. Dependências

- [x] 2.1 Adicionar `sentence-transformers`, `pgvector` e `psycopg` ao `pyproject.toml` (Poetry)
- [x] 2.2 Resolver o extra `langgraph-checkpoint-postgres` para o checkpointer de produção

## 3. Módulo de embeddings

- [x] 3.1 Criar `src/open_agentic_ops/embeddings/__init__.py` com lazy-load do SentenceTransformer (modelo multilíngue leve)
- [x] 3.2 Implementar `gerar_embedding(texto) -> list[float]`

## 4. Camada de similaridade (pgvector)

- [x] 4.1 Criar conector pgvector compartilhando `DATABASE_URL` (psycopg)
- [x] 4.2 Criar migração SQL: extensão `vector` + tabela `precedentes` (thread_id, origem, dominio, texto_sanitizado, embedding, status_terminal, created_at)
- [x] 4.3 Implementar `buscar_precedentes(texto, origem, dominio, n, threshold) -> list[(thread_id, score)]`
- [x] 4.4 Implementar `registrar_precedente(...)` para demandas em status terminal
- [x] 4.5 Implementar degradação graciosa quando Postgres/pgvector indisponível

## 5. Integração no Intake

- [x] 5.1 Transformar `intake_node` em factory `make_intake_node(buscar_precedentes=...)` (padrão `make_*_node`)
- [x] 5.2 Gerar embedding do texto sanitizado e buscar precedentes da mesma `origem`+`dominio`
- [x] 5.3 Reforçar baixa quando precedente acima do threshold; fallback de alta quando ausente (decisão 1 preservada)
- [x] 5.4 Referenciar `thread_id` do precedente na `classificacao_intake.justificativa`
- [x] 5.5 Registrar precedente da demanda atual quando atingir status terminal
- [x] 5.6 Ler `SIMILARIDADE_THRESHOLD` e `SIMILARIDADE_N` via `os.environ.get` com defaults

## 6. Testes

- [x] 6.1 Testes unit do módulo de embeddings (mock do modelo)
- [x] 6.2 Testes da camada de similaridade (mock do conector)
- [x] 6.3 Testes de integração no intake (mock da busca de precedentes)
- [x] 6.4 Testes de regressão das decisões 1/3/4 continuam passando
- [x] 6.5 `poetry run pytest` verde, `poetry run ruff check .` limpo
- [x] 6.6 `npm run lint`, `npm run build`, `npm test` no frontend verdes

## 7. ADR e arquivamento

- [x] 7.1 Criar `docs/adr/0021-use-pgvector-for-semantic-precedent-search.md`
- [x] 7.2 Arquivar change em `openspec/archive/2026-08-23-intake-similaridade-semantica/`
- [x] 7.3 Atualizar `HANDOFF.md`
