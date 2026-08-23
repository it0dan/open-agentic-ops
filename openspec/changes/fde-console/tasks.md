# Tasks — FDE Console

Decomposição do `spec.md` em tarefas executáveis. Sequência respeita dependências: extensão do runtime → camada de API → console (protótipo mock) → integração → skill de frontend.

## 1. Extensão do runtime Python

- [x] 1.1 Adicionar `fastapi` e `uvicorn` ao `pyproject.toml` (Poetry) e instalar. (Satisfaz D2)
- [x] 1.2 Adicionar campo `classificacao_intake` ao `BoardState` (dominio, ambiguidade, justificativa, timestamp). (Satisfaz D3, RF-8.1)
- [x] 1.3 Fazer o Intake registrar a classificação + justificativa (palavras-chave) no estado. (Satisfaz D3, RF-1.1)
- [x] 1.4 Tornar a heurística do Intake mutável (fonte carregável, ex.: JSON) em vez de constantes hardcoded. (Satisfaz D4, RNF-6)
- [x] 1.5 Corrigir `BoardView.pending()` para listar threads do checkpointer automaticamente (sem cache manual). (Satisfaz RF-8.2)

## 2. Camada de API (FastAPI)

- [x] 2.1 Criar `api/` com app FastAPI e wiring do grafo + checkpointer. (Satisfaz D2)
- [x] 2.2 Implementar `GET /board` (lista demandas). (Satisfaz RF-8.2)
- [x] 2.3 Implementar `GET /board/{thread_id}` (detalhe; 404 se inexistente). (Satisfaz RF-8.2)
- [x] 2.4 Implementar `POST /resume` (aprova/rejeita HITL via `Command(resume=...)`). (Satisfaz RF-5.2, RF-5.3)
- [x] 2.5 Implementar `POST /intake` (injeta nova demanda; valida texto não vazio). (Satisfaz RF-1.1)
- [x] 2.6 Implementar `GET /auditoria` (classificações registradas). (Satisfaz RNF-6)
- [x] 2.7 Implementar `POST /auditoria/heuristica` (adiciona/remove palavra-chave, prospectivo). (Satisfaz RNF-6)
- [x] 2.8 Garantir que a API nunca exponha PII raw (consome estado já mascarado). (Satisfaz RNF-1)

## 3. Console (Next.js) — scaffold e design system

- [x] 3.1 Scaffold `frontend/` com Next.js + TypeScript + Tailwind v4 + next-themes. (Satisfaz D1)
- [x] 3.2 Configurar shadcn/ui (new-york) + Radix. (Satisfaz D1)
- [x] 3.3 Criar design tokens do brand book como CSS variables em `globals.css` (paleta roxa/laranja/azul/neutros, light/dark). (Satisfaz D5, RF-9.3)
- [x] 3.4 Configurar tipografia Montserrat (UI) + Roboto Mono (dados técnicos). (Satisfaz D5, RF-9.3)
- [x] 3.5 Criar componentes base (Button, Card, Badge, Table, Modal, ThemeToggle) com corners ≤7pt. (Satisfaz D5, RF-9.3)

## 4. Console — telas (protótipo com dados mock)

- [x] 4.1 Criar tela de Login (auth mockada, desenhada para OIDC). (Satisfaz RF-9.4)
- [x] 4.2 Criar tela de Board (lista de demandas com origem/ambiguidade/autor/domínio/status). (Satisfaz RF-9.1)
- [x] 4.3 Criar tela de Detalhe da demanda (spec, worktrees, ADRs, feedbacks, decisão HITL, eval). (Satisfaz RF-9.2)
- [x] 4.4 Implementar ações de Aprovar/Rejeitar no HITL na tela de Detalhe. (Satisfaz RF-9.2)
- [x] 4.5 Criar tela de Intake manual (formulário origem + texto). (Satisfaz RF-9.5)
- [x] 4.6 Criar tela de Auditoria (classificações do Intake + correção da heurística). (Satisfaz RF-9.6, RF-9.7)
- [x] 4.7 Implementar toggle de tema claro/escuro. (Satisfaz RF-9.3)

## 5. Integração console ↔ API

- [x] 5.1 Criar cliente HTTP no frontend para consumir a API FastAPI. (Satisfaz D2)
- [x] 5.2 Conectar a tela de Board ao `GET /board`. (Satisfaz RF-9.1)
- [x] 5.3 Conectar a tela de Detalhe ao `GET /board/{thread_id}` e `POST /resume`. (Satisfaz RF-9.2)
- [x] 5.4 Conectar a tela de Intake ao `POST /intake`. (Satisfaz RF-9.5)
- [x] 5.5 Conectar a tela de Auditoria ao `GET /auditoria` e `POST /auditoria/heuristica`. (Satisfaz RF-9.6, RF-9.7)

## 6. Skill de frontend (Guia)

- [x] 6.1 Criar skill `frontend-sensedia` (SKILL.md) com brand book + padrão shadcn/ui. (Satisfaz D6, ADR-0011)
- [x] 6.2 Integrar a skill ao `guia.py` (carregar quando `skill_dir` fornecida). (Satisfaz D6, ADR-0011)

## 7. Testes e validação

- [x] 7.1 Testes unitários da extensão do runtime (classificação registrada, heurística mutável, BoardView). (Satisfaz RNF-4)
- [x] 7.2 Testes de integração da API (board, detalhe, resume, intake, auditoria). (Satisfaz RNF-4)
- [x] 7.3 Testes do frontend (renderização das telas, ações HITL, toggle de tema). (Satisfaz RNF-4)
- [x] 7.4 Rodar lint e testes (pytest + ruff no runtime; lint/build no frontend). (Satisfaz RNF-4, RNF-5)
- [x] 7.5 Registrar ADR da camada de API + console. (Satisfaz convenção ADR)
