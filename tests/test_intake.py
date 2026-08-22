"""Testes do nó Intake (RF-1)."""

from open_agentic_ops.nodes.intake_node import intake_node, route_by_ambiguity


def test_intake_alta_ambiguidade_escala_fde():
    state = intake_node(
        {
            "origem": "regulatorio",
            "spec": "Nova Instrução Normativa do BCB altera o Manual de Escopo, "
            "campo de portabilidade de crédito consignado.",
        }
    )
    assert state["ambiguidade"] == "alta"
    assert state["spec_autor"] == "fde"
    assert state["pii_masked"] is True
    assert route_by_ambiguity(state) == "fde"


def test_intake_baixa_ambiguidade_rascunha():
    state = intake_node({"origem": "cliente", "spec": "Adicionar botão de download no dashboard."})
    assert state["ambiguidade"] == "baixa"
    assert state["spec_autor"] == "intake"
    assert route_by_ambiguity(state) == "rascunha_spec"


def test_intake_mascara_pii():
    state = intake_node({"origem": "cliente", "spec": "Cliente CPF 123.456.789-00 pediu ajuste."})
    assert "[CPF]" in state["spec"]
    assert "123.456.789-00" not in state["spec"]
