"""Heurística de triagem do Intake (RF-1).

Classificação determinística de `dominio` e `ambiguidade` a partir do texto da
demanda. A heurística é realimentada prospectivamente pela auditoria do FDE
(ADR-0006/RNF-6) — nunca reabre implementação já feita.
"""

from __future__ import annotations

from open_agentic_ops.state import Ambiguidade, Dominio

_PALAVRAS_BACKEND = {
    "api",
    "contrato",
    "endpoint",
    "servidor",
    "integracao",
    "webhook",
    "schema",
    "banco",
    "dados",
    "consignado",
    "portabilidade",
    "manual de escopo",
    "instrucao normativa",
    "bcb",
    "bacen",
    "fapi",
    "oauth",
    "token",
}

_PALAVRAS_FRONTEND = {
    "interface",
    "tela",
    "componente",
    "ux",
    "ui",
    "formulario",
    "dashboard",
    "frontend",
    "visual",
    "layout",
}

_PALAVRAS_ALTA_AMBIGUIDADE = {
    "contrato externo",
    "compliance",
    "regulatorio",
    "instrucao normativa",
    "nova norma",
    "lei",
    "lgpd",
    "fapi-br",
    "seguranca",
    "portabilidade",
    "novo campo",
    "sem precedente",
}


def classificar_dominio(texto: str) -> Dominio:
    """Classifica o domínio (backend/frontend/ambos) pela presença de termos."""
    t = texto.lower()
    backend = any(p in t for p in _PALAVRAS_BACKEND)
    frontend = any(p in t for p in _PALAVRAS_FRONTEND)
    if backend and frontend:
        return "ambos"
    if backend:
        return "backend"
    if frontend:
        return "frontend"
    return "ambos"


def classificar_ambiguidade(texto: str) -> Ambiguidade:
    """Classifica a ambiguidade (baixa/alta) pela presença de termos de risco."""
    t = texto.lower()
    if any(p in t for p in _PALAVRAS_ALTA_AMBIGUIDADE):
        return "alta"
    return "baixa"
