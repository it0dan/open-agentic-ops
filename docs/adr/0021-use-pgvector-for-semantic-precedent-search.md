# Usar pgvector + Sentence-Transformers local para busca de precedentes

## Status

Accepted

## Context

A detecção de precedente no Intake dependia de uma keyword literal ("sem precedente") que quase nunca aparece no texto real de uma demanda. O Intake não aproveitava o histórico de demandas já resolvidas (status terminal) para inferir precedente por similaridade, escalando ao FDE demandas genuinamente repetitivas.

A decisão 2 da seção 6 do documento de definições foi fechada: substituir a keyword literal por busca por similaridade semântica. A stack é toda opensource, exceto a LLM (GPT/Claude/etc.) que usa o AI Gateway da Sensedia. Embeddings são modelos dedicados (não LLMs generativas), então devem ser opensource locais.

## Decision

- **Store de vetores**: extensão `vector` (pgvector) no Postgres que já é o checkpointer (ADR-0002), sem banco separado. Imagem `pgvector/pgvector:pg16` no docker-compose.
- **Embeddings**: Sentence-Transformers local (modelo multilíngue `paraphrase-multilingual-MiniLM-L12-v2`), lazy-load no processo. A LLM via AI Gateway NÃO é usada para embeddings.
- **Busca**: `buscar_precedentes` retorna as N demandas mais similares da mesma `origem`+`dominio` com status terminal (`monitorado`/`deployado`), acima do threshold de similaridade.
- **Influência na classificação**: precedente acima do threshold reforça a baixa; ausência cai no fallback de alta (decisão 1 preservada). A keyword literal "sem precedente" permanece como sinal explícito adicional.
- **Justificativa**: `classificacao_intake.justificativa` referencia o `thread_id` do precedente encontrado.
- **Registro**: demandas que atingem status terminal registram seu embedding/metadados na tabela `precedentes` (via nó SRE), alimentando buscas futuras.
- **Configuração**: `SIMILARIDADE_THRESHOLD` (default 0.75) e `SIMILARIDADE_N` (default 5) via env.
- **Degradação graciosa**: se o Postgres/pgvector estiver indisponível, a busca retorna vazio e o Intake mantém o comportamento determinístico atual.

## Consequences

- Menos falsos positivos de alta ambiguidade quando há precedente claro; demandas repetitivas fluem mais rápido.
- A tabela `precedentes` é um índice de similaridade derivado, não a fonte de verdade de demanda (não conflita com ADR-0002).
- `sentence-transformers` adiciona dependências pesadas (torch/transformers); mitigado com lazy-load e modelo leve.
- Threshold/N são defaults razoáveis; calibração fina requer dados reais (pendência documentada).
- Multi-tenancy (ADR-0015) fora de escopo nesta rodada — tabela de precedentes global, desenhada para aceitar filtro por tenant depois.
