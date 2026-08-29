"""Testes do `SensediaAIGatewayProvider` (D8/D15, Fase B).

Cobre: obtenção de token via OAuth2 client_credentials, chamada ao chat,
degradação graciosa sem credenciais e em falha de chamada, e o modo
multi-agente (`provider_para`/`mapa_por_agente`). Usa `httpx.MockTransport`
para mockar as chamadas HTTP (sem rede).
"""

import httpx

from open_agentic_ops.providers.ai_gateway import (
    AGENTES_LLM,
    SensediaAIGatewayProvider,
)


def _provider_com_transporte(handler) -> SensediaAIGatewayProvider:
    transport = httpx.MockTransport(handler)
    return SensediaAIGatewayProvider(
        oauth_endpoint="https://auth.example/token",
        client_id="oa-intake",
        client_secret="secret",
        chat_endpoint="https://gateway.example/chat/completions",
        model="oao/test",
        client=httpx.Client(transport=transport),
    )


def test_sem_credenciais_degrada_para_fallback():
    provider = SensediaAIGatewayProvider(
        oauth_endpoint="",
        client_id="",
        client_secret="",
        chat_endpoint="",
    )
    resultado = provider.invoke("Implementar feature X")
    assert resultado.startswith("[implementado]")


def test_obtem_token_e_chama_chat():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/token":
            return httpx.Response(200, json={"access_token": "tok-123"})
        if request.url.path == "/chat/completions":
            assert request.headers["Authorization"] == "Bearer tok-123"
            return httpx.Response(
                200,
                json={"choices": [{"message": {"content": "resposta do gateway"}}]},
            )
        return httpx.Response(404)

    provider = _provider_com_transporte(handler)
    resultado = provider.invoke("Implementar feature X", system="seja conciso")
    assert resultado == "resposta do gateway"


def test_falha_na_chamada_degrada_para_fallback():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="erro")

    provider = _provider_com_transporte(handler)
    resultado = provider.invoke("Implementar feature X")
    assert resultado.startswith("[implementado]")


def test_falha_no_token_degrada_para_fallback():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, text="unauthorized")

    provider = _provider_com_transporte(handler)
    resultado = provider.invoke("Implementar feature X")
    assert resultado.startswith("[implementado]")


def test_mapa_por_agente_cobre_todos_os_agentes():
    provider = SensediaAIGatewayProvider(
        oauth_endpoint="https://auth.example/token",
        client_id="",
        client_secret="",
        chat_endpoint="",
    )
    mapa = provider.mapa_por_agente()
    assert set(mapa.keys()) == set(AGENTES_LLM)


def test_provider_para_agente_sem_credenciais_degrada(monkeypatch):
    provider = SensediaAIGatewayProvider(
        oauth_endpoint="https://auth.example/token",
        client_id="",
        client_secret="",
        chat_endpoint="",
    )
    for var in (
        "AI_GATEWAY_FEATURE_BACKEND_CLIENT_ID",
        "AI_GATEWAY_FEATURE_BACKEND_CLIENT_SECRET",
        "AI_GATEWAY_FEATURE_BACKEND_CHAT_ENDPOINT",
    ):
        monkeypatch.delenv(var, raising=False)
    sub = provider.provider_para("feature-backend")
    assert sub.invoke("Implementar feature X").startswith("[implementado]")


def test_provider_para_agente_usa_credenciais_do_agente(monkeypatch):
    monkeypatch.setenv("AI_GATEWAY_FEATURE_BACKEND_CLIENT_ID", "oa-feature-backend")
    monkeypatch.setenv("AI_GATEWAY_FEATURE_BACKEND_CLIENT_SECRET", "secret-b")
    monkeypatch.setenv(
        "AI_GATEWAY_FEATURE_BACKEND_CHAT_ENDPOINT",
        "https://gateway.example/chat/completions",
    )

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/token":
            return httpx.Response(200, json={"access_token": "tok-b"})
        if request.url.path == "/chat/completions":
            assert request.headers["Authorization"] == "Bearer tok-b"
            return httpx.Response(
                200,
                json={"choices": [{"message": {"content": "resposta backend"}}]},
            )
        return httpx.Response(404)

    provider = SensediaAIGatewayProvider(
        oauth_endpoint="https://auth.example/token",
        client_id="",
        client_secret="",
        chat_endpoint="",
        client=httpx.Client(transport=httpx.MockTransport(handler)),
    )
    sub = provider.provider_para("feature-backend")
    assert sub.invoke("Implementar feature X") == "resposta backend"


def test_provider_para_agente_sem_credenciais_nao_afeta_outros(monkeypatch):
    monkeypatch.setenv("AI_GATEWAY_FEATURE_BACKEND_CLIENT_ID", "oa-feature-backend")
    monkeypatch.setenv("AI_GATEWAY_FEATURE_BACKEND_CLIENT_SECRET", "secret-b")
    monkeypatch.setenv(
        "AI_GATEWAY_FEATURE_BACKEND_CHAT_ENDPOINT",
        "https://gateway.example/chat/completions",
    )
    for var in (
        "AI_GATEWAY_FEATURE_FRONTEND_CLIENT_ID",
        "AI_GATEWAY_FEATURE_FRONTEND_CLIENT_SECRET",
        "AI_GATEWAY_FEATURE_FRONTEND_CHAT_ENDPOINT",
    ):
        monkeypatch.delenv(var, raising=False)

    provider = SensediaAIGatewayProvider(
        oauth_endpoint="https://auth.example/token",
        client_id="",
        client_secret="",
        chat_endpoint="",
    )
    backend = provider.provider_para("feature-backend")
    frontend = provider.provider_para("feature-frontend")
    assert backend._client_id == "oa-feature-backend"
    assert frontend._client_id == ""
