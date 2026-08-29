"""Nó Feature genérico (RF-3, ADR-0011, ADR-0016).

Um único nó parametrizado por Guia (skill) roda o loop de implementação no
worktree. Backend e frontend são instâncias do mesmo nó com Guias distintos.

Desde o ADR-0016, o nó opera como um **goal-based loop** (Loop Engineering):
itera chamando o LLM para implementar, roda test/lint via `ToolExecutionPort`
como ferramenta in-loop e repete até o goal (test/lint passando) ser atingido
ou o teto de iterações ser alcançado. PII é aplicada como hook determinístico
sobre a saída e o contexto realimentado.
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from pathlib import Path

from open_agentic_ops.nodes.guia import Guia, carregar_guia
from open_agentic_ops.pii import redigir_texto
from open_agentic_ops.ports import LLMProviderPort, ToolExecutionPort
from open_agentic_ops.state import BoardState, Dominio, Worktree, novo_raciocinio


class _DefaultLLM:
    """Fallback determinístico quando não há LLMProviderPort injetado."""

    def invoke(self, prompt: str, *, system: str | None = None) -> str:
        return f"[implementado] {prompt[:200]}"


class _NoopTools:
    """Fallback determinístico quando não há ToolExecutionPort injetado."""

    async def call_tool(self, tool_name: str, arguments: dict) -> dict:
        return {"tool": tool_name, "ok": True, "detail": "noop"}


def _rodar_verificacao(
    executor: ToolExecutionPort, branch: str, ferramentas: tuple[str, ...]
) -> dict:
    """Roda as ferramentas de verificação (test/lint) e retorna o resultado."""

    async def _run() -> dict:
        resultado: dict = {}
        for tool in ferramentas:
            resp = await executor.call_tool(tool, {"branch": branch})
            resultado[tool] = resp
        return resultado

    return asyncio.run(_run())


def _goal_atingido(verificacao: dict) -> bool:
    """Goal determinístico: todas as ferramentas de verificação passaram."""
    return all(resp.get("ok") for resp in verificacao.values())


_CONTRATO_EXTERNO_KEYWORDS = (
    "contrato externo",
    "fapi-br",
    "endpoint externo",
    "schema",
    "manual de apis",
    "manual de escopo",
    "portabilidade",
    "instrucao normativa",
    "oauth",
    "token",
)


def _toca_contrato_externo(spec: str) -> bool:
    """Heurística determinística (decisão 7.3, Camada 1).

    Avalia se a spec toca contrato de API externo/regulado por substring match
    contra keywords. O reasoner real (LLM) fica para Camada 2.
    """
    t = spec.lower()
    return any(k in t for k in _CONTRATO_EXTERNO_KEYWORDS)


def make_feature_node(
    dominio: Dominio,
    *,
    llm: LLMProviderPort | None = None,
    tools: ToolExecutionPort | None = None,
    skill_dir: str | None = None,
    branch_prefix: str = "feat",
    max_iteracoes: int = 3,
) -> Callable[[BoardState], BoardState]:
    """Factory do nó Feature para um domínio específico (Guia)."""
    guia: Guia = carregar_guia(dominio, Path(skill_dir) if skill_dir else None)
    provider: LLMProviderPort = llm or _DefaultLLM()
    executor: ToolExecutionPort = tools or _NoopTools()

    def feature_node(state: BoardState) -> BoardState:
        spec = state.get("spec", "")
        branch = f"{branch_prefix}/{guia.nome}"
        historico: list[dict] = []
        resultado = ""

        for tentativa in range(1, max_iteracoes + 1):
            prompt = (
                f"Domínio: {guia.dominio}\n"
                f"Ferramentas disponíveis: {', '.join(guia.ferramentas)}\n"
                f"Checklist: {'; '.join(guia.checklist)}\n"
                f"Spec:\n{spec}\n\n"
                f"Implemente a feature no worktree e retorne o resumo."
            )
            if historico:
                prompt += (
                    "\n\nTentativas anteriores (test/lint falharam):\n"
                    f"{historico[-1].get('resumo', '')}"
                )

            resultado = provider.invoke(prompt, system=guia.system_prompt)
            resultado = redigir_texto(resultado)

            verificacao = _rodar_verificacao(executor, branch, guia.ferramentas)
            partes = []
            for tool, resp in verificacao.items():
                detalhe = resp.get("detail")
                partes.append(f"{tool}={resp.get('ok')}" + (f" ({detalhe})" if detalhe else ""))
            resumo = "; ".join(partes)
            historico.append(
                {
                    "tentativa": tentativa,
                    "resumo": redigir_texto(resumo),
                    "verificacao": verificacao,
                }
            )

            if _goal_atingido(verificacao):
                status = "implementado"
                break
        else:
            status = "falhou"

        worktree: Worktree = {
            "dominio": guia.dominio,
            "guia": guia.nome,
            "branch": branch,
            "status": status,
            "resultado": resultado,
            "iteracoes": len(historico),
            "historico": historico,
        }

        retorno: BoardState = {
            "worktrees": [worktree],
            "raciocinios": [
                novo_raciocinio(
                    etapa=f"feature_{guia.dominio}",
                    agente=f"Feature Agent ({guia.dominio})",
                    raciocinio=(
                        f"Implementou no worktree {branch} com status {status} "
                        f"após {len(historico)} iteração(ões)."
                    ),
                    evidencias=[
                        {
                            "branch": branch,
                            "status": status,
                            "iteracoes": len(historico),
                            "resultado": resultado,
                            "historico": historico,
                        }
                    ],
                )
            ],
        }
        if guia.dominio in ("backend", "ambos"):
            retorno["toca_contrato_externo"] = _toca_contrato_externo(spec)

        return retorno

    return feature_node
