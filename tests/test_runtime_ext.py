"""Testes da extensão do runtime do change fde-console (RNF-4).

Cobre: registro de `classificacao_intake` pelo Intake, heurística mutável
(carregar/salvar/add/remove) e `BoardView` (listar threads do checkpointer).
"""

from pathlib import Path

from open_agentic_ops.nodes.intake import (
    Heuristica,
    carregar_heuristica,
    classificar_ambiguidade,
    classificar_dominio,
    salvar_heuristica,
)
from open_agentic_ops.nodes.intake_node import intake_node
from open_agentic_ops.persistence import BoardView, build_dev_checkpointer


def test_intake_registra_classificacao():
    state = intake_node(
        {
            "origem": "regulatorio",
            "spec": "Nova Instrução Normativa do BCB altera o Manual de Escopo, "
            "campo de portabilidade de crédito consignado.",
        }
    )
    cls = state["classificacao_intake"]
    assert cls["dominio"] == "backend"
    assert cls["ambiguidade"] == "alta"
    assert cls["justificativa"]
    assert cls["timestamp"]


def test_heuristica_mutavel_salvar_e_carregar(tmp_path: Path):
    path = tmp_path / "heuristica.json"
    h = Heuristica()
    h.backend.add("novo-termo-backend")
    salvar_heuristica(h, path)

    carregada = carregar_heuristica(path)
    assert "novo-termo-backend" in carregada.backend


def test_heuristica_mutavel_afeta_classificacao(tmp_path: Path):
    path = tmp_path / "heuristica.json"
    h = Heuristica()
    h.alta_ambiguidade.add("termo-personalizado")
    salvar_heuristica(h, path)

    amb, just = classificar_ambiguidade("pedido com termo-personalizado", h)
    assert amb == "alta"
    assert "termo-personalizado" in just


def test_heuristica_remove_palavra(tmp_path: Path):
    path = tmp_path / "heuristica.json"
    h = Heuristica()
    h.backend.discard("api")
    salvar_heuristica(h, path)

    carregada = carregar_heuristica(path)
    assert "api" not in carregada.backend


def test_classificar_dominio_retorna_justificativa():
    dominio, just = classificar_dominio("criar endpoint de API no servidor")
    assert dominio == "backend"
    assert "endpoint" in just


def test_board_view_lista_threads_automaticamente():
    from open_agentic_ops.graph import build_graph

    checkpointer = build_dev_checkpointer()
    app = build_graph().compile(checkpointer=checkpointer)
    app.invoke(
        {"origem": "cliente", "spec": "Adicionar botão de download no dashboard."},
        {"configurable": {"thread_id": "bv-1"}},
    )

    view = BoardView(checkpointer)
    assert "bv-1" in view.list_threads()
    assert len(view.all()) == 1
    assert view.snapshot("bv-1")["ambiguidade"] == "baixa"
    assert view.snapshot("inexistente") is None
