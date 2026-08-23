## Context

A squad Open Agentic Ops é um grafo LangGraph (Python) que opera o ciclo de vida de Open Finance. O runtime atual não tem interface para o FDE (humano) operar: o grafo é invocado programaticamente, o `POST /resume` do HITL é apenas uma função (não um endpoint HTTP), e o `BoardView.pending()` depende de um cache manual (`register()`), não lista threads do checkpointer automaticamente. A auditoria prospectiva (RNF-6) não está implementada — a heurística do Intake é determinística e o estado do board não guarda histórico de classificação.

Este change adiciona um **console web do FDE** (frontend Next.js) e uma **camada de API FastAPI** que expõe o grafo, seguindo o brand book Sensedia. Decisões de escopo foram fechadas em sessão de grilling com o FDE (usuário).

## Goals / Non-Goals

**Goals:**
- Dar ao FDE um console para operar a squad: ver o board, aprovar/rejeitar no HITL, injetar demanda manualmente e auditar classificações do Intake.
- Expor o grafo LangGraph via API HTTP (FastAPI) consumida pelo console.
- Aplicar o brand book Sensedia (paleta, tipografia, corners, dark/light) ao console.
- Registrar classificação + justificativa do Intake e permitir correção prospectiva da heurística (RNF-6).

**Non-Goals:**
- Auth OIDC real (mock no MVP; tela de login desenhada).
- Integração do protótipo com a API real (mock primeiro; integração na implementação completa).
- Provisionamento de infra (Postgres/Redis).
- Observabilidade avançada no console (SLO/traces).
- Automação de deploy do console.

## Decisions

### D1 — Stack do console: Next.js + shadcn/ui + Tailwind v4 + next-themes
Reusa o blueprint comprovado do projeto `dados-governanca-mag/web` (Next.js App Router, shadcn/ui new-york, Radix, Tailwind v4, next-themes). Alternativas consideradas: Vite (SPA pura) — rejeitado por não reusar o padrão existente e dificultar evolução para auth/SSR.

### D2 — Camada de API: FastAPI no mesmo repo (`api/`)
Adiciona `fastapi` + `uvicorn` ao runtime. Endpoints: `GET /board`, `GET /board/{thread_id}`, `POST /resume`, `POST /intake`, `GET /auditoria`, `POST /auditoria/heuristica`. Alternativa: Flask — rejeitado (FastAPI é o padrão moderno, async, compatível com LangGraph).

### D3 — Registro de classificação: novo campo `classificacao_intake` no BoardState
O Intake passa a registrar `dominio`, `ambiguidade`, `justificativa` (palavras-chave) e `timestamp` por demanda. Alternativas: tabela separada (fragmenta o modelo "checkpointer = board"); derivar do `get_state_history` (frágil).

### D4 — Auditoria prospectiva: correção da heurística via API
`POST /auditoria/heuristica` permite ao FDE adicionar/remover palavras-chave da heurística do Intake, valendo para demandas futuras (nunca reabre implementação — RNF-6). A heurística passa a ser carregada de uma fonte mutável (ex.: JSON/banco) em vez de constantes hardcoded.

### D5 — Design tokens do brand book como CSS variables
Paleta completa (roxos `#2B163B`→`#F3DEFE`, laranjas `#B53B08`→`#FEBEAA`, azuis `#0066B7`→`#97D1FF`, neutros) mapeada como CSS variables em `globals.css`, com semântica (`--primary` roxo, `--accent` laranja, status do board, light/dark). Tipografia Montserrat (UI) + Roboto Mono (dados técnicos). Corners ≤7pt.

### D6 — Skill de frontend (`frontend-sensedia`)
Skill (SKILL.md) que o Feature Agent frontend carrega, incorporando o brand book e o padrão shadcn/ui. Substitui o `_DEFAULT_FRONTEND` genérico em `guia.py` quando `skill_dir` é fornecida.

### D7 — Auth mockada com tela de login desenhada
Login screen no design; auth fake no MVP (ex.: qualquer credencial válida ou token fixo); API desenhada para aceitar OIDC depois.

## Risks / Trade-offs

- **[Monorepo cresce]** → Manter `frontend/` e `api/` isolados com scripts próprios; documentar no README.
- **[Heurística mutável pode degradar triagem]** → Auditoria é sempre prospectiva; correção registrada e reversível; testes de regressão da heurística.
- **[PII no console]** → A API e o console consomem apenas o estado já mascarado na fronteira (Intake); nunca expor PII raw (RNF-1).
- **[Auth mockada insegura em produção]** → Explicitamente non-goal; OIDC é o caminho futuro; API preparada para auth.
- **[Next.js + shadcn adiciona peso]** → Aceitável para um console interno; build otimizado.

## Migration Plan

1. Extensão do runtime (campo `classificacao_intake`, heurística mutável, correção de `BoardView.pending()`).
2. Camada `api/` (FastAPI) expondo o grafo.
3. Console `frontend/` (Next.js) com dados mock.
4. Integração console ↔ API.
5. Skill `frontend-sensedia`.
Rollback: cada camada é incremental e reversível; o runtime continua funcionando sem o console.

## Open Questions

- Formato exato da fonte mutável da heurística (JSON vs. tabela) — decidir na implementação.
- Nomes/contratos finais dos endpoints — refinados na implementação da API.
