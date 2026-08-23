"""Testes do nó Intake (RF-1)."""

from open_agentic_ops.nodes.intake import classificar_ambiguidade
from open_agentic_ops.nodes.intake_node import make_intake_node, route_by_ambiguity

intake_node = make_intake_node()


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
    state = intake_node(
        {
            "origem": "cliente",
            "spec": "Adicionar botão de download no dashboard.",
        }
    )
    assert state["ambiguidade"] == "baixa"
    assert state["spec_autor"] == "intake"
    assert route_by_ambiguity(state) == "rascunha_spec"


def test_intake_mascara_pii():
    state = intake_node({"origem": "cliente", "spec": "Cliente CPF 123.456.789-00 pediu ajuste."})
    assert "[CPF]" in state["spec"]
    assert "123.456.789-00" not in state["spec"]


def test_fallback_ambiguidade_sem_keyword_escala_fde():
    amb, just = classificar_ambiguidade("Reorganizar a estrutura interna do módulo de relatórios.")
    assert amb == "alta"
    assert just == []


class _PrecedenteFake:
    def __init__(self, thread_id: str):
        self.thread_id = thread_id


def test_intake_precedente_reforca_baixa():
    node = make_intake_node(buscar_precedentes=lambda *a, **k: [_PrecedenteFake("thread-abc")])
    state = node(
        {
            "origem": "cliente",
            "spec": "Adicionar botão de download no dashboard.",
        }
    )
    assert state["ambiguidade"] == "baixa"
    assert state["spec_autor"] == "intake"
    assert "precedente:thread-abc" in state["classificacao_intake"]["justificativa"]


def test_intake_sem_precedente_mantem_fallback_alta():
    node = make_intake_node(buscar_precedentes=lambda *a, **k: [])
    state = node(
        {
            "origem": "cliente",
            "spec": "Reorganizar a estrutura interna do módulo de relatórios.",
        }
    )
    assert state["ambiguidade"] == "alta"
    assert state["spec_autor"] == "fde"


def test_intake_busca_indisponivel_degrada_graciosamente():
    def boom(*a, **k):
        raise RuntimeError("sem db")

    node = make_intake_node(buscar_precedentes=boom)
    state = node(
        {
            "origem": "cliente",
            "spec": "Adicionar botão de download no dashboard.",
        }
    )
    assert state["ambiguidade"] == "baixa"
    assert not any(
        j.startswith("precedente:") for j in state["classificacao_intake"]["justificativa"]
    )
