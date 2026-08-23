# Documentação de Integração - Open Agentic Ops (OAO)

Esta documentação reúne o guia de autenticação, o mapeamento de endpoints e exemplos de chamadas `cURL` para cada agente e escopo de recurso do sistema Open Agentic Ops (OAO).

---

## 1. Autenticação (OAuth2 Client Credentials)

Todas as requisições para os agentes exigem um Bearer Token obtido via OAuth2 (`client_credentials`).

### Chamada para Obtenção do Token:
```bash
curl --location 'https://ai-gateway-auth-server.sensedia.com/realms/solutions-garage/protocol/openid-connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --header 'Authorization: Basic XXXXXXXXXXXXX' \
  --data-urlencode 'grant_type=client_credentials'
```

---

## 2. Agentes e Endpoints

A URL base para invocação dos agentes é:
`https://solutions-garage-ai-gateway-lab.sensedia-eng.com/oao/<agent-name>/chat/completions`

---

### 2.1. Intake Agent (`intake`)
- **Identidade (`client_id`):** `oa-intake`
- **Escopos concedidos:** `board:read`, `board:write`, `spec:draft`, `precedent:search`, `pii:mask`
- **Delegação / `act`:** Age em nome do originador (cliente/regulador/FDE) – carrega `act` do originador.
- **Restrições:** Tenant-scoped; **nunca** `pii:raw`; só escreve no board do próprio tenant.
- **Descrição:** Recebe as 4 origens (Cliente, Regulatório/Informes, Estratégia/Sensedia, SRE), classifica domínio e ambiguidade. Baixa ambiguidade + precedente $\rightarrow$ rascunha spec; alta $ightarrow$ escala ao FDE. Protocolo MCP (X-as-a-Service + trigger).

#### Exemplo de cURL:
```bash
curl --location 'https://solutions-garage-ai-gateway-lab.sensedia-eng.com/oao/intake/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer XXXXXXXX' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Processar nova solicitação de entrada de demanda."
      }
    ]
  }'
```

---

### 2.2. Feature Agent - Backend (`feature-backend`)
- **Identidade (`client_id`):** `oa-feature-backend`
- **Escopos concedidos:** `repo:read`, `repo:write` (worktree A), `platform:invoke`, `architecture:consult`, `spec:read`
- **Delegação / `act`:** Age em nome do Intake/FDE (spec).
- **Restrições:** Tenant-scoped; só no worktree A; não acessa frontend.
- **Descrição:** Implementa a feature no domínio backend (worktree A), com skill de backend como Guia. Dono do próprio loop goal-based.

#### Exemplo de cURL:
```bash
curl --location 'https://solutions-garage-ai-gateway-lab.sensedia-eng.com/oao/feature-backend/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer XXXXXXXX' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Implementar funcionalidade no repositório backend (worktree A)."
      }
    ]
  }'
```

---

### 2.3. Feature Agent - Frontend (`feature-frontend`)
- **Identidade (`client_id`):** `oa-feature-frontend`
- **Escopos concedidos:** `repo:read`, `repo:write` (worktree B), `platform:invoke`, `spec:read`
- **Delegação / `act`:** Age em nome do Intake/FDE (spec).
- **Restrições:** Tenant-scoped; só no worktree B; não acessa backend.
- **Descrição:** Implementa a feature no domínio frontend (worktree B), com skill de frontend como Guia. Dono do próprio loop goal-based.

#### Exemplo de cURL:
```bash
curl --location 'https://solutions-garage-ai-gateway-lab.sensedia-eng.com/oao/feature-frontend/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer XXXXXXXX' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Implementar interface de usuário no repositório frontend (worktree B)."
      }
    ]
  }'
```

---

### 2.4. Platform Agent (`platform`)
- **Identidade (`client_id`):** `oa-platform`
- **Escopos concedidos:** `ci:run`, `lint:run`, `test:run`, `deploy:execute`, `obs:read`, `artifact:write`
- **Delegação / `act`:** Age em nome do Feature Agent que o chamou.
- **Restrições:** Agnóstico de stack; **nunca** `deploy:execute` sem Eval aprovado (gate).
- **Descrição:** Testes, lint, deploy e observabilidade como serviço — instância única, agnóstica de stack, atende os dois Feature Agents. Protocolo MCP (X-as-a-Service).

#### Exemplo de cURL:
```bash
curl --location 'https://solutions-garage-ai-gateway-lab.sensedia-eng.com/oao/platform/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer XXXXXXXX' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Executar pipeline de CI/CD e testes para a build atual."
      }
    ]
  }'
```

---

### 2.5. Review Agent (`review`)
- **Identidade (`client_id`):** `oa-review`
- **Escopos concedidos:** `pr:read`, `pr:comment`, `board:read`
- **Delegação / `act`:** Age em nome do FDE (orienta, não bloqueia).
- **Restrições:** Não pode merge (`pr:merge` negado); não escreve no board.
- **Descrição:** Feedback de PR contra padrões do time; orienta, não bloqueia. Discordância de classificação em andamento $\rightarrow$ pausa e escala ao FDE. Protocolo A2A (Facilitating).

#### Exemplo de cURL:
```bash
curl --location 'https://solutions-garage-ai-gateway-lab.sensedia-eng.com/oao/review/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer XXXXXXXX' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Revisar Pull Request conforme as diretrizes do projeto."
      }
    ]
  }'
```

---

### 2.6. Architecture Agent (`architecture`)
- **Identidade (`client_id`):** `oa-architecture`
- **Escopos concedidos:** `contract:read`, `adr:write`, `board:read`
- **Delegação / `act`:** Age em nome do Feature Agent.
- **Restrições:** Aconselha, não veta – **nunca** `deploy:execute` nem `pr:merge`.
- **Descrição:** Discussão síncrona time-boxed em contrato de API externo/compliance; segue o Architecture Advice Process, registra ADR — aconselha, não veta. Protocolo A2A (Collaboration).

#### Exemplo de cURL:
```bash
curl --location 'https://solutions-garage-ai-gateway-lab.sensedia-eng.com/oao/architecture/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer XXXXXXXX' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Consultar contrato de API externa e gerar registro de ADR."
      }
    ]
  }'
```

---

### 2.7. SRE Agent (`sre`)
- **Identidade (`client_id`):** `oa-sre`
- **Escopos concedidos:** `obs:read`, `slo:read`, `board:write` (4ª origem)
- **Delegação / `act`:** Age em nome do sistema (produção).
- **Restrições:** Tenant-scoped; só cria demanda via Intake (nunca direto no board de outro tenant).
- **Descrição:** Monitora SLOs/error budget em produção; gera task automática que realimenta o board como 4ª origem — fecha o loop. Protocolo MCP (X-as-a-Service + trigger).

#### Exemplo de cURL:
```bash
curl --location 'https://solutions-garage-ai-gateway-lab.sensedia-eng.com/oao/sre/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer XXXXXXXX' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Verificar métricas de SLOs e consumo de error budget."
      }
    ]
  }'
```

---

## 3. Matriz de Escopos Transversais (Recursos)

Abaixo estão detalhados todos os escopos transversais e os agentes/entidades que possuem autorização:

| Escopo | Significado | Agente(s) / Entidade(s) Autorizada(s) |
|---|---|---|
| `board:read` / `board:write` | Ler/escrever o board (checkpointer) | `intake` (read/write), `review` (read), `sre` (write via Intake) |
| `spec:read` / `spec:draft` | Ler spec / rascunhar spec | `intake` (draft), `feature-backend` (read), `feature-frontend` (read) |
| `repo:read` / `repo:write` | Acesso ao repositório (worktree) | `feature-backend` (worktree A), `feature-frontend` (worktree B) |
| `platform:invoke` | Chamar Platform Agent | `feature-backend`, `feature-frontend` |
| `architecture:consult` | Consultar Architecture | `feature-backend` |
| `ci:run` / `lint:run` / `test:run` | Pipeline de qualidade | `platform` |
| `deploy:execute` | Deploy em produção | `platform` (somente pós-Eval). **Proibido** para `architecture` e sem gate. |
| `obs:read` / `slo:read` | Observabilidade / SLOs | `platform`, `sre` |
| `pr:read` / `pr:comment` / `pr:merge` | Pull requests | `review` (read/comment). **`pr:merge` exclusivo do FDE**. |
| `contract:read` / `adr:write` | Contratos externos / ADRs | `architecture` |
| `pii:mask` / `pii:raw` | Tratamento de PII | `intake` (`pii:mask`). **`pii:raw` negado a todos**. |
| `precedent:search` | Busca de precedentes | `intake` |

---

## 4. Plano de implementação

Este documento define o **contrato-alvo** da superfície de integração externa. O plano de implementação (endpoints por agente, auth OAuth2/Keycloak, matriz de escopos, delegação `act` e tenant-scoping) está detalhado nos artefatos abaixo, organizado em 3 fases:

- **Feature Intake Brief:** [`docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md`](../../docs/sdd/feature-intakes/oao-endpoints-auth-scopes.md)
- **Change OpenSpec:** [`openspec/changes/oao-endpoints-auth-scopes/`](../../openspec/changes/oao-endpoints-auth-scopes/) (`proposal.md`, `design.md`, `spec.md`, `tasks.md`)

### Fases

| Fase | Escopo | Dependência |
|---|---|---|
| **Fase A — Camada 1 (harness)** | `tenant_id` no `BoardState`, matriz de escopos declarativa (`scopes.py`), endpoints `/oao/<agent>/chat/completions` com validação de escopo em memória, delegação `act`, testes (403/404) | Nenhuma (testável hoje) |
| **Fase B — Camada 2 (infra real)** | Auth OAuth2 `client_credentials` + JWT (Keycloak), wire dos ports reais (LLM/MCP/A2A), enforcement real de escopos | Keycloak, Postgres, gateway |
| **Fase C — Multi-tenancy (ADR-0015)** | Isolamento por tenant em todo endpoint (404 anti-enumeração), `BoardView` filtrado, FDE por tenant | Fase B (auth real) |

> **Nota:** o estado atual do código está aquém deste contrato — a API existente (`api/main.py`) é o console do FDE (humana, sem auth), não há `tenant_id` no `BoardState`, nem escopos ou delegação. O plano acima é o caminho incremental para fechar esse gap.
