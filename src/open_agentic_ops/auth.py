"""Auth real OAuth2/Keycloak + JWT (D7/D13/D14, Fase B).

Substitui o `HeaderScopeProvider` mockado (Camada 1) por validação real de
Bearer token JWT emitido pelo Keycloak (realm único, assinatura via JWKS).
Extrai `client_id` e claim `tenant_id` do token como única fonte de verdade
(ADR-0015).

O `JWTScopeProvider` implementa a mesma interface `ScopeProvider` de
`api/agents.py` (`client_id(request)`/`tenant_id(request)`), permitindo trocar
o provider sem alterar os endpoints.
"""

from __future__ import annotations

import os
from typing import Any

import jwt
from fastapi import HTTPException, Request

from open_agentic_ops.scopes import TENANT_DEFAULT


class JWTScopeProvider:
    """Provider real (Camada 2): valida Bearer token JWT via JWKS.

    Lê o token do header `Authorization: Bearer <token>`, valida assinatura,
    expiração e issuer, e extrai `client_id` (claim `azp` ou `client_id`) e
    claim `tenant_id`. Sem token válido, `client_id`/`tenant_id` retornam vazio
    (o `require_scope` responde 403/401).
    """

    def __init__(
        self,
        *,
        jwks_url: str | None = None,
        issuer: str | None = None,
        audience: str | None = None,
        jwks_client: Any | None = None,
    ) -> None:
        self._jwks_url = jwks_url or os.getenv("KEYCLOAK_JWKS_URL", "")
        self._issuer = issuer or os.getenv("KEYCLOAK_ISSUER", "")
        self._audience = audience
        self._jwks_client = jwks_client or (
            jwt.PyJWKClient(self._jwks_url) if self._jwks_url else None
        )

    def _decode(self, token: str) -> dict[str, Any]:
        if not self._jwks_client:
            raise HTTPException(status_code=401, detail="JWKS não configurado")

        options: dict[str, Any] = {"verify_signature": True, "verify_exp": True}
        if self._issuer:
            options["verify_iss"] = True
        if self._audience:
            options["verify_aud"] = True
        else:
            options["verify_aud"] = False

        try:
            signing_key = self._jwks_client.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=self._issuer or None,
                audience=self._audience,
                options=options,
            )
        except jwt.ExpiredSignatureError as exc:
            raise HTTPException(status_code=401, detail="token expirado") from exc
        except jwt.InvalidTokenError as exc:
            raise HTTPException(status_code=401, detail="token inválido") from exc

    def _extrair_client_id(self, claims: dict[str, Any]) -> str:
        return str(claims.get("azp") or claims.get("client_id") or "")

    def _extrair_tenant_id(self, claims: dict[str, Any]) -> str:
        return str(claims.get("tenant_id") or TENANT_DEFAULT)

    def _token_da_request(self, request: Request) -> str:
        auth = request.headers.get("Authorization", "")
        if not auth.lower().startswith("bearer "):
            return ""
        return auth[7:].strip()

    def client_id(self, request: Request) -> str:
        token = self._token_da_request(request)
        if not token:
            return ""
        claims = self._decode(token)
        return self._extrair_client_id(claims)

    def tenant_id(self, request: Request) -> str:
        token = self._token_da_request(request)
        if not token:
            return TENANT_DEFAULT
        claims = self._decode(token)
        return self._extrair_tenant_id(claims)


def get_current_tenant(request: Request) -> str:
    """Dependency FastAPI: retorna o `tenant_id` do JWT (ADR-0015).

    Usada nos endpoints que tocam o board (Fase C). Nesta Fase B, o tenant já
    é extraído no `JWTScopeProvider`; esta dependency formaliza o acesso para
    a Fase C (isolamento por tenant).
    """
    provider = request.app.state.scope_provider
    return provider.tenant_id(request)
