"""Persistência — o checkpointer é o board (ADR-0002).

Dev usa `InMemorySaver`/`SqliteSaver`; prod usa `PostgresSaver` + Redis. Cada
item de demanda = um `thread_id`; o estado persiste entre pausas/retomadas.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import InMemorySaver

from open_agentic_ops.state import BoardState


def build_dev_checkpointer() -> BaseCheckpointSaver:
    """Checkpointer de desenvolvimento (InMemorySaver)."""
    return InMemorySaver()


def build_sqlite_checkpointer(db_path: str = "board.sqlite") -> BaseCheckpointSaver:
    """Checkpointer SqliteSaver (dev persistente)."""
    from langgraph.checkpoint.sqlite import SqliteSaver

    return SqliteSaver.from_conn_string(db_path)


def build_postgres_checkpointer(database_url: str) -> BaseCheckpointSaver:
    """Checkpointer PostgresSaver (produção). Requer extra `postgres`."""
    from langgraph.checkpoint.postgres import PostgresSaver

    return PostgresSaver.from_conn_string(database_url)


@dataclass
class BoardView:
    """View para o FDE consultar demandas pendentes (RF-8.2)."""

    checkpointer: BaseCheckpointSaver
    _cache: dict[str, dict[str, Any]] = field(default_factory=dict)

    def snapshot(self, thread_id: str) -> BoardState | None:
        """Estado corrente de um thread (item de demanda)."""
        state = self.checkpointer.get_tuple({"configurable": {"thread_id": thread_id}})
        if state is None:
            return None
        return state.values

    def pending(self) -> list[tuple[str, BoardState]]:
        """Demandas pendentes (aguardando HITL ou em andamento)."""
        result: list[tuple[str, BoardState]] = []
        for thread_id in self._cache:
            snap = self.snapshot(thread_id)
            if snap is None:
                continue
            status = snap.get("status")
            if status in {"aguardando_hitl", "em_implementacao", "em_revisao"}:
                result.append((thread_id, snap))
        return result

    def register(self, thread_id: str) -> None:
        """Registra um thread_id conhecido no board."""
        self._cache[thread_id] = {}
