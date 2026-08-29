# Login OIDC real no console do FDE (Auth.js + Keycloak)

## Status

Accepted

## Context

Com a Fase C (multi-tenancy no console, ADR-0023) concluída, o backend do console (`/tasks`, `/tasks/{thread_id}`, `/resume`, `/intake`, `/auditoria`) **exige Bearer token JWT** via `get_current_tenant`. Porém, o frontend ainda tinha **login mockado** (aceitava qualquer credencial, setava `localStorage fde-auth=mock`) e **não enviava token** nas chamadas à API. Resultado: o frontend recebia 401 e caía em **modo demo** (dados sintéticos) — o FDE não conseguia operar demandas reais do próprio tenant.

O Keycloak já tinha o client público `oao-console` (OIDC, redirect `http://localhost:3000/*`, protocol mapper `tenant_id`) e o usuário `fde-tenant-a` (tenant_id=tenant-a). O backend já valida o JWT via `JWTScopeProvider` (JWKS, RS256, claims `tenant_id` + `azp`/`client_id`).

## Decision

- **Auth.js (next-auth v5) com provider Keycloak** no frontend Next.js 16, apontando para o client público `oao-console` (issuer `http://localhost:8080/realms/oao`). Auth.js gerencia o authorization code flow com PKCE, a sessão (cookie httpOnly) e o refresh.
- **Expor `access_token` e `tenant_id` via callbacks `jwt`/`session`**: o `access_token` é usado pelo `lib/api.ts` no header `Authorization`; o `tenant_id` vem do protocol mapper do client `oao-console`.
- **Guard de autenticação em duas camadas**: `proxy.ts` (Next 16, substitui `middleware.ts`) faz o optimistic check via cookie de sessão, redirecionando não-autenticados → `/login`; `app/(dashboard)/layout.tsx` faz o guard server-side via `auth()` (assinatura real de sessão) — defesa em profundidade.
- **`lib/api.ts` injeta `Authorization: Bearer <access_token>`** no `request()` — ponto único que cobre todas as funções de fetch. O token vem da sessão (cookie httpOnly), não de `localStorage`.
- **Login page com `signIn("keycloak")`**: substitui o form mockado; remove `localStorage.setItem("fde-auth", "mock")`. `home-redirect.tsx` passa a verificar a sessão real via `useSession`.

## Consequences

- O FDE autentica via Keycloak, o frontend obtém o access token e o envia no header `Authorization`, e o backend isola os dados pelo `tenant_id` da claim — **fim do modo demo**.
- O access token fica disponível no browser (client público `oao-console`), mas é guardado em cookie httpOnly via Auth.js, não em `localStorage`.
- `AUTH_SECRET` é obrigatório e não é commitado (`.env*` ignorado).
- Testes do login foram reescritos para o fluxo OIDC (mockar `signIn`/`useSession`).
- Refresh token automático / logout avançado permanecem como mínimo necessário (deferido).

## References

- ADR-0015 (multi-tenancy e isolamento de cliente), ADR-0022 (auth OAuth2/JWT + AI Gateway), ADR-0023 (isolamento por tenant no console).
