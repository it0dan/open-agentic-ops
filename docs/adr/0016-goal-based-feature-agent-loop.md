# Loop goal-based do Feature Agent (Loop Engineering)

## Status

Accepted

## Context

O Feature Agent (`feature_node.py`) hoje chama `LLMProviderPort.invoke()` **uma única vez** e marca o worktree como `implementado`. Não há iteração: não edita arquivo, roda teste, lê o resultado, corrige e tenta de novo. Isso é Graph Engineering (topologia inter-agente) **sem** Loop Engineering (comportamento intra-agente) — exatamente a distinção que o `CONTEXT.md` registra entre os dois conceitos, mas só o primeiro está implementado.

O `Guia` (`guia.py`) só carrega `system_prompt` (sem campo de ferramentas, sem checklist). Test/lint rodam como nó separado (`platform_node.py`), não como ferramenta in-loop. `LLMProviderPort.invoke()` é síncrona de chamada única; `ToolExecutionPort.call_tool()` é async (usado pelo Platform).

## Decision

Transformar o Feature Agent em **goal-based loop** (taxonomia de loop engineering da Anthropic), não turn-based. Turn-based (o que existe hoje — uma chamada, o próprio LLM julga se terminou) é insuficiente para um sistema onde "terminei" precisa ser **verificável** antes de chegar ao HITL, não decidido por autoavaliação do modelo.

Desenho fechado:

- **Goal explícito e determinístico:** spec implementada + testes passando + lint limpo. Não é o LLM que decide se está bom — é o resultado de test/lint que decide.
- **Ferramentas dentro do loop:** edição de arquivo/git (sempre disponíveis) + test/lint do Platform migram para dentro do loop como ferramenta chamada pelo Feature Agent, não mais nó separado que só roda depois. Deploy/observabilidade continuam como nó de grafo pós-fan-in.
- **Teto de iterações:** guardrail explícito contra loop infinito. Cada tentativa que falha volta ao Feature Agent com o resultado de test/lint como contexto novo.
- **PII como hook determinístico:** reusa o módulo `pii.py` (mesmo do Intake) como verificação determinística sobre qualquer saída do loop, antes de virar estado — não instrução de prompt.
- **Guia ganha segunda função:** além de instrução de implementação (feedforward), carrega um checklist de verificação por domínio (o que checar antes de declarar pronto) e um campo estruturado de ferramentas disponíveis.

### Escopo (decisão de implementação)

Dividido em **duas camadas**:
1. **Harness do loop** (estrutura goal-based, teto de iterações, PII como hook, contexto de retorno de test/lint) — implementável agora com as portas existentes, testável com stubs.
2. **Integração real** (LLM Sensedia AI Gateway + ferramentas MCP git/test) — depende de infraestrutura provisionada.

O loop começa pelo **mínimo verificável** (goal = test/lint passando). Os checklists ricos por domínio (frontend: dev server, interação de browser, screenshot, console, Lighthouse/CWV; backend: schema do Manual de APIs, teste de contrato, integração, scan PII na resposta) entram como evolução posterior, quando as ferramentas existirem.

## Consequences

- O Feature Agent passa a iterar de forma verificável — o achado central da definição da oferta.
- PII deixa de ser "frase de prompt" e vira garantia determinística sobre toda saída do loop.
- O `Guia` deixa de ser só texto e passa a carregar ferramentas + checklist por domínio.
- Roteamento de test/lint passa a ser explícito por `dominio` (não inferido por nome de branch).
- Depende de infraestrutura real (LLM + ferramentas) para a camada 2; a camada 1 (harness) é testável com stubs.
- Desbloqueia o Architecture dinâmico (subagent durante o loop) e o contexto real do Review.
