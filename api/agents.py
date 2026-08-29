"""Superfície de integração externa por agente (D4/D5, Camada 1).

Endpoints OpenAI-compatíveis `/oao/<agent>/chat/completions` para os 7 agentes.
Na Camada 1 (harness, sem infra), cada endpoint traduz a mensagem para um
`BoardState` mínimo e invoca a factory do nó correspondente de forma isolada —
sem auth real (JWT/Keycloak fica para a Camada 2).

Autorização por escopo via `require_scope`, validando o `client_id` do
`ScopeProvider` contra `ESCOPOS_POR_CLIENT_ID` (403 se negado). A delegação
`act` entra como metadado de contexto auditável e **não** altera o tenant
efetivo (ADR-0015).
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, Protocol

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from open_agentic_ops.nodes.architecture_node import make_architecture_node
from open_agentic_ops.nodes.feature_node import make_feature_node
from open_agentic_ops.nodes.intake_node import make_intake_node
from open_agentic_ops.nodes.platform_node import make_platform_node
from open_agentic_ops.nodes.review_node import make_review_node
from open_agentic_ops.nodes.sre_node import make_sre_node
from open_agentic_ops.ports import LLMProviderPort
from open_agentic_ops.scopes import TENANT_DEFAULT, tem_escopo
from open_agentic_ops.state import BoardState, Dominio

router = APIRouter(prefix="/oao", tags=["oao"])


class ScopeProvider(Protocol):
    """Fonte de `client_id`/`tenant_id` da requisição (Camada 1: mock)."""

    def client_id(self, request: Request) -> str: ...
    def tenant_id(self, request: Request) -> str: ...


class HeaderScopeProvider:
    """Provider mock (Camada 1): lê `client_id`/`tenant_id` de headers.

    Sem auth real — apenas para testes e desenvolvimento. A Camada 2 substitui
    por decodificação de JWT (Keycloak), mantendo a mesma interface.
    """

    def client_id(self, request: Request) -> str:
        return request.headers.get("X-OAO-Client-Id", "")

    def tenant_id(self, request: Request) -> str:
        return request.headers.get("X-OAO-Tenant-Id", TENANT_DEFAULT)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionsBody(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    act: str | None = None


def _ultima_mensagem(body: ChatCompletionsBody) -> str:
    return body.messages[-1].content


def _invocar_intake(
    body: ChatCompletionsBody, tenant_id: str, llm: LLMProviderPort | None
) -> BoardState:
    node = make_intake_node()
    estado: BoardState = {
        "tenant_id": tenant_id,
        "origem": "cliente",
        "spec": _ultima_mensagem(body),
    }
    return node(estado)


def _invocar_feature(
    dominio: Dominio,
) -> Callable[[ChatCompletionsBody, str, LLMProviderPort | None], BoardState]:
    def _invoke(
        body: ChatCompletionsBody, tenant_id: str, llm: LLMProviderPort | None
    ) -> BoardState:
        node = make_feature_node(dominio, llm=llm)
        estado: BoardState = {
            "tenant_id": tenant_id,
            "spec": _ultima_mensagem(body),
        }
        return node(estado)

    return _invoke


def _invocar_platform(
    body: ChatCompletionsBody, tenant_id: str, llm: LLMProviderPort | None
) -> BoardState:
    node = make_platform_node()
    estado: BoardState = {
        "tenant_id": tenant_id,
        "worktrees": [
            {
                "dominio": "backend",
                "guia": "backend",
                "branch": "feat/backend",
                "status": "implementado",
                "resultado": None,
                "iteracoes": None,
                "historico": None,
            }
        ],
    }
    return node(estado)


def _invocar_review(
    body: ChatCompletionsBody, tenant_id: str, llm: LLMProviderPort | None
) -> BoardState:
    node = make_review_node()
    estado: BoardState = {
        "tenant_id": tenant_id,
        "spec": _ultima_mensagem(body),
        "worktrees": [
            {
                "dominio": "backend",
                "guia": "backend",
                "branch": "feat/backend",
                "status": "implementado",
                "resultado": _ultima_mensagem(body),
                "iteracoes": 1,
                "historico": None,
            }
        ],
    }
    return node(estado)


def _invocar_architecture(
    body: ChatCompletionsBody, tenant_id: str, llm: LLMProviderPort | None
) -> BoardState:
    node = make_architecture_node()
    estado: BoardState = {
        "tenant_id": tenant_id,
        "spec": _ultima_mensagem(body),
    }
    return node(estado)


def _invocar_sre(
    body: ChatCompletionsBody, tenant_id: str, llm: LLMProviderPort | None
) -> BoardState:
    node = make_sre_node()
    estado: BoardState = {
        "tenant_id": tenant_id,
        "origem": "sre",
        "spec": _ultima_mensagem(body),
    }
    return node(estado)


# Mapeamento agente → (client_id, escopo requerido, invocador do nó).
AGENTES: dict[str, dict[str, Any]] = {
    "intake": {
        "client_id": "oa-intake",
        "escopo": "board:write",
        "invocar": _invocar_intake,
    },
    "feature-backend": {
        "client_id": "oa-feature-backend",
        "escopo": "repo:write",
        "invocar": _invocar_feature("backend"),
    },
    "feature-frontend": {
        "client_id": "oa-feature-frontend",
        "escopo": "repo:write",
        "invocar": _invocar_feature("frontend"),
    },
    "platform": {
        "client_id": "oa-platform",
        "escopo": "test:run",
        "invocar": _invocar_platform,
    },
    "review": {
        "client_id": "oa-review",
        "escopo": "pr:comment",
        "invocar": _invocar_review,
    },
    "architecture": {
        "client_id": "oa-architecture",
        "escopo": "adr:write",
        "invocar": _invocar_architecture,
    },
    "sre": {
        "client_id": "oa-sre",
        "escopo": "slo:read",
        "invocar": _invocar_sre,
    },
}


def require_scope(escopo: str) -> Callable[[Request], None]:
    """Dependency FastAPI: valida o escopo do `client_id` (403 se negado).

    O `ScopeProvider` é lido de `request.app.state.scope_provider` (registrado
    em `create_app`), permitindo trocar o provider mockado por JWT na Camada 2
    sem alterar os endpoints.
    """

    def _depend(request: Request) -> None:
        provider: ScopeProvider = request.app.state.scope_provider
        client_id = provider.client_id(request)
        if not client_id or not tem_escopo(client_id, escopo):
            raise HTTPException(status_code=403, detail="escopo negado")

    return _depend


def _resposta_openai(agent: str, estado: dict) -> dict:
    """Envolve o resultado do nó no shape OpenAI-compatível."""
    return {
        "id": f"chatcmpl-{agent}",
        "object": "chat.completion",
        "model": f"oao/{agent}",
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": str(estado)},
                "finish_reason": "stop",
            }
        ],
    }


def _registrar_endpoint(agent: str, spec: dict[str, Any]) -> None:
    """Registra o endpoint `/oao/<agent>/chat/completions` no router."""

    @router.post(f"/{agent}/chat/completions")
    def chat_completions(
        body: ChatCompletionsBody,
        request: Request,
        _: None = Depends(require_scope(spec["escopo"])),
    ) -> dict:
        provider: ScopeProvider = request.app.state.scope_provider
        tenant_id = provider.tenant_id(request)
        llm: LLMProviderPort | None = getattr(request.app.state, "llm_por_agente", {}).get(agent)
        estado = spec["invocar"](body, tenant_id, llm)
        estado["tenant_id"] = tenant_id
        if body.act:
            estado["act"] = body.act
        return _resposta_openai(agent, estado)


for _agent, _spec in AGENTES.items():
    _registrar_endpoint(_agent, _spec)
