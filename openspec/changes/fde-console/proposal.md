## Why

A squad Open Agentic Ops opera o ciclo de vida de Open Finance com um único FDE (humano) como ponto de julgamento. Hoje o runtime é um grafo LangGraph invocado programaticamente, sem interface para o FDE operar: não há como ver as demandas no board, aprovar/rejeitar no HITL gate, injetar demanda manualmente ou auditar as classificações do Intake. Sem um console, o FDE depende de acesso técnico ao runtime, o que fragiliza o HITL gate (aprovação humana) e a auditoria prospectiva (RNF-6).

## What Changes

- **Novo console web do FDE** (`frontend/`): Next.js + React + TypeScript + shadcn/ui + Tailwind v4 + next-themes, seguindo o brand book Sensedia (paleta roxa/laranja/azul, Montserrat + Roboto Mono, corners ≤7pt, dark/light).
- **Nova camada de API** (`api/`): FastAPI expondo o grafo LangGraph — `GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume` (HITL), `POST /intake`, `GET /auditoria`, `POST /auditoria/heuristica`.
- **Extensão do runtime Python**: novo campo `classificacao_intake` no `BoardState`; Intake passa a registrar classificação + justificativa; endpoint de correção prospectiva da heurística; correção de `BoardView.pending()` para listar threads do checkpointer automaticamente.
- **Tela de login** desenhada (auth mockada no MVP; OIDC como caminho futuro).
- **Skill de frontend** (`frontend-sensedia`) incorporando o brand book como Guia do Feature Agent frontend.

## Capabilities

### New Capabilities
- `fde-console`: Console web do FDE para operar a squad — board de demandas, detalhe, aprovação/rejeição no HITL gate, intake manual e auditoria prospectiva das classificações do Intake, com identidade visual Sensedia.

### Modified Capabilities
<!-- Nenhuma capability existente é modificada (não há openspec/specs/ ainda). -->

## Impact

- **Runtime Python** (`src/open_agentic_ops/`): `state/` (novo campo `classificacao_intake`), `nodes/intake.py` (registro de justificativa), `persistence/` (correção de `BoardView.pending()`), `nodes/guia.py` (skill de frontend).
- **Novas dependências**: `fastapi`, `uvicorn` (runtime); Next.js, React, shadcn/ui, Tailwind, next-themes (frontend).
- **Novos diretórios**: `api/` (FastAPI), `frontend/` (Next.js).
- **Docs**: novo ADR para a camada de API e o console; atualização do `HANDOFF.md`.

## Non-goals

- **Auth OIDC real** — o MVP usa auth mockada; a tela de login é desenhada, mas a integração com SSO/OIDC (Sensedia AI Gateway) fica para uma rodada futura.
- **Integração do protótipo com a API real** — o protótipo navegável usa dados mock; a integração ponta a ponta com a API FastAPI ocorre na implementação completa.
- **Provisionamento de infra** (Postgres/Redis) — o console e a API rodam em dev com checkpointer InMemory/Sqlite.
- **Observabilidade avançada no console** (métricas SLO/traces) — fica para uma rodada posterior.
- **Automação de deploy do console** — fora do escopo desta rodada.
