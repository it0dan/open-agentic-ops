# Feature Intake Brief — hitl-notifier-wire

## 1. Feature name

`hitl-notifier-wire`

## 2. Business context

O HITL gate (ADR-0005/0009) pausa o fluxo via `interrupt()` nativo do LangGraph até o FDE aprovar/rejeitar via `POST /resume`. O desenho prevê que o FDE seja **notificado** (push) quando há algo aguardando ação — hoje o `NotificationPort.notify` existe como porta, mas **nunca é chamado**: `api/main.py:107` cria `make_resume_handler()` sem `notifier`, então o parâmetro fica `None` e o callback de notificação é silencioso.

Isso significa que, na prática, o FDE só descobre que há uma demanda aguardando HITL quando consulta o board (polling ~4s). O canal de notificação (push) previsto na arquitetura não está wireado — um gap estrutural entre o desenho (ADR-0005/0009) e o runtime.

## 3. User / persona

- FDE (Forward Deployed Engineer) — recebe a notificação de que há uma demanda aguardando sua decisão.
- Liderança técnica — audita que o canal de notificação do HITL está de fato conectado ao runtime.

## 4. Problem statement

`make_resume_handler()` é chamado sem `notifier` em `api/main.py:107`, então `NotificationPort.notify` nunca é invocado. O canal de push previsto no ADR-0005/0009 existe só como porta morta — o FDE depende exclusivamente de polling para saber que precisa agir.

## 5. Feature intention

Wirear um `notifier` concreto (log estruturado) no `make_resume_handler` dentro do `create_app`, de modo que `NotificationPort.notify` passe a ser chamado quando o FDE retoma uma demanda via `POST /resume`. O log estruturado serve como canal de notificação mínimo na Camada 1; Redis/SSE real fica para Camada 2.

## 6. Expected user journey

```txt
Demanda chega ao HITL gate (interrupt)
→ FDE chama POST /resume com a decisão
→ make_resume_handler invoca notifier(thread_id, {status: resumed, decision})
→ notifier concreto emite log estruturado (sem PII raw)
→ Command(resume=...) injeta a decisão no grafo
```

## 7. In scope

- [ ] Definir um `notifier` concreto (log estruturado) no `create_app` (`api/main.py`).
- [ ] Passar esse `notifier` ao `make_resume_handler(...)`.
- [ ] Garantir que o payload do `notify` não contenha PII raw (sanitização na fronteira).
- [ ] Teste: `POST /resume` dispara o `notifier` (payload `{status: resumed, decision}`).

## 8. Out of scope

- [ ] Redis/SSE real (push) — Camada 2, depende de infra.
- [ ] Notificação no momento em que a demanda **entra** no HITL (só no resume nesta rodada).
- [ ] Mudanças no grafo, gates, frontend ou outros nós.
- [ ] Multi-tenancy (ADR-0015).

## 9. Inputs

- `api/main.py` — `create_app` (onde `make_resume_handler()` é chamado).
- `src/open_agentic_ops/gates/hitl_gate.py` — `make_resume_handler(notifier=...)`.
- `src/open_agentic_ops/ports/__init__.py` — `NotificationPort` (referência).

## 10. Outputs

- `api/main.py` com `notifier` concreto wireado no `make_resume_handler`.
- Log estruturado emitido no resume (sem PII raw).
- Teste novo em `tests/test_api.py` (notifier disparado no resume).

## 11. Existing assets to reuse

- `src/open_agentic_ops/gates/hitl_gate.py` — `make_resume_handler(notifier=...)` (assinatura já existe).
- `src/open_agentic_ops/ports/__init__.py` — `NotificationPort` (protocolo).
- `src/open_agentic_ops/observability/__init__.py` — `sanitize_for_telemetry` (sanitização de payload).
- `tests/test_api.py` — padrão de testes da API (fixture `client`).

## 12. Constraints

- Stack tudo-Python (LangGraph + LangSmith).
- Hexagonal leve só nas bordas.
- PII mascarada na fronteira de entrada (LGPD/FAPI-BR) — payload do notifier sem PII raw.
- Gates HITL e Eval obrigatórios.
- Checkpointer = board.
- Camada 1 (harness + testes) — log estruturado como notifier mínimo, sem infra real.

## 13. Acceptance criteria

- [ ] `create_app` passa um `notifier` concreto ao `make_resume_handler`.
- [ ] `POST /resume` (caminho HITL) dispara o `notifier` com `{status: "resumed", decision: {...}}`.
- [ ] Payload do notifier não contém PII raw.
- [ ] `poetry run pytest` verde; `poetry run ruff check .` limpo.

## 14. Risks and ambiguities

- O `notifier` é chamado tanto no caminho HITL quanto no de autoria de spec (ambos usam `resume`). Verificar se o teste cobre o caminho HITL especificamente.
- Log estruturado pode vazar PII se o payload do `decision` contiver dados sensíveis — sanitizar antes de logar.
- Não quebrar os testes existentes de `POST /resume` (aprova/rejeita/aprova com ressalvas).

## 15. Recommended implementation boundaries

- Não adicionar UI nova.
- Não adicionar HTTP API pública nova.
- Não adicionar banco de dados separado (checkpointer é o board).
- Não usar dados reais de cliente.
- Não criar QA Agent separado.
- Não implementar Redis/SSE real nesta rodada.

## 16. Suggested OpenSpec change name

`hitl-notifier-wire`

## 17. Suggested safe analysis prompt

```txt
Você está trabalhando no repositório Sensedia Open Agentic Ops.

Antes de criar um novo OpenSpec change, analise a feature proposta com segurança.

Importante:
Não crie, edite, delete ou mova arquivos.
Não rode /opsx:propose.
Não implemente código.
Apenas inspecione o repositório e retorne uma análise.

Leia primeiro:
- AGENTS.md
- PROJECT.md
- HANDOFF.md
- README.md
- openspec/project.md
- openspec/specs/*
- docs/adr/*
- docs/sdd/feature-intakes/hitl-notifier-wire.md
- prompts/
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/hitl-notifier-wire.md

Retorne apenas:

1. Entendimento da feature proposta
2. Capacidades atuais do repositório que já suportam esta feature
3. Arquivos existentes relevantes
4. Gaps a serem endereçados
5. Riscos e ambiguidades
6. Estrutura sugerida do OpenSpec change
7. Ajustes de escopo sugeridos, se houver
8. Critérios de aceite sugeridos
9. Breakdown de tasks sugerido
10. Recomendação: se é seguro rodar /opsx:propose em seguida

Não modifique arquivos.
```

## 18. Suggested OpenSpec propose prompt

```txt
/opsx:propose hitl-notifier-wire

Use o briefing de:
docs/sdd/feature-intakes/hitl-notifier-wire.md

Crie um novo OpenSpec change para esta feature.

Regras:
- Crie proposal.md, design.md, specs e tasks.md.
- Não implemente código.
- Não mude arquivos de origem.
- Não adicione funcionalidade fora do briefing.
- Respeite AGENTS.md, PROJECT.md e docs/adr/.
- Mantenha escopo alinhado ao feature intake.
- Pare após criar os artefatos OpenSpec.

Após criar o change, resuma:
1. arquivos criados;
2. escopo proposto;
3. premissas;
4. riscos;
5. questões em aberto;
6. próxima ação recomendada.
```
