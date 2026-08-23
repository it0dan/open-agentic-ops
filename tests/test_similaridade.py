"""Testes da camada de similaridade (decisão 2 — pgvector)."""

from unittest.mock import MagicMock, patch

from open_agentic_ops.similaridade import (
    Precedente,
    buscar_precedentes,
    registrar_precedente,
)


def test_buscar_precedentes_retorna_resultados():
    cursor = MagicMock()
    cursor.fetchall.return_value = [("thread-1", 0.8123)]
    conn = MagicMock()
    conn.__enter__.return_value = conn
    conn.cursor.return_value.__enter__.return_value = cursor

    with (
        patch("open_agentic_ops.similaridade._conectar", return_value=conn),
        patch("open_agentic_ops.embeddings.gerar_embedding", return_value=[0.1, 0.2]),
    ):
        resultado = buscar_precedentes("texto", "cliente", "backend")

    assert len(resultado) == 1
    assert isinstance(resultado[0], Precedente)
    assert resultado[0].thread_id == "thread-1"
    assert abs(resultado[0].score - 0.8123) < 1e-6


def test_buscar_precedentes_degrada_graciosamente():
    with (
        patch("open_agentic_ops.similaridade._conectar", side_effect=RuntimeError("sem db")),
        patch("open_agentic_ops.embeddings.gerar_embedding", return_value=[0.1]),
    ):
        resultado = buscar_precedentes("texto", "cliente", "backend")

    assert resultado == []


def test_registrar_precedente_degrada_graciosamente():
    with (
        patch("open_agentic_ops.similaridade._conectar", side_effect=RuntimeError("sem db")),
        patch("open_agentic_ops.embeddings.gerar_embedding", return_value=[0.1]),
    ):
        registrar_precedente("t1", "cliente", "backend", "texto", "monitorado")
