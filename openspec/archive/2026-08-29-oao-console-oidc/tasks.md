## Grupo 1 — Auth.js + Keycloak (D22/D23)

- [ ] 1.1 Instalar `next-auth` (v5) no frontend.
- [ ] 1.2 Criar `frontend/auth.ts` com provider Keycloak (client `oao-console`, issuer `http://localhost:8080/realms/oao`).
- [ ] 1.3 Callbacks `jwt`/`session` para expor `access_token` e `tenant_id`.
- [ ] 1.4 Criar API route `app/api/auth/[...nextauth]/route.ts`.
- [ ] 1.5 Criar `frontend/.env.local` com `AUTH_SECRET`, `AUTH_KEYCLOAK_ID`, `AUTH_KEYCLOAK_ISSUER`, `AUTH_TRUST_HOST`, `NEXT_PUBLIC_API_URL`.

## Grupo 2 — Guard de autenticação (D24)

- [ ] 2.1 Criar `frontend/proxy.ts` protegendo as rotas do dashboard (não-autenticados → `/login`).
- [ ] 2.2 Adicionar guard server-side via `auth()` no `app/(dashboard)/layout.tsx`.

## Grupo 3 — Login e redirect (D26)

- [ ] 3.1 Substituir form mockado de `app/login/page.tsx` por `signIn("keycloak")`.
- [ ] 3.2 Atualizar `components/home-redirect.tsx` + `app/page.tsx` para verificar sessão real (não `fde-auth`).

## Grupo 4 — API com Bearer token (D25)

- [ ] 4.1 Injetar `Authorization: Bearer <access_token>` no `request()` de `lib/api.ts`.

## Grupo 5 — Testes e validação

- [ ] 5.1 Atualizar `app/login/page.test.tsx` para o fluxo OIDC.
- [ ] 5.2 `npm run lint`, `npm run build`, `npm test` verdes.
- [ ] 5.3 Validação E2E com Keycloak (login real + dados por tenant, sem modo demo).

## Grupo 6 — Docs e arquivamento

- [ ] 6.1 Criar ADR-0024 (login OIDC no console).
- [ ] 6.2 Atualizar `HANDOFF.md`, `README.md`, `ARCHITECTURE.md`.
- [ ] 6.3 Arquivar o change `oao-console-oidc` em `openspec/archive/`.
- [ ] 6.4 Commits coesos + push (após confirmação).
