# Feature Intake Brief — oao-console-oidc

## 1. Feature name

`oao-console-oidc`

## 2. Business context

O OAO foi fechado como **produto vendável** (ADR-0015): instituições participantes do Open Finance Brasil contratam a squad. Com a Fase C (multi-tenancy no console) concluída, o backend do console (`/tasks`, `/tasks/{thread_id}`, `/resume`, `/intake`, `/auditoria`) **exige Bearer token JWT** via `get_current_tenant`. Porém, o frontend do console ainda tem **login mockado** (aceita qualquer credencial, seta `localStorage fde-auth=mock`) e **não envia token** nas chamadas à API. Resultado: o frontend recebe 401 e cai em **modo demo** (dados sintéticos) — o FDE não consegue operar demandas reais do próprio tenant.

Esta rodada implementa o **login OIDC real no frontend** (Auth.js/next-auth + Keycloak), fechando o loop: o FDE autentica via Keycloak, o frontend obtém o access token e o envia no header `Authorization`, e o backend isola os dados pelo `tenant_id` da claim.

## 3. User / persona

- **FDE (Forward Deployed Engineer)** por tenant — autentica no console via Keycloak e opera só as demandas do próprio tenant.
- **Instituição participante** (cliente) — garante que suas demandas não vazem para outro cliente.

## 4. Problem statement

O backend do console exige Bearer token JWT (Fase C), mas o frontend não autentica: o login é mockado (`fde-auth=mock`) e o `lib/api.ts` não envia `Authorization`. Toda chamada à API retorna 401 e o frontend cai em modo demo (dados sintéticos). O FDE não consegue ver/operar demandas reais, e o isolamento por tenant (ADR-0015) fica inócuo no console.

## 5. Feature intention

Habilitar login OIDC real no console do FDE:

- O FDE autentica via Keycloak (authorization code + PKCE) usando o client público `oao-console`.
- O frontend guarda a sessão (cookie httpOnly via Auth.js) e expõe o `access_token` + `tenant_id`.
- `lib/api.ts` injeta `Authorization: Bearer <access_token>` em todas as chamadas.
- O guard de autenticação protege as rotas do dashboard (redireciona não-autenticados → `/login`).
- O backend isola os dados pelo `tenant_id` da claim (sem mudança de backend).

## 6. Expected user journey

```txt
FDE (tenant-a)
→ acessa o console → redirecionado para /login
→ clica "Entrar com Keycloak" → redirecionado para o Keycloak (realm oao)
→ autentica como fde-tenant-a → redirecionado de volta (callback)
→ sessão criada (cookie httpOnly) com access_token + tenant_id=tenant-a
→ GET /tasks envia Authorization: Bearer <token>
→ backend valida JWT e retorna só demandas do tenant-a
→ FDE opera demandas do próprio tenant (sem modo demo)
```

## 7. In scope

- [ ] Instalar Auth.js (next-auth v5) no frontend.
- [ ] Configurar `auth.ts` com provider Keycloak (client público `oao-console`, issuer `http://localhost:8080/realms/oao`).
- [ ] Callbacks `jwt`/`session` para expor `access_token` e `tenant_id`.
- [ ] API route `app/api/auth/[...nextauth]/route.ts`.
- [ ] `frontend/.env.local` com `AUTH_SECRET`, `AUTH_KEYCLOAK_ID`, `AUTH_KEYCLOAK_ISSUER`, `AUTH_TRUST_HOST`, `NEXT_PUBLIC_API_URL`.
- [ ] `proxy.ts` (Next 16) protegendo as rotas do dashboard (não-autenticados → `/login`).
- [ ] Guard no `app/(dashboard)/layout.tsx` via `auth()` (server-side).
- [ ] `app/login/page.tsx` — substituir form mockado por `signIn("keycloak")`.
- [ ] `components/home-redirect.tsx` + `app/page.tsx` — verificar sessão real (não `fde-auth`).
- [ ] `lib/api.ts` — injetar `Authorization: Bearer <access_token>` no `request()`.
- [ ] Atualizar testes do login para o fluxo OIDC.
- [ ] Validar E2E com Keycloak (login real + dados por tenant).

## 8. Out of scope

- [ ] Mudanças no backend (já pronto: `get_current_tenant` + `JWTScopeProvider`).
- [ ] Filtro de tenant no console web (telas) — deferido.
- [ ] Refresh token automático / logout avançado — mínimo necessário.
- [ ] Eval gate real LangSmith (ADR-0018) — frente separada.
- [ ] Wire do `ToolExecutionPort` MCP / A2A HTTP — frentes separadas.

## 9. Inputs

- Credenciais do FDE no Keycloak (realm `oao`, usuário `fde-tenant-a`).
- Client público `oao-console` (já provisionado no realm-export.json).
- Env vars do frontend (`.env.local`).

## 10. Outputs

- Frontend com login OIDC real (Auth.js + Keycloak).
- Sessão com `access_token` + `tenant_id` (cookie httpOnly).
- `lib/api.ts` enviando Bearer token.
- Guard de autenticação nas rotas do dashboard.
- Testes atualizados + validação E2E.
- ADR-0024 (login OIDC no console).

## 11. Existing assets to reuse

- `infra/keycloak/realm-export.json` — client `oao-console` (público, OIDC, redirect `http://localhost:3000/*`, mapper `tenant_id`) e usuário `fde-tenant-a`.
- `src/open_agentic_ops/auth.py` — `JWTScopeProvider`, `get_current_tenant` (backend já valida o JWT).
- `frontend/lib/api.ts` — ponto único de fetch (injetar token aqui cobre todas as chamadas).
- `frontend/app/login/page.tsx` — página de login (substituir form mockado).
- `frontend/components/home-redirect.tsx` — guard da raiz (trocar `fde-auth` por sessão real).
- `frontend/app/(dashboard)/layout.tsx` — layout do dashboard (adicionar guard).

## 12. Constraints

- `tenant_id` via claim JWT, nunca do corpo (ADR-0015).
- PII mascarada na fronteira (ADR-0006).
- Não commitar `AUTH_SECRET` (`.env*` já ignorado no `.gitignore` do frontend).
- Preferir cookie httpOnly (Auth.js) a `localStorage` para o token.
- Next.js 16 usa `proxy.ts` (não `middleware.ts`).
- Backend já pronto — nenhuma mudança de backend nesta rodada.

## 13. Acceptance criteria

- [ ] FDE autentica via Keycloak (authorization code + PKCE) e volta ao console.
- [ ] Sessão criada com `access_token` + `tenant_id` (cookie httpOnly).
- [ ] `lib/api.ts` envia `Authorization: Bearer <token>` em todas as chamadas.
- [ ] Rotas do dashboard protegidas (não-autenticados → `/login`).
- [ ] `GET /tasks` retorna só demandas do tenant do JWT (sem modo demo).
- [ ] `npm run lint`, `npm run build`, `npm test` verdes.
- [ ] Validação E2E com Keycloak (login real + dados por tenant).

## 14. Risks and ambiguities

- **Client público `oao-console`**: o access token fica disponível no browser (client público). Mitigação: guardar em cookie httpOnly via Auth.js, não em `localStorage`.
- **`AUTH_SECRET`**: obrigatório para Auth.js; gerar e não commitar.
- **Testes do login**: `login/page.test.tsx` valida `fde-auth=mock` — precisa ser reescrito para o fluxo OIDC.
- **Next 16 `proxy.ts`**: convenção nova (substitui `middleware.ts`); seguir o guia oficial.
- **Redirect URI**: Auth.js usa `http://localhost:3000/api/auth/callback/keycloak` — casa com `http://localhost:3000/*` do client.
- **`tenant_id` no token**: o mapper do client `oao-console` já inclui `tenant_id` no access token; confirmar no E2E.

## 15. Recommended implementation boundaries

- Não mudar o backend (já pronto).
- Não implementar filtro de tenant no console web (deferido).
- Não expor PII raw.
- Não commitar secrets.

## 16. Suggested OpenSpec change name

`oao-console-oidc`

## 17. Suggested safe analysis prompt

```txt
Você está trabalhando no repositório Sensedia Open Agentic Ops.

Antes de criar um novo OpenSpec change, analise a feature proposta com segurança.

Importante:
Não crie, edite, delete ou mova arquivos.
Não rode /opsx:propose.
Não implemente código.
Apenas inspecione o repositório e retorne uma análise.

Leia primeiro:
- AGENTS.md
- PROJECT.md
- HANDOFF.md
- README.md
- openspec/project.md
- openspec/specs/*
- docs/adr/*
- docs/sdd/feature-intakes/oao-console-oidc.md
- frontend/
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/oao-console-oidc.md

Retorne apenas:

1. Entendimento da feature proposta
2. Capacidades atuais do repositório que já suportam esta feature
3. Arquivos existentes relevantes
4. Gaps a serem endereçados
5. Riscos e ambiguidades
6. Estrutura sugerida do OpenSpec change
7. Ajustes de escopo sugeridos, se houver
8. Critérios de aceite sugeridos
9. Breakdown de tasks sugerido
10. Recomendação: se é seguro rodar /opsx:propose em seguida

Não modifique arquivos.
```

## 18. Suggested OpenSpec propose prompt

```txt
/opsx:propose oao-console-oidc

Use o briefing de:
docs/sdd/feature-intakes/oao-console-oidc.md

Crie um novo OpenSpec change para esta feature.

Regras:
- Crie proposal.md, design.md, specs e tasks.md.
- Não implemente código.
- Não mude arquivos de origem.
- Não adicione funcionalidade fora do briefing.
- Respeite AGENTS.md, PROJECT.md e docs/adr/.
- Mantenha escopo alinhado ao feature intake.
- Pare após criar os artefatos OpenSpec.

Após criar o change, resuma:
1. arquivos criados;
2. escopo proposto;
3. premissas;
4. riscos;
5. questões em aberto;
6. próxima ação recomendada.
```
