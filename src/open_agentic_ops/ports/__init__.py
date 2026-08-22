"""Portas hexagonais (ADR-0004).

Formalizam apenas as bordas reais de troca com o mundo externo. A lógica de
negócio é prompt-driven por desenho; estas portas permitem trocar provedores
sem tocar no harness.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class LLMProviderPort(Protocol):
    """Troca de modelo/provider sem tocar o harness."""

    def invoke(self, prompt: str, *, system: str | None = None) -> str:
        """Invoca o modelo e retorna a resposta textual."""
        ...


@runtime_checkable
class ToolExecutionPort(Protocol):
    """Chamadas MCP (git/SCM, testes, deploy, observabilidade)."""

    async def call_tool(self, tool_name: str, arguments: dict) -> dict:
        """Executa uma ferramenta MCP e retorna o resultado estruturado."""
        ...


@runtime_checkable
class PersistencePort(Protocol):
    """Checkpointer (board). Dev: Sqlite/InMemory; prod: Postgres."""

    def save(self, thread_id: str, state: dict) -> None:
        """Persiste o estado de um thread (item de demanda)."""
        ...

    def load(self, thread_id: str) -> dict | None:
        """Recupera o estado de um thread."""
        ...

    def list_threads(self) -> list[str]:
        """Lista os thread_ids conhecidos (demandas no board)."""
        ...


@runtime_checkable
class NotificationPort(Protocol):
    """Ponte `POST /resume` do HITL (ADR-0005/0009)."""

    def notify(self, thread_id: str, payload: dict) -> None:
        """Notifica o FDE que há algo aguardando ação (push)."""
        ...

    def resume(self, thread_id: str, decision: dict) -> dict:
        """Injeta a decisão do FDE no grafo via `Command(resume=...)`."""
        ...
