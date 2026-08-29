# oao-console-oidc Specification

## Purpose
TBD - created by archiving change oao-console-oidc. Update Purpose after archive.
## Requirements
### Requirement: Login OIDC real no console do FDE

O sistema SHALL autenticar o FDE no console via OIDC (Auth.js + Keycloak, authorization code + PKCE), usando o client público `oao-console` do realm `oao`, e criar uma sessão com `access_token` e `tenant_id` (cookie httpOnly).

#### Scenario: FDE autentica via Keycloak

- **WHEN** um FDE não autenticado acessa o console e clica em "Entrar com Keycloak"
- **THEN** o frontend redireciona para o Keycloak (realm `oao`), o FDE autentica, e o frontend cria uma sessão com `access_token` e `tenant_id`

#### Scenario: Sessão expõe access_token e tenant_id

- **WHEN** um FDE autenticado tem uma sessão ativa
- **THEN** a sessão expõe o `access_token` e o `tenant_id` (da claim do token) para a aplicação

### Requirement: Guard de autenticação nas rotas do dashboard

O sistema SHALL proteger as rotas do dashboard (`/dashboard`, `/tasks`, `/audit`, `/graph`, `/loops`, etc.), redirecionando usuários não autenticados para `/login`.

#### Scenario: Usuário não autenticado acessa o dashboard

- **WHEN** um usuário não autenticado tenta acessar uma rota do dashboard
- **THEN** o sistema redireciona para `/login`

#### Scenario: Usuário autenticado acessa o dashboard

- **WHEN** um usuário autenticado acessa uma rota do dashboard
- **THEN** o sistema permite o acesso

### Requirement: API do console envia Bearer token

O sistema SHALL enviar o header `Authorization: Bearer <access_token>` em todas as chamadas do frontend à API do console (`/tasks`, `/tasks/{thread_id}`, `/resume`, `/intake`, `/auditoria`), obtendo o token da sessão Auth.js.

#### Scenario: Chamada à API com token

- **WHEN** o frontend chama `GET /tasks` com um FDE autenticado
- **THEN** a requisição inclui `Authorization: Bearer <access_token>` e o backend retorna apenas as demandas do tenant do JWT (sem modo demo)

#### Scenario: Sem token válido

- **WHEN** o frontend chama a API sem um token válido
- **THEN** o backend responde 401 e o frontend não cai em modo demo com dados de outro tenant

