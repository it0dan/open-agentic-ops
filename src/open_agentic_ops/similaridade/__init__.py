"""Similaridade semântica via pgvector (decisão 2).

Busca de precedentes por similaridade semântica contra o histórico de demandas
já resolvidas (status terminal), usando a extensão `vector` do Postgres que já
é o checkpointer (ADR-0002). A tabela `precedentes` é um índice de similaridade
derivado — não a fonte de verdade de demanda.

Degrada graciosamente: se o Postgres/pgvector estiver indisponível, a busca
retorna vazio e o Intake mantém o comportamento atual (keyword + fallback).
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)

_STATUS_TERMINAL = ("monitorado", "deployado")

_SCHEMA_SQL = """
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS precedentes (
    thread_id TEXT PRIMARY KEY,
    origem TEXT NOT NULL,
    dominio TEXT NOT NULL,
    texto_sanitizado TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    status_terminal TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_precedentes_origem_dominio
    ON precedentes (origem, dominio);
"""


@dataclass(frozen=True)
class Precedente:
    """Resultado de uma busca por similaridade."""

    thread_id: str
    score: float


def _database_url() -> str | None:
    url = os.environ.get("DATABASE_URL")
    return url or None


def _conectar():
    """Abre conexão psycopg com o Postgres do checkpointer.

    Raises:
        Exception: se o Postgres estiver indisponível (capturado pelo caller
        para degradação graciosa).
    """
    import psycopg

    url = _database_url()
    if not url:
        raise RuntimeError("DATABASE_URL não configurada")
    return psycopg.connect(url)


def inicializar_schema() -> None:
    """Cria a extensão `vector` e a tabela `precedentes` (idempotente)."""
    with _conectar() as conn:
        with conn.cursor() as cur:
            cur.execute(_SCHEMA_SQL)
        conn.commit()


def buscar_precedentes(
    texto: str,
    origem: str,
    dominio: str,
    n: int = 5,
    threshold: float = 0.75,
) -> list[Precedente]:
    """Busca as N demandas mais similares já resolvidas da mesma origem+dominio.

    Usa distância de cosseno (`<=>`); quanto menor a distância, maior a
    similaridade. Retorna apenas resultados com similaridade >= threshold.

    Degrada graciosamente: se o Postgres/pgvector estiver indisponível, loga e
    retorna lista vazia.
    """
    from open_agentic_ops.embeddings import gerar_embedding

    try:
        with _conectar() as conn:
            vetor = gerar_embedding(texto)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT thread_id, 1 - (embedding <=> %s::vector) AS score
                    FROM precedentes
                    WHERE origem = %s AND dominio = %s
                      AND status_terminal = ANY(%s)
                      AND 1 - (embedding <=> %s::vector) >= %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """,
                    (vetor, origem, dominio, list(_STATUS_TERMINAL), vetor, threshold, vetor, n),
                )
                rows = cur.fetchall()
        return [Precedente(thread_id=r[0], score=float(r[1])) for r in rows]
    except Exception as exc:  # noqa: BLE001 - degradação graciosa
        logger.warning("Busca de precedentes indisponível (%s); degradando para vazio", exc)
        return []


def registrar_precedente(
    thread_id: str,
    origem: str,
    dominio: str,
    texto_sanitizado: str,
    status_terminal: str,
) -> None:
    """Registra o embedding/metadados de uma demanda em status terminal.

    Degrada graciosamente: se o Postgres/pgvector estiver indisponível, loga e
    não falha o pipeline.
    """
    from open_agentic_ops.embeddings import gerar_embedding

    try:
        with _conectar() as conn:
            vetor = gerar_embedding(texto_sanitizado)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO precedentes
                        (thread_id, origem, dominio, texto_sanitizado, embedding, status_terminal)
                    VALUES (%s, %s, %s, %s, %s::vector, %s)
                    ON CONFLICT (thread_id) DO UPDATE SET
                        origem = EXCLUDED.origem,
                        dominio = EXCLUDED.dominio,
                        texto_sanitizado = EXCLUDED.texto_sanitizado,
                        embedding = EXCLUDED.embedding,
                        status_terminal = EXCLUDED.status_terminal
                    """,
                    (thread_id, origem, dominio, texto_sanitizado, vetor, status_terminal),
                )
            conn.commit()
    except Exception as exc:  # noqa: BLE001 - degradação graciosa
        logger.warning("Registro de precedente indisponível (%s); ignorando", exc)
