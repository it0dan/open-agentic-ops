"""Testes do `SensediaAIGatewayProvider` (D8/D15, Fase B).

Cobre: obtenção de token via OAuth2 client_credentials, chamada ao chat,
degradação graciosa sem credenciais e em falha de chamada. Usa
`httpx.MockTransport` para mockar as chamadas HTTP (sem rede).
"""

import httpx

from open_agentic_ops.providers.ai_gateway import SensediaAIGatewayProvider


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
