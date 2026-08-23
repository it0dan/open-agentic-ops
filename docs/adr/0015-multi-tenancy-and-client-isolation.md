# Multi-tenancy e isolamento por cliente no Board/console

## Status

Accepted

## Context

A oferta foi fechada como **produto vendável** (decisão da rodada de definição da oferta): instituições participantes do Open Finance Brasil contratam a squad, não só a Sensedia usa internamente. Isso destrava uma necessidade real de **multi-tenancy**: o Board (checkpointer, `thread_id` por execução) precisa distinguir de qual cliente é cada demanda.

Hoje o modelo de dados não tem nenhum campo de tenant: `BoardState`, `IntakeBody` e `Origem` não carregam isolamento por cliente. `BoardView.list_threads()`/`all()` fazem full scan sem filtro. Não existe auth real (ADR-0014: auth mockada no MVP, OIDC como caminho futuro). O console (`/registry`, `/dashboard`, `/graph`) mostra tudo globalmente — correto para uso interno, insuficiente para produto vendável com múltiplos clientes operando a squad simultaneamente.

A máscara de PII na fronteira (ADR-0006) resolve "não vaza dado pessoal entre agentes/telemetria" — **não** resolve "cliente A não pode ver demanda do cliente B". São dois problemas diferentes; só o primeiro está desenhado.

## Decision

1. **`tenant_id` vive no `BoardState`** (campo `tenant_id: str`) — mesma filosofia de "o board é o checkpointer, não um sistema à parte" (ADR-0002), roundtrip automático via `channel_values`, zero infra nova.

2. **`thread_id` sem namespace** — continua `uuid4()` puro; o tenant só existe no campo de estado. **Consequência registrada:** sem namespace no `thread_id`, não há defesa em profundidade estrutural — o isolamento depende inteiramente de enforcement disciplinado em *todo* endpoint que toca o board. Não existe segunda camada (ex.: colisão de ID entre tenants impossível por construção) pegando um filtro esquecido.

3. **Origem do `tenant_id` via claim JWT (Keycloak)** — realm único do Keycloak, com atributo de usuário `tenant_id` por FDE, mapeado para o access token via Protocol Mapper (User Attribute → claim). Dependency FastAPI (`get_current_tenant`) decodifica o JWT e extrai a claim — única fonte de verdade.
   - `POST /intake`: `tenant_id` vem do JWT, **nunca** do corpo — `IntakeBody` não ganha esse campo.
   - `GET /tasks`, `GET /tasks/{thread_id}`, `POST /resume`: toda leitura/escrita filtra ou valida contra o tenant do JWT. Mismatch retorna **404**, não 403 (prática padrão anti-enumeração).
   - **Exceção — demandas geradas pelo SRE Agent** (port `criar_demanda`): chamada interna, sem contexto de JWT. `tenant_id` propaga do próprio `state` da execução corrente (o item que acabou de ser deployado), não de claim.

4. **FDE por tenant** — cada instituição participante tem seu(s) próprio(s) FDE(s), autenticado só pro tenant dele. Mais fiel ao nome "Forward Deployed Engineer" (engenheiro embarcado no cliente) do que um FDE Sensedia global. Como cada FDE pertence a exatamente um tenant, o atributo Keycloak é uma string única (comparação 1:1).

## Consequences

- O vínculo demanda↔cliente (rastreabilidade/SLA por cliente) é o próprio `tenant_id` — resolve a decisão de origem "vínculo demanda↔cliente" (§5.1 da definição da oferta).
- **Sem defesa em profundidade:** o isolamento depende de enforcement disciplinado em todo endpoint; um filtro esquecido vaza dados entre tenants.
- Requer infraestrutura Keycloak (realm único, protocol mapper) e Postgres em prod — não implementável isoladamente com o campo morto no estado.
- O filtro de tenant no console (`/registry`, `/dashboard`, `/graph`) fica deferido até auth real + `tenant_id` existirem; o console continua global (uso interno) por ora.
- `[DECISÃO PENDENTE]` — instituições muito grandes podem precisar de múltiplos FDEs simultâneos no mesmo tenant (provável); múltiplos usuários podem compartilhar o mesmo valor de `tenant_id` (um atributo por usuário continua servindo). Só fechar se houver necessidade de papéis diferentes dentro do mesmo tenant.
