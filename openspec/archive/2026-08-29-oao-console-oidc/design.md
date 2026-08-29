## Context

O backend do console exige Bearer token JWT (Fase C, `get_current_tenant`), mas o frontend não autentica: login mockado (`fde-auth=mock`) e `lib/api.ts` sem `Authorization`. Toda chamada à API retorna 401 e o frontend cai em modo demo. O Keycloak já tem o client público `oao-console` (OIDC, redirect `http://localhost:3000/*`, mapper `tenant_id`) e o usuário `fde-tenant-a` (tenant_id=tenant-a). O backend já valida o JWT via `JWTScopeProvider` (JWKS, RS256, claims `tenant_id` + `azp`/`client_id`).

## Goals / Non-Goals

**Goals:**
- Login OIDC real no console (Auth.js + Keycloak, authorization code + PKCE).
- Sessão com `access_token` + `tenant_id` (cookie httpOnly).
- `lib/api.ts` envia `Authorization: Bearer <token>`.
- Guard de autenticação nas rotas do dashboard.
- Fim do modo demo: FDE opera demandas reais do próprio tenant.

**Non-Goals:**
- Mudanças no backend (já pronto).
- Filtro de tenant no console web (deferido).
- Refresh token automático / logout avançado — mínimo necessário.
- Eval gate real LangSmith (ADR-0018) — frente separada.

## Decisions

### D22 — Auth.js (next-auth v5) com provider Keycloak.

Usar Auth.js (next-auth v5) no frontend Next.js 16, com o provider Keycloak apontando para o client público `oao-console` (issuer `http://localhost:8080/realms/oao`). Auth.js gerencia o authorization code flow com PKCE, a sessão (cookie httpOnly) e o refresh. É a lib idiomática para Next.js App Router e recomendada pelo guia oficial de autenticação do Next 16.

### D23 — Expor `access_token` e `tenant_id` via callbacks `jwt`/`session`.

Nos callbacks do Auth.js, copiar o `access_token` e a claim `tenant_id` do token do provider para o token de sessão e para a sessão exposta ao cliente. O `tenant_id` vem do protocol mapper do client `oao-console` (claim no access token). O `access_token` é usado pelo `lib/api.ts` no header `Authorization`.

### D24 — Guard de autenticação via `proxy.ts` + `auth()` no layout.

- `proxy.ts` (Next 16, substitui `middleware.ts`): protege as rotas do dashboard, redirecionando não-autenticados → `/login` (optimistic check via cookie de sessão).
- `app/(dashboard)/layout.tsx`: guard server-side via `auth()` (assinatura real de sessão) — defesa em profundidade.

### D25 — `lib/api.ts` injeta `Authorization: Bearer <access_token>`.

No `request()` de `lib/api.ts`, injetar o header `Authorization: Bearer <access_token>` obtido da sessão Auth.js. Ponto único — cobre todas as 9 funções de fetch. O token vem da sessão (cookie httpOnly), não de `localStorage`.

### D26 — Login page com `signIn("keycloak")`.

Substituir o form mockado de `app/login/page.tsx` por um botão que dispara `signIn("keycloak")` (redirect para o Keycloak). Remover `localStorage.setItem("fde-auth", "mock")`. `home-redirect.tsx` passa a verificar a sessão real (via `getSession`/`auth`), não `fde-auth`.

## Risks / Trade-offs

- [Client público `oao-console`] → access token disponível no browser (client público). Mitigação: guardar em cookie httpOnly via Auth.js, não em `localStorage`.
- [`AUTH_SECRET` obrigatório] → gerar e não commitar (`.env*` ignorado).
- [Testes do login quebram] → `login/page.test.tsx` valida `fde-auth=mock`; reescrever para o fluxo OIDC (mockar `signIn`/`getSession`).
- [Next 16 `proxy.ts`] → convenção nova (substitui `middleware.ts`); seguir o guia oficial.
- [Redirect URI] → Auth.js usa `http://localhost:3000/api/auth/callback/keycloak`, casa com `http://localhost:3000/*` do client.
- [`tenant_id` no token] → mapper do client `oao-console` já inclui `tenant_id` no access token; confirmar no E2E.
