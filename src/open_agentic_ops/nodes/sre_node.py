"""Nó SRE e loop de fechamento (RF-7, ADR-0010/0019).

Monitora SLOs/error budget em produção e gera uma task que realimenta o board
como 4ª origem, passando pelo Intake (mesmo funil das outras 3 origens).

Produz um `ResultadoMonitoramento` estruturado (ADR-0019): `motivo` sempre
presente (mesmo quando não gera task), sustentando a auditoria prospectiva das
decisões de "não agir". Quando `task_gerada=True`, dispara o port
`criar_demanda` para realimentar o Intake com `origem="sre"`.
"""

from __future__ import annotations

from collections.abc import Callable

from open_agentic_ops.state import BoardState, ResultadoMonitoramento


def _monitorar() -> dict:
    """Fallback determinístico quando não há métricas reais."""
    return {"slo_ok": True, "error_budget": 0.05}


def julgar(metricas: dict) -> ResultadoMonitoramento:
    """Reasoner do SRE (fallback determinístico por ora, ADR-0019).

    Produz o `ResultadoMonitoramento` estruturado. O julgamento real (pesando
    múltiplos sinais + tendência recente) fica para quando houver dados de
    observabilidade + LLM (mesma infra do loop do Feature, ADR-0016 camada 2).
    """
    slo_ok = bool(metricas.get("slo_ok", True))
    if slo_ok:
        return {
            "task_gerada": False,
            "motivo": "SLOs dentro do esperado; nenhuma ação necessária.",
            "descricao_task": None,
            "metricas_brutas": metricas,
        }
    return {
        "task_gerada": True,
        "motivo": "SLO violado; gerando demanda para o Intake investigar.",
        "descricao_task": "Degradação de SLO observada após deploy; investigar.",
        "metricas_brutas": metricas,
    }


def make_sre_node(
    monitorar: Callable[[], dict] | None = None,
    criar_demanda: Callable[[str, str], str] | None = None,
    registrar_precedente: Callable[..., None] | None = None,
) -> Callable[[BoardState], BoardState]:
    """Factory do nó SRE.

    `criar_demanda` é o port que realimenta o Intake (ADR-0019): recebe o texto
    da demanda gerada e o `tenant_id` da execução corrente, retornando o
    `thread_id` da nova execução. Só pode ser wireado no nível da aplicação
    (`create_app()`), onde o grafo compilado e o checkpointer existem.

    `registrar_precedente` (decisão 2) registra o embedding/metadados da demanda
    na tabela de precedentes quando ela atinge status terminal (`monitorado`),
    alimentando buscas futuras por similaridade.
    """
    check = monitorar or _monitorar

    def sre_node(state: BoardState) -> BoardState:
        metricas = check()
        resultado = julgar(metricas)

        if resultado["task_gerada"] and criar_demanda is not None:
            descricao = resultado["descricao_task"] or ""
            tenant_id = state.get("tenant_id", "default")
            criar_demanda(descricao, tenant_id)

        if registrar_precedente is not None:
            thread_id = state.get("thread_id")
            if thread_id:
                registrar_precedente(
                    thread_id=thread_id,
                    origem=state.get("origem", "cliente"),
                    dominio=state.get("domino", "ambos"),
                    texto_sanitizado=state.get("spec", ""),
                    status_terminal="monitorado",
                )

        return {
            "status": "monitorado",
            "resultado_monitoramento": resultado,
        }

    return sre_node
