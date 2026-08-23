# Campos estruturados na criação de demanda (título, origem_subtipo, prioridade)

## Status

Accepted

## Context

A criação de demanda no console do FDE capturava apenas `origem` (cliente/regulatório/estratégia/SRE) e `texto` (descrição). Isso deixava lacunas na triagem e no contexto de negócio:

- **Sem título** — a demanda só tinha o texto longo; no board ela aparecia truncada, dificultando a triagem visual.
- **`origem_subtipo` pendente** — a rodada de definição da oferta (§5.3) levantou que Estratégia deveria ter subtipo (nova funcionalidade/melhoria), com decisão pendente sobre modelar como campo adicional vs. nova origem. O CONTEXT.md já definia `origem_subtipo` como atributo opcional e genérico (não exclusivo de Estratégia).
- **Prioridade derivada** — o console derivava prioridade da ambiguidade técnica (alta/baja), misturando dois conceitos distintos: urgência de negócio vs. ambiguidade de escopo.

## Decision

1. **`titulo`** — campo capturado na criação, **obrigatório** no console (botão de envio desabilitado sem título). Aparece como título no board.

2. **`origem_subtipo` como campo adicional** — fecha a pendência Q1: subtipo é um campo (`origem_subtipo`) no `BoardState`, **não** uma nova origem. Preserva as 4 origens canônicas do glossário. Subtipos fechados por origem (presets no frontend):
   - Cliente: `pedido`, `incidente`
   - Regulatório: `norma`, `instrucao_normativa`
   - Estratégia: `nova_funcionalidade`, `melhoria`
   - SRE: `bug`, `performance`
   No console, o subtipo é **obrigatório** e default é o primeiro da origem selecionada (origem default = **regulatório**).

3. **`prioridade` de negócio** — campo capturado (alta/média/baixa, default **média**), independente da ambiguidade técnica. Expressa urgência percebida por quem cria a demanda. No detalhe, a UI mostra o campo capturado com fallback para a derivação por ambiguidade quando ausente.

4. **Subtipo não influencia a heurística de classificação** — nesta rodada, `origem_subtipo` não alimenta `classificar_dominio`/`classificar_ambiguidade`. Mantém a triagem determinística e simples; calibração futura pode incorporá-lo.

## Consequences

- `BoardState` ganha `titulo`, `origem_subtipo`, `prioridade`; `IntakeBody` e `POST /intake` repassam os campos; `_resumo`/`_detalhe` os expõem.
- O modal "Nova demanda" (Dialog central redimensionável) ganha os campos Título, Origem (segmented control), Subtipo (cards de progressive disclosure) e Prioridade (cards destacados). **Todos os campos são obrigatórios no console.**
- O board exibe `titulo` como título do card (fallback para o texto); o detalhe mostra Título, Subtipo e Prioridade no painel de metadados.
- Na API, os campos continuam opcionais (defaults: `prioridade=media`, demais `None`) — retrocompatível para chamadas programáticas; a obrigatoriedade é enforced no console.
- `origem_subtipo` fica pronto para alimentar a heurística de triagem numa rodada futura, sem mudança de contrato.
