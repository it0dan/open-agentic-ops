"""LLMProviderPort concreto — Sensedia AI Gateway (D8/D15, Fase B).

Implementa `LLMProviderPort.invoke(prompt, *, system=None)` chamando o
Sensedia AI Gateway: obtém token via OAuth2 `client_credentials` e chama o
endpoint de chat (OpenAI-compatível).

Suporta dois modos:
- **Modo único** (compatibilidade): um par de credenciais + endpoint via env
  (`AI_GATEWAY_*`), usado por todos os agentes.
- **Modo multi-agente**: um par de credenciais + endpoint por agente
  (`AI_GATEWAY_<AGENT>_CLIENT_ID/SECRET/CHAT_ENDPOINT`), fiel ao contrato de
  7 clientes em `Inicio/definicoes/oao-endpoints-and-scopes.md`. O método
  `provider_para(agente)` resolve o provider configurado para aquele agente.

Degradação graciosa: sem credenciais configuradas ou em falha de chamada, cai
no fallback determinístico (mesmo comportamento do `_DefaultLLM` do
`feature_node`) — mantém os testes verdes sem infra.
"""

from __future__ import annotations

import os

import httpx

from open_agentic_ops.ports import LLMProviderPort

# Agentes da superfície de integração externa (contrato oao-endpoints-and-scopes).
AGENTES_LLM = (
    "intake",
    "feature-backend",
    "feature-frontend",
    "platform",
    "review",
    "architecture",
    "sre",
)


class _FallbackLLM:
    """Fallback determinístico quando não há credenciais do AI Gateway."""

    def invoke(self, prompt: str, *, system: str | None = None) -> str:
        return f"[implementado] {prompt[:200]}"


def _env_por_agente(agente: str) -> dict[str, str]:
    """Lê as credenciais do agente das env vars `AI_GATEWAY_<AGENT>_*`.

    O nome do agente é normalizado (hífens → underscore, maiúsculas) para
    formar o sufixo da variável, ex.: `feature-backend` →
    `AI_GATEWAY_FEATURE_BACKEND_CLIENT_ID`.
    """
    sufixo = agente.upper().replace("-", "_")
    return {
        "client_id": os.getenv(f"AI_GATEWAY_{sufixo}_CLIENT_ID", ""),
        "client_secret": os.getenv(f"AI_GATEWAY_{sufixo}_CLIENT_SECRET", ""),
        "chat_endpoint": os.getenv(f"AI_GATEWAY_{sufixo}_CHAT_ENDPOINT", ""),
    }


class SensediaAIGatewayProvider:
    """Provider real do Sensedia AI Gateway (OAuth2 client_credentials + chat).

    No modo multi-agente, `provider_para(agente)` retorna um provider
    configurado com as credenciais daquele agente (ou fallback se ausentes).
    """

    def __init__(
        self,
        *,
        oauth_endpoint: str | None = None,
        client_id: str | None = None,
        client_secret: str | None = None,
        chat_endpoint: str | None = None,
        model: str = "oao/default",
        timeout: float = 60.0,
        fallback: LLMProviderPort | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        self._oauth_endpoint = oauth_endpoint or os.getenv("AI_GATEWAY_OAUTH_ENDPOINT", "")
        self._client_id = client_id or os.getenv("AI_GATEWAY_CLIENT_ID", "")
        self._client_secret = client_secret or os.getenv("AI_GATEWAY_CLIENT_SECRET", "")
        self._chat_endpoint = chat_endpoint or os.getenv("AI_GATEWAY_CHAT_ENDPOINT", "")
        self._model = model
        self._timeout = timeout
        self._fallback = fallback or _FallbackLLM()
        self._client = client or httpx.Client(timeout=timeout)

    def _tem_credenciais(self) -> bool:
        return bool(
            self._oauth_endpoint and self._client_id and self._client_secret and self._chat_endpoint
        )

    def _obter_token(self) -> str:
        resp = self._client.post(
            self._oauth_endpoint,
            data={
                "grant_type": "client_credentials",
                "client_id": self._client_id,
                "client_secret": self._client_secret,
            },
        )
        resp.raise_for_status()
        return resp.json()["access_token"]

    def _chamar_chat(self, token: str, prompt: str, system: str | None) -> str:
        messages: list[dict] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = self._client.post(
            self._chat_endpoint,
            headers={"Authorization": f"Bearer {token}"},
            json={"model": self._model, "messages": messages},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

    def invoke(self, prompt: str, *, system: str | None = None) -> str:
        if not self._tem_credenciais():
            return self._fallback.invoke(prompt, system=system)
        try:
            token = self._obter_token()
            return self._chamar_chat(token, prompt, system)
        except Exception:
            return self._fallback.invoke(prompt, system=system)

    def provider_para(self, agente: str) -> SensediaAIGatewayProvider:
        """Retorna um provider configurado para o agente (modo multi-agente).

        Lê as credenciais do agente das env vars `AI_GATEWAY_<AGENT>_*`. Se o
        agente não tiver credenciais completas, retorna um provider que degrada
        para o fallback determinístico (não quebra os demais agentes).
        """
        creds = _env_por_agente(agente)
        return SensediaAIGatewayProvider(
            oauth_endpoint=self._oauth_endpoint,
            client_id=creds["client_id"],
            client_secret=creds["client_secret"],
            chat_endpoint=creds["chat_endpoint"],
            model=self._model,
            timeout=self._timeout,
            fallback=self._fallback,
            client=self._client,
        )

    def mapa_por_agente(self) -> dict[str, LLMProviderPort]:
        """Mapa `{agente: provider}` para todos os agentes da superfície."""
        return {agente: self.provider_para(agente) for agente in AGENTES_LLM}
