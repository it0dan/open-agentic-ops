"""Matriz de escopos da superfície de integração externa (D3).

Fonte única de verdade da autorização por `client_id`, espelhando o contrato em
`Inicio/definicoes/oao-endpoints-and-scopes.md`. Declarativa e testável — sem
lógica de autorização espalhada.

Regras transversais (ADR-0006/0015):
- `pii:raw` é negado a todos — nunca aparece em `ESCOPOS_POR_CLIENT_ID`.
- `deploy:execute` só pós-Eval (gate) e `pr:merge` exclusivo do FDE — restrições
  de processo, não apenas de escopo; aqui apenas se declara quem pode.
"""

from __future__ import annotations

TENANT_DEFAULT = "default"

ESCOPOS_POR_CLIENT_ID: dict[str, set[str]] = {
    "oa-intake": {
        "board:read",
        "board:write",
        "spec:draft",
        "precedent:search",
        "pii:mask",
    },
    "oa-feature-backend": {
        "repo:read",
        "repo:write",
        "platform:invoke",
        "architecture:consult",
        "spec:read",
    },
    "oa-feature-frontend": {
        "repo:read",
        "repo:write",
        "platform:invoke",
        "spec:read",
    },
    "oa-platform": {
        "ci:run",
        "lint:run",
        "test:run",
        "deploy:execute",
        "obs:read",
        "artifact:write",
    },
    "oa-review": {
        "pr:read",
        "pr:comment",
        "board:read",
    },
    "oa-architecture": {
        "contract:read",
        "adr:write",
        "board:read",
    },
    "oa-sre": {
        "obs:read",
        "slo:read",
        "board:write",
    },
}

# Escopos que nenhum client_id pode possuir (defesa por construção).
ESCOPOS_NEGADOS: frozenset[str] = frozenset({"pii:raw"})


def escopos_do_client(client_id: str) -> set[str]:
    """Retorna os escopos concedidos a um `client_id` (vazio se desconhecido)."""
    return set(ESCOPOS_POR_CLIENT_ID.get(client_id, set()))


def tem_escopo(client_id: str, escopo: str) -> bool:
    """True se o `client_id` possui o escopo e ele não é negado."""
    if escopo in ESCOPOS_NEGADOS:
        return False
    return escopo in escopos_do_client(client_id)
