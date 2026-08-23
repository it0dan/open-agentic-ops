"""Testes do harness do loop goal-based do Feature Agent (ADR-0016).

Cobre: goal atingido na primeira tentativa, goal após correções, teto de
iterações respeitado, PII redigida na saída e no contexto realimentado, Guia
com ferramentas/checklist, worktree com metadados do loop e fallback sem
providers.
"""

from open_agentic_ops.nodes.feature_node import make_feature_node
from open_agentic_ops.nodes.guia import carregar_guia


class _FakeLLM:
    """LLM fake: retorna um texto que pode conter PII."""

    def __init__(self, saida: str = "implementei a feature") -> None:
        self.saida = saida
        self.chamadas = 0

    def invoke(self, prompt: str, *, system: str | None = None) -> str:
        self.chamadas += 1
        return self.saida


class _FakeTools:
    """Tools fake: controla o resultado de test/lint por chamada."""

    def __init__(self, resultados: list[dict]) -> None:
        self.resultados = list(resultados)
        self.chamadas = 0

    async def call_tool(self, tool_name: str, arguments: dict) -> dict:
        idx = min(self.chamadas, len(self.resultados) - 1)
        self.chamadas += 1
        return self.resultados[idx]


def _tools_ok() -> _FakeTools:
    return _FakeTools([{"tool": "test", "ok": True}, {"tool": "lint", "ok": True}])


def _tools_falha_primeiro() -> _FakeTools:
    return _FakeTools(
        [
            {"tool": "test", "ok": False},
            {"tool": "lint", "ok": False},
            {"tool": "test", "ok": True},
            {"tool": "lint", "ok": True},
        ]
    )


def _tools_sempre_falha() -> _FakeTools:
    return _FakeTools(
        [
            {"tool": "test", "ok": False},
            {"tool": "lint", "ok": False},
        ]
    )


def test_goal_atingido_na_primeira_tentativa():
    node = make_feature_node("backend", llm=_FakeLLM(), tools=_tools_ok())
    state = node({"spec": "adicionar endpoint"})

    wt = state["worktrees"][0]
    assert wt["status"] == "implementado"
    assert wt["iteracoes"] == 1


def test_goal_atingido_apos_correcoes():
    node = make_feature_node("backend", llm=_FakeLLM(), tools=_tools_falha_primeiro())
    state = node({"spec": "adicionar endpoint"})

    wt = state["worktrees"][0]
    assert wt["status"] == "implementado"
    assert wt["iteracoes"] == 2
    assert len(wt["historico"]) == 2


def test_teto_de_iteracoes_respeitado():
    node = make_feature_node(
        "backend", llm=_FakeLLM(), tools=_tools_sempre_falha(), max_iteracoes=3
    )
    state = node({"spec": "adicionar endpoint"})

    wt = state["worktrees"][0]
    assert wt["status"] == "falhou"
    assert wt["iteracoes"] == 3


def test_pii_redigida_na_saida():
    llm = _FakeLLM(saida="usuário com CPF 123.456.789-00 e email a@b.com")
    node = make_feature_node("backend", llm=llm, tools=_tools_ok())
    state = node({"spec": "adicionar endpoint"})

    wt = state["worktrees"][0]
    assert "123.456.789-00" not in wt["resultado"]
    assert "[CPF]" in wt["resultado"]
    assert "a@b.com" not in wt["resultado"]
    assert "[EMAIL]" in wt["resultado"]


def test_pii_redigida_no_contexto_realimentado():
    llm = _FakeLLM()
    tools = _FakeTools(
        [
            {"tool": "test", "ok": False, "detail": "erro com CPF 123.456.789-00"},
            {"tool": "lint", "ok": False},
            {"tool": "test", "ok": True},
            {"tool": "lint", "ok": True},
        ]
    )
    node = make_feature_node("backend", llm=llm, tools=tools)
    state = node({"spec": "adicionar endpoint"})

    wt = state["worktrees"][0]
    assert wt["status"] == "implementado"
    assert "123.456.789-00" not in wt["historico"][0]["resumo"]
    assert "[CPF]" in wt["historico"][0]["resumo"]


def test_guia_expoe_ferramentas_e_checklist():
    guia = carregar_guia("backend")
    assert "test" in guia.ferramentas
    assert "lint" in guia.ferramentas
    assert guia.checklist

    guia_front = carregar_guia("frontend")
    assert guia_front.ferramentas
    assert guia_front.checklist


def test_worktree_registra_metadados_do_loop():
    node = make_feature_node("backend", llm=_FakeLLM(), tools=_tools_falha_primeiro())
    state = node({"spec": "adicionar endpoint"})

    wt = state["worktrees"][0]
    assert wt["iteracoes"] == 2
    assert len(wt["historico"]) == 2
    assert wt["historico"][0]["tentativa"] == 1
    assert wt["historico"][1]["tentativa"] == 2


def test_execucao_sem_providers_fallback():
    node = make_feature_node("backend")
    state = node({"spec": "adicionar endpoint"})

    wt = state["worktrees"][0]
    assert wt["status"] == "implementado"
    assert wt["iteracoes"] == 1
