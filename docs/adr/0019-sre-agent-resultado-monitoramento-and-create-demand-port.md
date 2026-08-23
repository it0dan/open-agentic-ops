# SRE Agent real: ResultadoMonitoramento estruturado + port criar_demanda

## Status

Accepted

## Context

O `sre_node.py` atual é um threshold puro: `_monitorar()` é hardcoded pra sempre devolver saúde OK (`{"slo_ok": True, "error_budget": 0.05}`) e `task_gerada = not metricas.get("slo_ok", True)`. Isso contradiz a decisão de "disparo por julgamento do agente" (definição da oferta §5.4) — é checagem de boolean, não julgamento.

O loop de fechamento do ADR-0010 nunca foi implementado: `sre_task_gerada: bool` fica gravado no estado final da execução, mas não existe scheduler/handler/worker que reaja a essa flag e dispare um novo `POST /intake` com `origem="sre"`. É um bool sem consequência.

O SRE está amarrado como último nó de cada execução individual do grafo — checagem síncrona, pontual, logo após aquele item ser "deployado" (canary check daquele item específico), não um monitor contínuo da produção como um todo.

## Decision

1. **Onde o SRE roda — opção 1:** mantém como nó síncrono no fim de cada execução do grafo (canary check pontual pós-deploy daquele item). **Limitação registrada:** esse desenho só cobre regressão que aparece imediatamente após o deploy do item que acabou de passar pelo grafo. Não cobre degradação lenta, error budget se esgotando ao longo de dias, ou problemas em endpoints sem deploy recente — cenário mais comum de SRE real. Decisão consciente de escopo para a Fase 2; lacuna conhecida a revisitar quando o monitoramento contínuo entrar em pauta.

2. **Mecanismo de julgamento — `ResultadoMonitoramento` estruturado:**

```python
class ResultadoMonitoramento(TypedDict):
    task_gerada: bool
    motivo: str                    # sempre presente, mesmo quando task_gerada=False
    descricao_task: str | None     # texto da demanda gerada — vira o `texto` do POST /intake
    metricas_brutas: dict          # anexado para rastreabilidade/auditoria
```

O reasoner (`julgar`) recebe métricas brutas + SLOs definidos por endpoint + histórico/tendência recente (não só o snapshot pontual atual) — julgamento de verdade pesa múltiplos sinais junto, não compara um número contra um threshold isolado. `motivo` é obrigatório mesmo no caminho "não gerar task" — é esse campo que sustenta a auditoria de decisões de não agir. Substitui o `sre_task_gerada: bool` solto por um resultado estruturado.

3. **Quem dispara o `POST /intake` novo — port `criar_demanda`:** como o SRE roda síncrono dentro do próprio grafo, o `sre_node` precisa de um novo port — `criar_demanda: Callable[[str], str] | None` —, análogo ao `ToolExecutionPort`/`LLMProviderPort` já existentes, que internamente chama o mesmo caminho usado por `POST /intake` (gera `thread_id`, invoca o grafo compilado com `origem="sre"` e `texto=descricao_task`). Esse port só pode ser wireado no nível da aplicação (`create_app()` em `api/main.py`), porque é ali que o grafo compilado e o checkpointer já existem.

### Escopo (decisão de implementação)

Implementa-se **agora** a estrutura do `ResultadoMonitoramento` (com o reasoner ainda como fallback determinístico preenchendo `motivo`) e o port `criar_demanda` wireado na API — fechando estruturalmente o loop ADR-0010. O **reasoner real** (julgamento pesando múltiplos sinais + tendência) fica para quando houver dados de observabilidade + LLM (mesma infra do loop do Feature, ADR-0016 camada 2).

## Consequences

- O loop de fechamento ADR-0010 deixa de ser um "bool sem consequência" — o SRE passa a realimentar o Intake estruturalmente.
- Toda checagem (inclusive "não agir") fica registrada via `motivo`, sustentando a auditoria prospectiva da heurística do SRE (deferida com a Audit unificada).
- `[DECISÃO PENDENTE]` — onde `ResultadoMonitoramento` de cada checagem fica persistido para a Audit revisar depois (checagens que não geram task não criam thread novo, então precisam de registro separado, fora do checkpointer do grafo) — fica para quando o schema da Audit for desenhado.
- Limitação de cobertura (só canary pós-deploy) registrada como lacuna conhecida.
