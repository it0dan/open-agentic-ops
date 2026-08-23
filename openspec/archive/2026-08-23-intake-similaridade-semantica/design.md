## Context

O Intake Agent classifica a ambiguidade de cada demanda por palavras-chave literais (`classificar_ambiguidade` em `src/open_agentic_ops/nodes/intake.py`). Uma dessas keywords é "sem precedente" (em `alta_ambiguidade`), sinal explícito de que a demanda não tem histórico resolvido. Porém, a maioria das demandas novas não escreve "sem precedente", e o Intake não aproveita o histórico de demandas já resolvidas (status terminal `monitorado`/`deployado`) para inferir precedente por similaridade.

A decisão 2 da seção 6 do documento de definições foi fechada: substituir a keyword literal por **busca por similaridade semântica** via pgvector no Postgres que já é o checkpointer (ADR-0002). A stack é **toda opensource**, exceto a LLM (GPT/Claude/etc.) que usa o AI Gateway da Sensedia. Embeddings são modelos dedicados (não LLMs generativas) → **opensource locais** (Sentence-Transformers).

Estado atual relevante:
- `intake_node` é função pura sem DI (registrado direto no grafo em `graph/__init__.py:144`).
- Não há camada de conexão Postgres reutilizável — `PostgresSaver` encapsula a própria conexão.
- Não há `docker-compose.yml`, nem `sentence-transformers`/`pgvector`/`psycopg` declarados.
- Não há módulo central de config; o padrão é `os.environ.get` (ex.: `observability/__init__.py`).
- Campo de domínio no estado é `domino` (typo) — a busca deve respeitar esse nome.
- Multi-tenancy (ADR-0015) fora de escopo — tabela de precedentes global.

## Goals / Non-Goals

**Goals:**
- Detectar precedente por similaridade semântica contra demandas já resolvidas (status terminal) da mesma `origem`+`dominio`.
- Reforçar a classificação de baixa ambiguidade quando há precedente similar acima do threshold; caso contrário, cair no fallback de alta (decisão 1 preservada).
- Manter a keyword literal "sem precedente" como sinal explícito adicional.
- Referenciar o `thread_id` do precedente na `classificacao_intake.justificativa`.
- Stack opensource para embeddings (Sentence-Transformers local); LLM via AI Gateway só para texto.
- Degradação graciosa quando Postgres/pgvector indisponível.
- `SIMILARIDADE_THRESHOLD` e `SIMILARIDADE_N` configuráveis.

**Non-Goals:**
- Não usar a LLM/AI Gateway para embeddings.
- Não adicionar banco separado (pgvector estende o Postgres do checkpointer).
- Não adicionar UI/frontend.
- Não implementar multi-tenancy.
- Não calibrar finamente threshold/N com dados reais.

## Decisions

### D1. Embeddings: Sentence-Transformers local (opensource)
- **Escolha**: biblioteca `sentence-transformers` com modelo multilíngue leve (`paraphrase-multilingual-MiniLM-L12-v2`), lazy-load no processo.
- **Por quê**: multilíngue (essencial para pt-BR), roda local (privacidade total, dados não saem do ambiente), sem serviço externo, opensource.
- **Alternativas consideradas**: Ollama local (requer serviço separado); embeddings via AI Gateway (contraria a restrição opensource). Rejeitadas.
- **Trade-off**: `sentence-transformers` traz `torch`/`transformers` (pesado). Mitigado com lazy-load (só carrega quando usado) e modelo leve.

### D2. Store de vetores: pgvector no Postgres do checkpointer
- **Escolha**: extensão `vector` do Postgres, mesma `DATABASE_URL` do checkpointer (ADR-0002). Imagem `pgvector/pgvector:pg16` no docker-compose.
- **Por quê**: sem banco separado (coerente com ADR-0002), opensource, busca por similaridade nativa (`<=>` cosine distance).
- **Alternativas consideradas**: Qdrant/Weaviate (serviços separados, mais infra); FAISS em memória (não persiste). Rejeitadas por violarem "sem banco separado" ou "persistência".

### D3. Conector próprio para pgvector
- **Escolha**: criar conector próprio (SQLAlchemy ou psycopg) que compartilha `DATABASE_URL`, pois `PostgresSaver` não expõe a conexão subjacente.
- **Por quê**: necessário para executar SQL de criação de tabela e busca por similaridade independente do checkpointer.
- **Decisão**: usar `psycopg` (driver Postgres opensource) com SQL direto — mínimo acoplamento, sem ORM para uma tabela auxiliar simples.

### D4. DI da busca de precedentes no Intake
- **Escolha**: transformar `intake_node` em factory `make_intake_node(buscar_precedentes=...)` (padrão `make_*_node` já usado no grafo), permitindo mock nos testes.
- **Por quê**: `intake_node` é função pura hoje; a busca de precedentes é uma dependência externa (DB) que precisa ser injetável para testes determinísticos.
- **Alternativa**: adicionar kwarg a `build_graph`. Rejeitada por acoplar o grafo à busca; factory é mais alinhado ao padrão existente.

### D5. Configuração via env
- **Escolha**: `SIMILARIDADE_THRESHOLD` (default 0.75) e `SIMILARIDADE_N` (default 5) lidos via `os.environ.get`, seguindo o padrão de `observability/__init__.py`.
- **Por quê**: sem módulo central de config; mudança mínima e alinhada ao padrão existente.

### D6. Degradação graciosa
- **Escolha**: se Postgres/pgvector indisponível (ex.: CI sem docker), a busca de precedentes retorna vazio e o Intake mantém o comportamento atual (keyword + fallback).
- **Por quê**: não quebrar o pipeline quando a infra de similaridade não está disponível.

### D7. Tabela de precedentes
- **Escolha**: tabela `precedentes` com colunas `thread_id`, `origem`, `dominio`, `texto_sanitizado`, `embedding` (vector), `status_terminal`, `created_at`. Global (sem `tenant_id`) nesta rodada.
- **Por quê**: índice de similaridade derivado, não fonte de verdade de demanda (não conflita com ADR-0002). Desenhada para aceitar filtro por tenant depois.

## Risks / Trade-offs

- **[Peso de torch/transformers]** → lazy-load do modelo; modelo leve; documentar download na primeira execução.
- **[Calibração de threshold/N]** → defaults razoáveis (0.75 / 5); calibração fina documentada como pendência com dados reais.
- **[Degradação sem infra]** → busca retorna vazio e mantém comportamento atual; testes cobrem o fallback.
- **[Privacidade]** → embeddings gerados de texto sanitizado (pós-PII); modelo roda local.
- **[Consistência do índice]** → precedentes são registrados conforme demandas atingem status terminal; índice pode estar defasado até lá (aceito).
