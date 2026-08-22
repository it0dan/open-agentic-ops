"""Redação PII na fronteira de entrada (ADR-0006/0012).

Combina a skill `pii-sanitizer` (guia/feedforward) com este módulo de redação
determinístico (ferramenta). Ancorado em classificação LGPD (dado pessoal vs.
sensível) e informado pelo perfil de segurança do Open Finance (FAPI-BR):
claim `sub` quando identifica pessoa, claims OIDC (data de nascimento, endereço,
telefone), CPF, CNPJ.

Regra mais robusta: PII raw nunca entra no sistema — mascarada na entrada, as
demais fronteiras (comunicação, checkpointer, telemetria, evals, logs) herdam a
proteção.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Any


class CategoriaPII(str, Enum):
    """Classificação LGPD: dado pessoal vs. dado sensível."""

    PESSOAL = "pessoal"
    SENSIVEL = "sensivel"


@dataclass(frozen=True)
class PadraoPII:
    categoria: CategoriaPII
    rotulo: str
    regex: re.Pattern[str]
    substituicao: str


_CPF = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")
_CNPJ = re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b")
_EMAIL = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_TELEFONE = re.compile(r"(?:\+?55[\s-]?)?(?:\(?\d{2}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}\b")
_DATA_NASC = re.compile(r"\b\d{2}/\d{2}/\d{4}\b")
_CEP = re.compile(r"\b\d{5}-?\d{3}\b")


PADROES: tuple[PadraoPII, ...] = (
    PadraoPII(CategoriaPII.SENSIVEL, "CPF", _CPF, "[CPF]"),
    PadraoPII(CategoriaPII.SENSIVEL, "CNPJ", _CNPJ, "[CNPJ]"),
    PadraoPII(CategoriaPII.PESSOAL, "EMAIL", _EMAIL, "[EMAIL]"),
    PadraoPII(CategoriaPII.PESSOAL, "TELEFONE", _TELEFONE, "[TELEFONE]"),
    PadraoPII(CategoriaPII.SENSIVEL, "DATA_NASCIMENTO", _DATA_NASC, "[DATA_NASC]"),
    PadraoPII(CategoriaPII.PESSOAL, "CEP", _CEP, "[CEP]"),
)


def redigir_texto(texto: str) -> str:
    """Mascara PII em texto livre, substituindo por rótulos determinísticos."""
    resultado = texto
    for padrao in PADROES:
        resultado = padrao.regex.sub(padrao.substituicao, resultado)
    return resultado


def _redigir_valor(valor: Any) -> Any:
    if isinstance(valor, str):
        return redigir_texto(valor)
    if isinstance(valor, list):
        return [_redigir_valor(v) for v in valor]
    if isinstance(valor, dict):
        return {k: _redigir_valor(v) for k, v in valor.items()}
    return valor


def sanitizar_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Sanitiza um payload recursivamente para checkpointer/telemetria/logs."""
    return _redigir_valor(payload)


def detectar_pii(texto: str) -> list[tuple[CategoriaPII, str]]:
    """Retorna as categorias de PII encontradas (para auditoria/classificação)."""
    encontradas: list[tuple[CategoriaPII, str]] = []
    for padrao in PADROES:
        if padrao.regex.search(texto):
            encontradas.append((padrao.categoria, padrao.rotulo))
    return encontradas
