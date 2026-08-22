"""Teste de integração do grafo (caso-âncora, RNF-4/RNF-5).

Caso-âncora: Nova Instrução Normativa do BCB altera o Manual de Escopo com um
campo de portabilidade de crédito consignado. Entra via FDE (alta ambiguidade).
Backend toca contrato externo regulado → aciona Architecture; frontend é
rotineiro. Convergem → HITL → Eval → deploy → SRE monitora.
"""

from langgraph.types import Command

from open_agentic_ops.graph import build_graph
from open_agentic_ops.persistence import build_dev_checkpointer

CASO_ANCORA = {
    "origem": "regulatorio",
    "spec": (
        "Nova Instrução Normativa do BCB altera o Manual de Escopo de Dados e "
        "Serviços do Open Finance, introduzindo um campo ligado à portabilidade "
        "de crédito consignado. CPF 123.456.789-00."
    ),
}


def test_fluxo_completo_caso_ancora():
    app = build_graph().compile(checkpointer=build_dev_checkpointer())
    config = {"configurable": {"thread_id": "ancora-1"}}

    result = app.invoke(CASO_ANCORA, config)

    assert result["ambiguidade"] == "alta"
    assert result["spec_autor"] == "fde"
    assert result["pii_masked"] is True
    assert "123.456.789-00" not in result["spec"]
    assert "[CPF]" in result["spec"]

    branches = {w["branch"] for w in result["worktrees"]}
    assert branches == {"feat/backend", "feat/frontend"}
    assert len(result["adrs"]) >= 1
    assert len(result["feedback_review"]) == 2

    result2 = app.invoke(Command(resume={"aprovado": True, "comentario": "ok"}), config)
    assert result2["decisao_hitl"]["aprovado"] is True
    assert result2["resultado_eval"]["aprovado"] is True
    assert result2["status"] == "monitorado"


def test_fluxo_baixa_ambiguidade_sem_fde():
    app = build_graph().compile(checkpointer=build_dev_checkpointer())
    config = {"configurable": {"thread_id": "baixa-1"}}

    result = app.invoke(
        {"origem": "cliente", "spec": "Adicionar botão de download no dashboard."},
        config,
    )

    assert result["ambiguidade"] == "baixa"
    assert result["spec_autor"] == "intake"
