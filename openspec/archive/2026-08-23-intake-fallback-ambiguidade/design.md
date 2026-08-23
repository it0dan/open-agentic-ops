## Context

O Intake Agent classifica `dominio` e `ambiguidade` de cada demanda via heurística determinística (`classificar_dominio` / `classificar_ambiguidade` em `src/open_agentic_ops/nodes/intake.py`), sobre o texto já sanitizado de PII. A classificação de ambiguidade decide o roteamento: `baixa` → Intake rascunha a spec; `alta` → escala ao FDE.

Estado atual: `classificar_ambiguidade` retorna `("baixa", [])` quando nenhuma keyword de `alta_ambiguidade` é reconhecida. Isso empurra demandas desconhecidas para o caminho de menos supervisão humana — o oposto do fail-safe desejado em domínio regulado.

A decisão de inverter o fallback foi fechada na seção 6 do documento de definições (`Inicio/definicoes/open-agentic-ops-definicao-oferta (3).md`). Esta feature implementa apenas essa decisão (decisão 1); as decisões 2 (similaridade semântica), 3 (PII conta/agência/Pix) e 4 (novo motivo de discordância na Audit) ficam para rodadas futuras.

## Goals / Non-Goals

**Goals:**
- Inverter o fallback de `classificar_ambiguidade`: sem hit de `alta_ambiguidade` → `("alta", [])`.
- Preservar a distinção auditável entre "escalado por keyword real" (justificativa preenchida) e "escalado por ausência de reconhecimento" (justificativa vazia).
- Manter o cenário de baixa ambiguidade coberto por testes.
- Mudança mínima, sem alterar assinaturas nem o contrato do nó do grafo.

**Non-Goals:**
- Similaridade semântica via pgvector (decisão 2) — depende de infra.
- Cobertura de PII de conta/agência/chave Pix (decisão 3).
- Novo motivo de discordância na Audit (decisão 4).
- Indicador visual na tela Audit para justificativa vazia.
- Evolução da heurística para LLM.

## Decisions

**D1 — Inverter o fallback em `classificar_ambiguidade`.**
Trocar `return "baixa", []` por `return "alta", []` no caminho sem hit. Alternativa considerada: manter `baixa` e adicionar um terceiro estado de ambiguidade — rejeitada por aumentar a superfície de tipos e por contradizer a decisão fechada. A justificativa vazia já diferencia os dois motivos de escalada sem precisar de novo estado no tipo `Ambiguidade`.

**D2 — Preservar o caminho de baixa via keyword de `baixa_ambiguidade`.**
Com o fallback invertido, `classificar_ambiguidade` passaria a retornar `alta` para todo texto sem keyword de alta, eliminando o caminho de baixa (`spec_autor=intake`). Para não remover o cenário de baixa, adiciona-se um conjunto `baixa_ambiguidade` de keywords (ex.: "dashboard", "botao", "tela", "formulario", "melhoria", "bug"). Precedência: keyword de alta → `alta`; senão keyword de baixa → `baixa`; senão → `alta` (fallback). Assim, demandas claramente simples continuam sendo rascunhadas pelo Intake, e apenas o que a heurística não reconhece escala ao FDE. Alternativa inicial considerada (adicionar keyword de alta aos testes de baixa) foi rejeitada por ser auto-contraditória: adicionar keyword de alta torna o texto `alta`, não `baixa`.

**D3 — Adicionar teste novo específico do fallback invertido.**
Um teste que passa texto sem keyword de alta nem de baixa e verifica `("alta", [])`, garantindo que o fallback invertido fica coberto de forma explícita e não apenas implícita nos testes de fluxo.

## Risks / Trade-offs

- [Sobrecarga do FDE] → Mais demandas escalam ao FDE. Aceito pela decisão fechada (segurança > throughput); mitigado pela justificativa vazia que permite à Audit distinguir o motivo.
- [Justificativa vazia confunde na Audit] → A tela Audit mostra chips vazios. Não é bug; indicador visual fica como evolução futura (non-goal).
- [Regressão silenciosa do caminho de baixa] → Mitigado por D2 (testes de baixa preservados) e D3 (teste do fallback).
