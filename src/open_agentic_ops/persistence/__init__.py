"""Persistência — o checkpointer é o board (ADR-0002).

Dev usa `InMemorySaver`/`SqliteSaver`; prod usa `PostgresSaver` + Redis. Cada
item de demanda = um `thread_id`; o estado persiste entre pausas/retomadas.
"""

from __future__ import annotations

from dataclasses import dataclass

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
    """View para o FDE consultar demandas (RF-8.2).

    Lista os threads diretamente do checkpointer (sem cache manual), de modo
    que qualquer demanda persistida aparece no board automaticamente.
    """

    checkpointer: BaseCheckpointSaver

    def snapshot(self, thread_id: str, tenant_id: str | None = None) -> BoardState | None:
        """Estado corrente de um thread (item de demanda).

        Se `tenant_id` for fornecido e o thread não pertencer ao tenant,
        retorna `None` (o endpoint responde 404 — anti-enumeração, ADR-0015).
        """
        state = self.checkpointer.get_tuple({"configurable": {"thread_id": thread_id}})
        if state is None:
            return None
        snap = state.checkpoint["channel_values"]
        if tenant_id is not None and snap.get("tenant_id") != tenant_id:
            return None
        return snap

    def list_threads(self) -> list[str]:
        """Lista os thread_ids conhecidos no checkpointer."""
        threads: list[str] = []
        for checkpoint in self.checkpointer.list(None):
            cfg = checkpoint.config.get("configurable", {})
            tid = cfg.get("thread_id")
            if tid and tid not in threads:
                threads.append(tid)
        return threads

    def all(self, tenant_id: str | None = None) -> list[tuple[str, BoardState]]:
        """Todas as demandas do board (thread_id, estado).

        Se `tenant_id` for fornecido, retorna apenas as demandas do tenant.
        """
        result: list[tuple[str, BoardState]] = []
        for thread_id in self.list_threads():
            snap = self.snapshot(thread_id, tenant_id=tenant_id)
            if snap is not None:
                result.append((thread_id, snap))
        return result

    def pending(self, tenant_id: str | None = None) -> list[tuple[str, BoardState]]:
        """Demandas pendentes (aguardando HITL ou em andamento)."""
        result: list[tuple[str, BoardState]] = []
        for thread_id, snap in self.all(tenant_id=tenant_id):
            status = snap.get("status")
            if status in {"aguardando_hitl", "em_implementacao", "em_revisao"}:
                result.append((thread_id, snap))
        return result
