# Eval gate em duas camadas LangSmith (online + offline)

## Status

Accepted

## Context

O ADR-0013 falava em "portar `run_all_evals.sh`" — um runner PromptFoo via CLI, padrão de suíte de regressão batch. Mas LangSmith em 2026 tem duas modalidades distintas: **offline evaluation** (roda contra um `Dataset` curado, gera um `Experiment` — suíte de regressão, desacoplada de uma transação específica) e **online evaluation** (avalia o trace de uma execução real, em tempo real). O `eval_gate.py` atual é assinado como `_run_evals(spec: str)`, chamado uma vez por demanda dentro do grafo — estruturalmente o padrão **online**, não o offline que `run_all_evals.sh` implementava. Portar 1:1 não fecha.

Hoje `eval_gate.py` é noop total (`_run_evals` sempre retorna `{"aprovado": True, "detalhes": "eval noop: aprovado"}`). `evals/__init__.py` está vazio (greenfield). `observability/__init__.py` só configura tracing LangSmith, sem avaliação.

## Decision

Duas camadas separadas, não uma:

1. **Eval gate real (dentro do grafo, por demanda)** — evaluator **online** do LangSmith: LLM-as-judge aplicado ao trace da execução que o LangSmith já captura (via tracing já configurado em `observability/__init__.py`), pontuando três categorias:
   - **Trajectory** — a classificação de ambiguidade fez sentido, Architecture foi acionado quando devia, o roteamento do grafo foi coerente com a spec.
   - **Segurança/PII** — reaproveita `pii.py`; nenhum dado raw vazou nas fronteiras.
   - **Compliance regulatório** — quando `origem=regulatorio`, o ADR/spec resultante reflete corretamente a norma de origem.

   Roda via `aevaluate()` (assíncrono — consistente com o `asyncio.run()` que `platform_node.py` já usa), não `evaluate()` síncrono.

2. **Suíte de regressão (fora do grafo, CI, gate de deploy do código da squad)** — herdeira direta do `run_all_evals.sh`, via SDK LangSmith em vez de CLI PromptFoo: um `Dataset` com golden trajectories, versionado, rodado em CI antes de qualquer deploy de mudança nos agentes. O caso-âncora que já existe em `test_graph.py` (Instrução Normativa → alta ambiguidade → Architecture acionado → aprovação) é candidato natural a virar o primeiro exemplo desse dataset — migra de assert Python solto para exemplo curado formal via `client.create_dataset`/`client.create_examples`.

### Escopo (decisão de implementação)

O Eval gate real depende de LangSmith + LLM-as-judge provisionados (mesma infra do loop do Feature, ADR-0016 camada 2). Implementa-se **agora** apenas o **esqueleto**: a estrutura das duas camadas em `evals/` (módulo online + módulo offline) e o caso-âncora migrado para o formato de golden trajectory — sem rodar de fato.

## Consequences

- O Eval gate deixa de ser noop quando a infra existir.
- Duas camadas com propósitos distintos: online (por demanda, dentro do grafo) e offline (regressão, CI).
- O ADR-0013 é **superado** na parte de "portar `run_all_evals.sh` via CLI PromptFoo" — a herança vira a camada offline via SDK LangSmith.
- `[DECISÃO PENDENTE]` — critério de pontuação/threshold do LLM-as-judge por categoria e quantos golden trajectories compõem o dataset inicial além do caso-âncora — calibrar com casos reais.
