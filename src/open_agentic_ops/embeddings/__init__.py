"""Embeddings opensource locais (decisão 2 — similaridade semântica).

Gera vetores de embedding a partir do texto sanitizado (pós-PII) de uma
demanda usando Sentence-Transformers local (modelo multilíngue). A LLM via AI
Gateway NÃO é usada para embeddings — embeddings são modelos dedicados e a
stack é toda opensource, exceto a geração de texto via AI Gateway.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

_MODELO_DEFAULT = "paraphrase-multilingual-MiniLM-L12-v2"


@lru_cache(maxsize=1)
def _carregar_modelo() -> Any:
    """Carrega o SentenceTransformer uma única vez (lazy-load).

    O modelo é baixado na primeira execução e cacheado em disco pelo
    HuggingFace Hub. Retorna o objeto do modelo; o import é feito aqui para
    evitar custo de startup quando a similaridade não é usada.
    """
    from sentence_transformers import SentenceTransformer

    nome = os.environ.get("EMBEDDING_MODELO", _MODELO_DEFAULT)
    return SentenceTransformer(nome)


def gerar_embedding(texto: str) -> list[float]:
    """Gera o vetor de embedding do texto fornecido.

    Args:
        texto: texto sanitizado (pós-PII) da demanda.

    Returns:
        Lista de floats representando o embedding.
    """
    modelo = _carregar_modelo()
    vetor = modelo.encode([texto], normalize_embeddings=True)[0]
    return [float(v) for v in vetor]
