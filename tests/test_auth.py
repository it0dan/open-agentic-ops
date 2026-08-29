"""Testes da auth real OAuth2/Keycloak + JWT (D7/D13, Fase B).

Cobre o `JWTScopeProvider`: token válido extrai `client_id` + `tenant_id`,
token inválido/expirado → 401, sem token → client_id vazio, e o enforcement
de escopo por `client_id` do JWT nos endpoints `/oao/*`.

Usa tokens RS256 assinados com uma chave privada local (sem rede/JWKS real),
injetando um `jwt.PyJWKClient` fake que devolve a chave pública correspondente.
"""

import time
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from fastapi.testclient import TestClient

from api.main import create_app
from open_agentic_ops.auth import JWTScopeProvider

# Chave privada RSA de teste (não é secret real — apenas para assinar tokens de teste).
_PRIVATE_PEM = """-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAr/6yOtnDhRiwJe/wAPBPCEgHssgMqnj767v7Qpup1AtwGdPK
vTLZ7Cw4iJVqANsnyLiB3OHuq+ko+YBO3/j9v8sAiSCz0vbRtyzH+DUtx49ya4WJ
dWcB6hwvwWNR50verc+/Gh1GgwJf5ngIz8LZN2Lvvzy5op81y7+Jxe3gjl8xIgTk
3c/yY2knvDAOdj5kYVqaeo771nNIEw5jubWuiNUNIJAYkkvctmZkl7TEM6DnYpm8
MgELjuF7P2XXw1RB3zRdm8eTAFMXpw3IgQ5L62RZkx4xiqs0zUOiZ9vYAC5j2tK4
9lnUWSfrsFGx34Hkwx86l6FOwhXZoIRmAj68vwIDAQABAoIBABAawVprRN3wBWZj
T1X2p3S9ip7MeYQ77+mBWRuePOsfZNGoNLwdZB2dakrtSTbs1vYiFBgPQJTQkCRM
nmsWULn1LIZfzLS4SzZ0zZOj4h2JvdGi9ZIdq+otTB1pJjyBD85d3UHZffNNC1N+
lmfUj6Xm0sNwHhiIcxbC3yuSeeLtIitvPq64dRC3kSEYg8sY8r+5i4js5N/tZij7
+Z0OXy4zBWjBhOsaQb3cTtCb9I6yBJnSn2kPhgEdnIWK/izb4d12sdczRVx0lPMj
Zqx4IqJoCIWhuFEvnW1Xtz86Rn15b4hHxkMruvbAB5V1ua1ljJWlRyiqMtBVFQFf
WioXVNECgYEA1rTvQzbWc/wQIbxzQlTLYCwoS0XXTZunP+aT7soKTxVQp9KPbopA
vDgCF2nVs8USBdoymkdYlW2srL2I0Or1zHzi4ktcViMIaOi+FGfEnzc17dtPVGZr
Bq5dPDIXjiJXbIzT2dClfKOVy9CjFdn7Z51iEt/qCDXCiySeOaZCBBkCgYEA0dfJ
bajju2W9xhEVgf+F+foEtR/z7AHBDrBLDC2yG4KewD1bebmIYVTwi6KiA2JeE3Eg
26pqWP08l2P1tmJ2VTmnyKtW793vOkKASl25jjOTmCunKon6qGx1QDhZMkVRkNKo
Ji62QgDUfXe5O6B5INj94OaSdUTT02UhknM7IpcCgYAuAak/MtHzGnDuea4M6ZSG
sA+WSYngBFlrNOJACaT52yxkOZcobZF/g1TXZYM4OSMqg93R9zXBFzYn8ZkOgzpW
LfCD4vgPMQSNTknkn3OfVjpFFHhEMon+bYBm9KjdePhYtzhx9OZw9bCUcslvVj0r
r6qjNr20MqjUHe2Vls2QiQKBgQCpw8W17divlxP81X1s+mhNYDPGxN71pEWnuIA+
jgl1sCr2o60JwUvQUoN4tE4WJtKtL+zBShFXhSgr4ja7ItVRBZ/z/IoM7KPJoltf
zot7u8ZAabCH/bDH6VbCadPfk6z1WTeoDEpvA3TlPKKi1qSoKmTaOi9qqBAnCb4r
WQYSaQKBgAKHZsJR9t61tv/vtNd0+bG3NGrYGobROoGjXCTHYDkg/KpkQD5zRR11
ySNOa17uf4wuG/bN6v2Rp6zS3lJmYB0/2phARlH4opTDjOKqU8qDctZF1P3AC+5j
DfiJvXZh/QbcFd94hPsZ1zx5+U3+HCmfvWRLhPZ6ljDQayOKvM9P
-----END RSA PRIVATE KEY-----"""


class _FakeJWKClient:
    """Fake do `jwt.PyJWKClient`: devolve a chave pública local (sem rede)."""

    def __init__(self, public_key: Any) -> None:
        self._public_key = public_key

    def get_signing_key_from_jwt(self, token: str) -> Any:
        return _FakeSigningKey(self._public_key)


class _FakeSigningKey:
    def __init__(self, key: Any) -> None:
        self.key = key


def _gerar_token(
    *,
    client_id: str = "oa-intake",
    tenant_id: str = "tenant-a",
    exp: int | None = None,
    issuer: str | None = None,
) -> str:
    now = int(time.time())
    claims: dict[str, Any] = {
        "azp": client_id,
        "tenant_id": tenant_id,
        "iat": now,
        "exp": exp if exp is not None else now + 300,
    }
    if issuer:
        claims["iss"] = issuer
    return jwt.encode(claims, _PRIVATE_PEM, algorithm="RS256")


def _provider(issuer: str | None = None) -> JWTScopeProvider:
    private_key = serialization.load_pem_private_key(_PRIVATE_PEM.encode(), password=None)
    public_key = private_key.public_key()
    return JWTScopeProvider(
        jwks_url="",
        issuer=issuer,
        jwks_client=_FakeJWKClient(public_key),
    )


def _client(provider: JWTScopeProvider) -> TestClient:
    return TestClient(create_app(scope_provider=provider))


def test_token_valido_extrai_client_id_e_tenant():
    provider = _provider()
    token = _gerar_token(client_id="oa-intake", tenant_id="tenant-a")

    class _Req:
        headers = {"Authorization": f"Bearer {token}"}

    assert provider.client_id(_Req()) == "oa-intake"
    assert provider.tenant_id(_Req()) == "tenant-a"


def test_sem_token_client_id_vazio():
    provider = _provider()

    class _Req:
        headers = {}

    assert provider.client_id(_Req()) == ""
    assert provider.tenant_id(_Req()) == "default"


def test_token_invalido_retorna_401():
    provider = _provider()

    class _Req:
        headers = {"Authorization": "Bearer token-invalido"}

    with pytest.raises(Exception) as exc:
        provider.client_id(_Req())
    assert exc.value.status_code == 401


def test_token_expirado_retorna_401():
    provider = _provider()
    token = _gerar_token(exp=int(time.time()) - 100)

    class _Req:
        headers = {"Authorization": f"Bearer {token}"}

    with pytest.raises(Exception) as exc:
        provider.client_id(_Req())
    assert exc.value.status_code == 401


def test_endpoint_com_jwt_valido_responde_200():
    provider = _provider()
    token = _gerar_token(client_id="oa-intake", tenant_id="tenant-a")
    with _client(provider) as c:
        r = c.post(
            "/oao/intake/chat/completions",
            headers={"Authorization": f"Bearer {token}"},
            json={"messages": [{"role": "user", "content": "Adicionar botão no dashboard."}]},
        )
    assert r.status_code == 200
    assert "tenant-a" in r.json()["choices"][0]["message"]["content"]


def test_endpoint_escopo_negado_retorna_403():
    provider = _provider()
    # oa-review não tem board:write (escopo requerido pelo intake)
    token = _gerar_token(client_id="oa-review", tenant_id="tenant-a")
    with _client(provider) as c:
        r = c.post(
            "/oao/intake/chat/completions",
            headers={"Authorization": f"Bearer {token}"},
            json={"messages": [{"role": "user", "content": "x"}]},
        )
    assert r.status_code == 403


def test_endpoint_sem_token_retorna_403():
    provider = _provider()
    with _client(provider) as c:
        r = c.post(
            "/oao/intake/chat/completions",
            json={"messages": [{"role": "user", "content": "x"}]},
        )
    assert r.status_code == 403
