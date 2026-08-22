"""Nó Platform (RF-3.3, ADR-0007).

Instância única, agnóstica de stack. Expõe testes, lint, deploy e
observabilidade como serviço via `ToolExecutionPort` (MCP) — protocolo
X-as-a-Service/trigger.
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable

from open_agentic_ops.ports import ToolExecutionPort
from open_agentic_ops.state import BoardState


class _NoopTools:
    """Fallback determinístico quando não há ToolExecutionPort injetado."""

    async def call_tool(self, tool_name: str, arguments: dict) -> dict:
        return {"tool": tool_name, "ok": True, "detail": "noop"}


def make_platform_node(
    tools: ToolExecutionPort | None = None,
) -> Callable[[BoardState], BoardState]:
    """Factory do nó Platform (MCP)."""
    executor: ToolExecutionPort = tools or _NoopTools()

    def platform_node(state: BoardState) -> BoardState:
        worktrees = list(state.get("worktrees", []))

        async def _run() -> None:
            for wt in worktrees:
                for tool in ("test", "lint"):
                    await executor.call_tool(tool, {"branch": wt["branch"]})

        asyncio.run(_run())

        return {
            "status": "em_implementacao",
        }

    return platform_node
