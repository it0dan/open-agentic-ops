"""Observabilidade (RF-9, ADR-0008).

LangSmith é a camada principal de tracing/avaliação agêntica; OTel é apenas a
camada de infra/métricas (resource, spans de infraestrutura, export OTLP). Sem
duplicação de tracing agêntico. Payloads de PII são sanitizados antes de chegar
à telemetria (ADR-0006).
"""

from __future__ import annotations

import os
from typing import Any

from open_agentic_ops.pii import sanitizar_payload


def configure_langsmith(*, project: str | None = None) -> dict[str, str]:
    """Configura o tracing do LangSmith via variáveis de ambiente."""
    env: dict[str, str] = {}
    api_key = os.environ.get("LANGSMITH_API_KEY")
    if api_key:
        env["LANGSMITH_API_KEY"] = api_key
    if os.environ.get("LANGSMITH_TRACING", "true").lower() == "true":
        env["LANGSMITH_TRACING"] = "true"
    env["LANGSMITH_PROJECT"] = project or os.environ.get("LANGSMITH_PROJECT", "open-agentic-ops")
    return env


def configure_otel(endpoint: str | None = None) -> dict[str, str]:
    """Configura o export OTLP do OTel (infra/métricas)."""
    env: dict[str, str] = {}
    otel_endpoint = endpoint or os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
    if otel_endpoint:
        env["OTEL_EXPORTER_OTLP_ENDPOINT"] = otel_endpoint
    return env


def sanitize_for_telemetry(payload: dict[str, Any]) -> dict[str, Any]:
    """Sanitiza PII de um payload antes de enviar à telemetria (RF-9.2)."""
    return sanitizar_payload(payload)
