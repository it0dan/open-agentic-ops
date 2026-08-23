# Camada de API FastAPI + console web do FDE

## Status

Accepted

## Context

O runtime da squad é um grafo LangGraph (Python) sem interface para o FDE (humano) operar: o grafo é invocado programaticamente, o `POST /resume` do HITL era apenas uma função (não um endpoint HTTP), e a auditoria prospectiva (RNF-6) não tinha superfície de uso. O FDE precisava de um console para ver o board, aprovar/rejeitar no HITL, injetar demanda manualmente e auditar/corrigir a heurística do Intake.

## Decision

Adicionar duas camadas no mesmo repositório:

1. **Camada de API FastAPI** (`api/`): expõe o grafo via HTTP. Endpoints: `GET /tasks`, `GET /tasks/{thread_id}` (404 se inexistente), `POST /resume` (HITL via `Command(resume=...)`, validando interrupt pendente), `POST /intake` (gera `uuid4`, valida texto não vazio), `GET /auditoria`, `POST /auditoria/heuristica` (correção prospectiva). A API consome apenas o estado já mascarado na fronteira (Intake) — nunca expõe PII raw (RNF-1).

2. **Console web do FDE** (`frontend/`): Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui (preset `radix-nova`, base Radix) + next-themes, seguindo o brand book Sensedia (paleta roxa/laranja/azul, Montserrat + Roboto Mono, temas claro/escuro). Telas: Login (auth mockada, desenhada para OIDC), Board, Detalhe (com ações Aprovar/Rejeitar no HITL), Intake manual e Auditoria. Consome a API via cliente HTTP (`lib/api.ts`), com fallback para dados mock quando a API está indisponível.

### Revisão visual (dark-first + glassmorphism)

Após avaliação do usuário ("MUITO quadrado"), o console foi redesenhado com **direção dark-first + glassmorphism** (inspiração Vercel/Monday), preservando a identidade Sensedia:

- **Dark-first:** tema escuro como padrão (`defaultTheme="dark"`, fundo `#0b0712`), claro mantido via `next-themes`.
- **Radius aumentado** para `0.9375rem` (15px) — **quebra deliberada** do brand book original (corners ≤7pt), para suavizar a estética.
- **Glassmorphism:** utilitários `.glass`/`.glass-strong`/`.bg-grid`/`.glow-purple`/`.glow-orange`/`.text-gradient` em `globals.css`.
- **Layout:** sidebar lateral (desktop) + Sheet (mobile) substitui o header/nav superior.
- **Feedback:** toasts via `sonner`; `TooltipProvider` no root layout.
- Redesign é **visual/UX** — a lógica de dados (API, mock, estados) permanece intacta.

### Redesign v2 (clean/minimalista + 1 accent)

Após nova avaliação do usuário ("laranja misturado com roxo muito forte"), o console foi redesenhado para uma direção **clean/minimalista com um único accent**:

- **Paleta neutra + 1 accent:** base em cinzas frios (zinc) com **um único accent roxo suave** (`#7c3aed`/`#a78bfa`). O laranja deixa de ser cor de destaque dos elementos principais e fica reservado apenas para estados semânticos (HITL pendente, alertas).
- **Sem gradientes fortes:** removidos os gradientes roxo→laranja de botões, cards, logo e destaques; superfícies usam `bg-card` + `border-border/60`.
- **Sidebar colapsável:** shadcn `Sidebar` com `collapsible="icon"` (expandida ↔ ícones), estado persistido via cookie; logo clicável leva ao novo **Dashboard** (`/dashboard`).
- **Nova home/dashboard:** rota `/dashboard` com visão estilo APM/Analytics — KPIs globais, pipeline do loop (agentes executando, % concluído, erros, HITL), timeline de eventos e demandas em destaque.
- **Tema cíclico:** `ThemeToggle` alterna `dark → light → system` com um clique (sem menu).
- **Filtros por chips:** `filter-bar` com chips combináveis (origem/status/domínio) + busca, substituindo os `Select`/combobox.
- **Tempo real:** polling (~4s) nas telas de operação (Dashboard, Board, Detalhe) + simulação de avanço de progresso quando a API está indisponível (fallback mock).
- Radius mantido em `0.9375rem` (15px).

## Consequences

- O FDE ganha uma interface de operação da squad, fechando o loop de HITL e auditoria.
- Monorepo cresce com `api/` e `frontend/`, isolados com scripts próprios (documentado no README).
- Auth é mockada no MVP (non-goal); OIDC é o caminho futuro, com a API preparada para auth.
- A heurística mutável (JSON) permite correção prospectiva sem reabrir implementação (RNF-6).
- O runtime continua funcionando sem o console (camadas incrementais e reversíveis).
- O redesign dark-first + glassmorphism aumenta o radius para `0.9375rem`, divergindo do brand book original (≤7pt) — decisão consciente, documentada acima, e refletida na skill `frontend-sensedia`.
- O redesign v2 (clean/minimalista + 1 accent) diverge ainda mais do brand book original (dupla roxo/laranja), priorizando clareza e minimalismo — decisão consciente, documentada acima, e refletida na skill `frontend-sensedia`.
- O tempo real é implementado via polling + simulação no frontend; streaming real (SSE/WebSocket) fica como evolução futura no backend.
