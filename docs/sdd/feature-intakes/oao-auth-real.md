# Feature Intake Brief — oao-auth-real

## 1. Feature name

`oao-auth-real`

## 2. Business context

A superfície de integração externa do OAO (`/oao/<agent>/chat/completions`) foi implementada na Fase A (Camada 1) com auth **mockada** (`HeaderScopeProvider` lê `client_id`/`tenant_id` de headers). Para o OAO ser um **produto vendável** (ADR-0015), a superfície precisa de auth real: OAuth2 `client_credentials` + JWT (Keycloak), com `tenant_id` vindo da claim do token e enforcement real de escopos por `client_id`.

Sem auth real, qualquer chamada com headers forjados acessa os agentes — inaceitável para instituições do Open Finance Brasil que contratam a squad.

## 3. User / persona

- **Instituição participante** (cliente) que integra a squad via API.
- **FDE** (Forward Deployed Engineer) por tenant.
- **Agentes** (Intake, Feature, Platform, Review, Architecture, SRE) que se autenticam via `client_credentials`.

## 4. Problem statement

A Fase A deixou a superfície funcional mas com auth mockada. O `ScopeProvider` é um Protocol com interface `client_id(request)`/`tenant_id(request)` — pronto para trocar por JWT — mas o provider concreto (`HeaderScopeProvider`) confia em headers forjáveis. Não há validação de assinatura de token, nem extração de `tenant_id` de claim, nem enforcement real de escopos por `client_id` do JWT.

## 5. Feature intention

Habilitar auth real na superfície `/oao/*`:

- Validar Bearer token JWT emitido pelo Keycloak (realm único, assinatura via JWKS).
- Extrair `client_id` e claim `tenant_id` do token (única fonte de verdade, ADR-0015).
- Enforce escopos por `client_id` do JWT (não do header mockado).
- Wirear o `LLMProviderPort` real (Sensedia AI Gateway) no `build_graph`, com degradação graciosa sem credenciais.

## 6. Expected user journey

```txt
Cliente/agente
→ obtém Bearer token via OAuth2 client_credentials (Keycloak)
→ chama POST /oao/<agent>/chat/completions com Authorization: Bearer <token>
→ API valida assinatura (JWKS), extrai client_id + tenant_id da claim
→ require_scope valida escopo do client_id (403 se negado)
→ handler invoca o nó do agente (com LLM real se credenciais presentes)
→ resposta OpenAI-compatível
```

## 7. In scope

- [x] Provisionar Keycloak no `docker-compose.yml` (realm único + import de realm JSON).
- [x] Adicionar dependência JWT (`PyJWT` + `cryptography`).
- [x] `JWTScopeProvider` (implementa `ScopeProvider`): decodifica/valida Bearer token via JWKS, extrai `client_id` e claim `tenant_id`.
- [x] Dependency FastAPI `get_current_tenant` (extrai tenant do JWT).
- [x] Trocar `HeaderScopeProvider` por `JWTScopeProvider` no `create_app` (mantendo header provider como fallback de dev/teste configurável).
- [x] `SensediaAIGatewayProvider` (implementa `LLMProviderPort`): OAuth2 `client_credentials` + chat, com degradação graciosa sem credenciais.
- [x] Wirear o provider real no `create_app` → `build_graph(llm=...)`.
- [x] Enforcement real de escopos por `client_id` do JWT (B.3/D9).
- [x] Testes (auth, agents_api com JWT, ai_gateway_provider com mock).

## 8. Out of scope

- [x] Wire do `ToolExecutionPort` MCP (git/test/deploy) — depende de MCP server; fica como stub.
- [x] A2A HTTP (Architecture/Review) — Camada 2 do protocolo, fica como stub.
- [x] Eval gate real LangSmith (ADR-0018) — frente separada.
- [x] Fase C (multi-tenancy completo: isolamento em todo endpoint + FDE por tenant) — próxima fase.
- [x] Cadastro de scopes/credenciais no AI Gateway real — feito pelo usuário, não bloqueia a implementação (mock + degradação graciosa).

## 9. Inputs

- Bearer token JWT (Keycloak) no header `Authorization`.
- Variáveis de ambiente: `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_JWKS_URL`, `AI_GATEWAY_OAUTH_ENDPOINT`, `AI_GATEWAY_CLIENT_ID`, `AI_GATEWAY_CLIENT_SECRET`, `AI_GATEWAY_CHAT_ENDPOINT`.

## 10. Outputs

- `infra/keycloak/realm-export.json` (realm + clientes `oa-*` + protocol mapper `tenant_id`).
- `src/open_agentic_ops/auth.py` (JWTScopeProvider + get_current_tenant).
- `src/open_agentic_ops/providers/ai_gateway.py` (SensediaAIGatewayProvider).
- `api/main.py` atualizado (provider JWT + LLM real).
- Testes novos.
- ADR-0022 (auth real).

## 11. Existing assets to reuse

- `api/agents.py` — `ScopeProvider` Protocol, `require_scope`, endpoints `/oao/*`.
- `src/open_agentic_ops/scopes.py` — matriz `ESCOPOS_POR_CLIENT_ID`.
- `src/open_agentic_ops/ports/__init__.py` — `LLMProviderPort`.
- `src/open_agentic_ops/graph/__init__.py` — `build_graph(llm=...)`.
- `docker-compose.yml` — Postgres já provisionado.
- `tests/test_agents_api.py` — padrão de teste da superfície.

## 12. Constraints

- Stack tudo-Python (LangGraph + LangSmith).
- Hexagonal leve só nas bordas.
- PII mascarada na fronteira (ADR-0006).
- `tenant_id` via claim JWT, nunca do corpo (ADR-0015).
- `pii:raw` negado a todos (ADR-0006).
- `deploy:execute` só pós-Eval; `pr:merge` exclusivo do FDE (restrições de processo).
- Checkpointer = board.
- Degradação graciosa: sem credenciais, cai no fallback determinístico (testes verdes).

## 13. Acceptance criteria

- [ ] `JWTScopeProvider` valida Bearer token via JWKS e extrai `client_id` + `tenant_id`.
- [ ] Token inválido/expirado → 401; escopo negado → 403.
- [ ] `require_scope` lê `client_id` do JWT (não do header mockado).
- [ ] `SensediaAIGatewayProvider` obtém token via OAuth2 e chama o chat; degrada graciosamente sem credenciais.
- [ ] `build_graph` recebe o LLM real quando credenciais presentes.
- [ ] Keycloak provisionado no docker-compose com realm import.
- [ ] `poetry run pytest` verde; `poetry run ruff check .` limpo.

## 14. Risks and ambiguities

- **JWKS fetch:** precisa de rede para buscar as chaves do Keycloak; em testes, usar chave local assinada.
- **Formato do token Keycloak:** `client_id` pode estar em `azp` ou `client_id`; `tenant_id` via protocol mapper (claim custom).
- **Credenciais do AI Gateway:** não cadastradas ainda; provider degrada graciosamente.
- **`deploy:execute` pós-Eval:** enforcement de processo depende do Eval gate real (ADR-0018), frente separada; aqui só o escopo por `client_id`.

## 15. Recommended implementation boundaries

- Não adicionar UI.
- Não mudar o grafo core (nós/arestas/gates).
- Não implementar Fase C (multi-tenancy completo) nesta rodada.
- Não wirear ToolExecutionPort MCP nem A2A HTTP.
- Não expor PII raw.

## 16. Suggested OpenSpec change name

`oao-auth-real`

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
- docs/sdd/feature-intakes/oao-auth-real.md
- src/
- tests/

Analise a feature descrita em:

docs/sdd/feature-intakes/oao-auth-real.md

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
/opsx:propose oao-auth-real

Use o briefing de:
docs/sdd/feature-intakes/oao-auth-real.md

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
