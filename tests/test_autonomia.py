"""Testes da matriz de autonomia por etapa (ADR-0025).

Cobre: `autonomia_da_etapa` (leitura da matriz), e o comportamento do gate
HITL genérico para cada nível — `humano` pausa via `interrupt()`, `autonomo`
não pausa, `llm_judge` aprova via fallback determinístico (fase 2).
"""

from langgraph.types import Command

from open_agentic_ops.autonomia import MATRIZ_AUTONOMIA, autonomia_da_etapa
from open_agentic_ops.gates.hitl_gate import make_hitl_gate
from open_agentic_ops.graph import build_graph
from open_agentic_ops.persistence import build_dev_checkpointer


def test_matriz_tem_todas_as_etapas():
    for etapa in (
        "intake",
        "feature",
        "platform",
        "review",
        "architecture",
        "deploy",
        "sre",
    ):
        assert etapa in MATRIZ_AUTONOMIA


def test_autonomia_default_humano():
    assert autonomia_da_etapa("intake") == "humano"
    assert autonomia_da_etapa("etapa_desconhecida") == "humano"


def test_gate_autonomo_nao_pausa():
    gate = make_hitl_gate("intake", "autonomo")
    result = gate({"raciocinios": []})
    assert result["status"] == "aprovado"
    assert "decisao_hitl" not in result


def test_gate_llm_judge_aprova_fallback():
    gate = make_hitl_gate("intake", "llm_judge")
    result = gate({"raciocinios": [{"etapa": "intake", "agente": "Intake Agent"}]})
    assert result["decisao_hitl"]["decisao"] == "aprovado"
    assert result["status"] == "aprovado"


def test_grafo_autonomo_nao_pausa_em_nenhum_gate():
    """Com todas as etapas autônomas, o grafo roda até o fim sem interrupt."""
    import open_agentic_ops.autonomia as autonomia_mod

    original = dict(autonomia_mod.MATRIZ_AUTONOMIA)
    try:
        for etapa in original:
            autonomia_mod.MATRIZ_AUTONOMIA[etapa] = "autonomo"

        app = build_graph().compile(checkpointer=build_dev_checkpointer())
        config = {"configurable": {"thread_id": "auto-1"}}
        result = app.invoke(
            {
                "origem": "cliente",
                "spec": "Adicionar botão de download no dashboard.",
            },
            config,
        )
        assert result["status"] == "monitorado"
    finally:
        autonomia_mod.MATRIZ_AUTONOMIA.clear()
        autonomia_mod.MATRIZ_AUTONOMIA.update(original)


def test_grafo_humano_pausa_no_primeiro_gate():
    app = build_graph().compile(checkpointer=build_dev_checkpointer())
    config = {"configurable": {"thread_id": "humano-1"}}

    result = app.invoke(
        {
            "origem": "cliente",
            "spec": "Adicionar botão de download no dashboard.",
        },
        config,
    )

    assert result["status"] == "triado"
    state = app.get_state(config)
    assert any(str(n).startswith("hitl_") for n in state.next)

    result = app.invoke(Command(resume={"decisao": "aprovado", "observacao": "ok"}), config)
    assert result["status"] == "em_implementacao"
