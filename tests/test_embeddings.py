"""Testes do módulo de embeddings (decisão 2 — similaridade semântica)."""

from typing import Any
from unittest.mock import MagicMock, patch

from open_agentic_ops.embeddings import gerar_embedding


def _fake_modelo(vetor: list[float]) -> Any:
    modelo: Any = type("FakeModelo", (), {})()
    modelo.encode = lambda textos, normalize_embeddings=True: [vetor]
    return modelo


def test_gerar_embedding_retorna_vetor_normalizado():
    with patch(
        "open_agentic_ops.embeddings._carregar_modelo",
        return_value=_fake_modelo([0.6, 0.8]),
    ):
        vetor = gerar_embedding("texto sanitizado")

    assert isinstance(vetor, list)
    assert len(vetor) == 2
    assert all(isinstance(v, float) for v in vetor)
    assert vetor == [0.6, 0.8]


def test_gerar_embedding_chama_encode_com_lista():
    encode = MagicMock(return_value=[[1.0]])
    modelo: Any = type("FakeModelo", (), {})()
    modelo.encode = encode
    with patch("open_agentic_ops.embeddings._carregar_modelo", return_value=modelo):
        gerar_embedding("algum texto")

    encode.assert_called_once_with(["algum texto"], normalize_embeddings=True)
