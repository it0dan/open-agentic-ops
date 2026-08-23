"""Heurística de triagem do Intake (RF-1).

Classificação determinística de `dominio` e `ambiguidade` a partir do texto da
demanda. A heurística é realimentada prospectivamente pela auditoria do FDE
(ADR-0006/RNF-6) — nunca reabre implementação já feita.

A heurística é mutável: carregada de uma fonte (JSON) que o FDE pode corrigir
via `POST /auditoria/heuristica`. As funções de classificação retornam também a
justificativa (palavras-chave que motivaram a classificação) para auditoria.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from open_agentic_ops.state import Ambiguidade, Dominio

_DEFAULT_HEURISTICA_PATH = Path(__file__).resolve().parent / "heuristica.json"


@dataclass
class Heuristica:
    """Conjunto de palavras-chave que guiam a triagem do Intake."""

    backend: set[str] = field(
        default_factory=lambda: {
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
    )
    frontend: set[str] = field(
        default_factory=lambda: {
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
    )
    alta_ambiguidade: set[str] = field(
        default_factory=lambda: {
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
    )


def _serializar(h: Heuristica) -> dict:
    return {
        "backend": sorted(h.backend),
        "frontend": sorted(h.frontend),
        "alta_ambiguidade": sorted(h.alta_ambiguidade),
    }


def _desserializar(d: dict) -> Heuristica:
    return Heuristica(
        backend=set(d.get("backend", [])),
        frontend=set(d.get("frontend", [])),
        alta_ambiguidade=set(d.get("alta_ambiguidade", [])),
    )


def carregar_heuristica(path: Path | None = None) -> Heuristica:
    """Carrega a heurística de uma fonte JSON mutável (default: heuristica.json)."""
    p = path or _DEFAULT_HEURISTICA_PATH
    if p.exists():
        try:
            return _desserializar(json.loads(p.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, TypeError):
            return Heuristica()
    return Heuristica()


def salvar_heuristica(h: Heuristica, path: Path | None = None) -> None:
    """Persiste a heurística na fonte JSON."""
    p = path or _DEFAULT_HEURISTICA_PATH
    p.write_text(
        json.dumps(_serializar(h), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def classificar_dominio(
    texto: str, heuristica: Heuristica | None = None
) -> tuple[Dominio, list[str]]:
    """Classifica o domínio e retorna as palavras-chave que motivaram."""
    h = heuristica or carregar_heuristica()
    t = texto.lower()
    backend_hits = [p for p in h.backend if p in t]
    frontend_hits = [p for p in h.frontend if p in t]
    if backend_hits and frontend_hits:
        return "ambos", backend_hits + frontend_hits
    if backend_hits:
        return "backend", backend_hits
    if frontend_hits:
        return "frontend", frontend_hits
    return "ambos", []


def classificar_ambiguidade(
    texto: str, heuristica: Heuristica | None = None
) -> tuple[Ambiguidade, list[str]]:
    """Classifica a ambiguidade e retorna as palavras-chave que motivaram."""
    h = heuristica or carregar_heuristica()
    t = texto.lower()
    hits = [p for p in h.alta_ambiguidade if p in t]
    if hits:
        return "alta", hits
    return "baixa", []
