"""Matriz de autonomia por etapa (ADR-0025).

Define, para cada etapa do fluxo, o nível de autonomia do agente:

- `humano`   — pausa via `interrupt()` e exige aprovação do FDE (HITL).
- `llm_judge`— LLM-as-a-judge avalia o raciocínio (fase 2; por ora fallback
               determinístico que aprova).
- `autonomo` — o agente prossegue sem pausa.

A matriz é o ponto único de configuração da evolução de autonomia: do menos
crítico ao mais crítico, etapas podem migrar de `humano` → `llm_judge` →
`autonomo` sem alterar o grafo.
"""

from __future__ import annotations

from typing import Literal

Autonomia = Literal["humano", "llm_judge", "autonomo"]

MATRIZ_AUTONOMIA: dict[str, Autonomia] = {
    "intake": "humano",
    "feature": "humano",
    "platform": "humano",
    "review": "humano",
    "architecture": "humano",
    "deploy": "humano",
    "sre": "humano",
}


def autonomia_da_etapa(etapa: str) -> Autonomia:
    """Retorna o nível de autonomia configurado para a etapa (default `humano`)."""
    return MATRIZ_AUTONOMIA.get(etapa, "humano")
