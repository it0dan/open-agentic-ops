"""Guia (ADR-0011).

O Guia é o skill de domínio (feedforward) que parametriza o `feature_node` — a
única diferença entre as instâncias backend e frontend. Não é um agente novo;
é uma skill (SKILL.md) carregada pelo nó e injetada no system prompt.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from open_agentic_ops.state import Dominio


@dataclass(frozen=True)
class Guia:
    dominio: Dominio
    nome: str
    system_prompt: str


_DEFAULT_BACKEND = (
    "Você é o Feature Agent de backend da squad Open Agentic Ops. "
    "Implemente a feature no domínio backend seguindo a spec aprovada, "
    "respeitando o perfil de segurança do Open Finance (FAPI-BR) e a LGPD. "
    "PII nunca deve ser manipulada em claro."
)

_DEFAULT_FRONTEND = (
    "Você é o Feature Agent de frontend da squad Open Agentic Ops. "
    "Implemente a feature no domínio frontend seguindo a spec aprovada, "
    "respeitando o perfil de segurança do Open Finance (FAPI-BR) e a LGPD. "
    "PII nunca deve ser manipulada em claro."
)


def carregar_guia(dominio: Dominio, skill_dir: Path | None = None) -> Guia:
    """Carrega o Guia para um domínio.

    Se `skill_dir` apontar para uma skill (SKILL.md), o conteúdo é injetado no
    system prompt; caso contrário, usa o prompt padrão do domínio.
    """
    if dominio == "backend":
        nome, base = "backend", _DEFAULT_BACKEND
    elif dominio == "frontend":
        nome, base = "frontend", _DEFAULT_FRONTEND
    else:
        nome, base = "fullstack", _DEFAULT_BACKEND + "\n" + _DEFAULT_FRONTEND

    if skill_dir is not None:
        skill_file = Path(skill_dir) / "SKILL.md"
        if skill_file.exists():
            base = f"{base}\n\n---\n{skill_file.read_text(encoding='utf-8')}"

    return Guia(dominio=dominio, nome=nome, system_prompt=base)
