## Why

O OAO foi fechado como **produto vendável** (ADR-0015). Com a Fase C (multi-tenancy no console) concluída, o backend do console (`/tasks`, `/tasks/{thread_id}`, `/resume`, `/intake`, `/auditoria`) **exige Bearer token JWT** via `get_current_tenant`. Porém, o frontend do console ainda tem **login mockado** (aceita qualquer credencial, seta `localStorage fde-auth=mock`) e **não envia token** nas chamadas à API. Resultado: o frontend recebe 401 e cai em **modo demo** (dados sintéticos) — o FDE não consegue operar demandas reais do próprio tenant.

Este change implementa o **login OIDC real no frontend** (Auth.js/next-auth + Keycloak), fechando o loop: o FDE autentica via Keycloak, o frontend obtém o access token e o envia no header `Authorization`, e o backend isola os dados pelo `tenant_id` da claim.

## What Changes

- **Auth.js (next-auth v5)** instalado no frontend, com provider Keycloak (client público `oao-console`, issuer `http://localhost:8080/realms/oao`).
- **`auth.ts`** com callbacks `jwt`/`session` para expor `access_token` e `tenant_id`.
- **API route** `app/api/auth/[...nextauth]/route.ts`.
- **`frontend/.env.local`** com `AUTH_SECRET`, `AUTH_KEYCLOAK_ID`, `AUTH_KEYCLOAK_ISSUER`, `AUTH_TRUST_HOST`, `NEXT_PUBLIC_API_URL`.
- **`proxy.ts`** (Next 16) protegendo as rotas do dashboard (não-autenticados → `/login`).
- **Guard** no `app/(dashboard)/layout.tsx` via `auth()` (server-side).
- **`app/login/page.tsx`** — substituir form mockado por `signIn("keycloak")`.
- **`components/home-redirect.tsx`** + `app/page.tsx` — verificar sessão real (não `fde-auth`).
- **`lib/api.ts`** — injetar `Authorization: Bearer <access_token>` no `request()`.
- **Testes** do login atualizados para o fluxo OIDC.

## Capabilities

### New Capabilities
- `oao-console-oidc`: login OIDC real no console do FDE (Auth.js + Keycloak) — sessão com `access_token` + `tenant_id`, guard nas rotas do dashboard, `lib/api.ts` enviando Bearer token.

### Modified Capabilities
- `oao-multi-tenancy`: o console do FDE passa a autenticar via Keycloak e enviar o Bearer token, fechando o isolamento por tenant no frontend (sem modo demo).

## Impact

- `frontend/package.json` — dependência `next-auth`.
- `frontend/auth.ts` — config Auth.js (novo).
- `frontend/app/api/auth/[...nextauth]/route.ts` — API route (novo).
- `frontend/proxy.ts` — guard de rotas (novo).
- `frontend/app/(dashboard)/layout.tsx` — guard server-side.
- `frontend/app/login/page.tsx` — botão `signIn("keycloak")`.
- `frontend/components/home-redirect.tsx` — sessão real.
- `frontend/lib/api.ts` — Bearer token.
- `frontend/.env.local` — env vars (não commitado).
- `frontend/app/login/page.test.tsx` — testes OIDC.
- `docs/adr/0024-console-oidc-login.md` — novo ADR.
- `docs/sdd/feature-intakes/oao-console-oidc.md` — novo Feature Intake Brief.
- `openspec/changes/oao-console-oidc/` — novo change OpenSpec.
