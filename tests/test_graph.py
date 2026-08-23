"""Teste de integração do grafo (caso-âncora, RNF-4/RNF-5).

Caso-âncora: Nova Instrução Normativa do BCB altera o Manual de Escopo com um
campo de portabilidade de crédito consignado. Entra via FDE (alta ambiguidade).
Backend toca contrato externo regulado → aciona Architecture; frontend é
rotineiro. Convergem → HITL → Eval → deploy → SRE monitora.
"""

from langgraph.types import Command

from open_agentic_ops.graph import build_graph
from open_agentic_ops.persistence import build_dev_checkpointer
from open_agentic_ops.state import ResultadoEval

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
    assert result["status"] == "aguardando_autoria"

    spec_autorada = (
        "Spec autorada pelo FDE: novo campo de portabilidade de crédito "
        "consignado no Manual de Escopo, conforme a Instrução Normativa do BCB."
    )
    result = app.invoke(Command(resume={"spec": spec_autorada}), config)
    assert result["spec"] == spec_autorada
    assert result["spec_autor"] == "fde"

    branches = {w["branch"] for w in result["worktrees"]}
    assert branches == {"feat/backend", "feat/frontend"}
    assert len(result["adrs"]) >= 1
    assert len(result["feedback_review"]) == 2

    result2 = app.invoke(Command(resume={"decisao": "aprovado", "observacao": "ok"}), config)
    assert result2["decisao_hitl"]["decisao"] == "aprovado"
    assert result2["resultado_eval"]["aprovado"] is True
    assert result2["status"] == "monitorado"


def test_fluxo_baixa_ambiguidade_sem_fde():
    app = build_graph().compile(checkpointer=build_dev_checkpointer())
    config = {"configurable": {"thread_id": "baixa-1"}}

    result = app.invoke(
        {
            "origem": "cliente",
            "spec": "Adicionar botão de download no dashboard.",
        },
        config,
    )

    assert result["ambiguidade"] == "baixa"
    assert result["spec_autor"] == "intake"


def _levar_ate_hitl(app, thread_id: str) -> dict:
    """Executa o fluxo até pausar no HITL e retorna o estado."""
    config = {"configurable": {"thread_id": thread_id}}
    app.invoke(
        {
            "origem": "regulatorio",
            "spec": (
                "Nova Instrução Normativa do BCB altera o Manual de Escopo de "
                "Dados e Serviços do Open Finance, introduzindo um campo ligado "
                "à portabilidade de crédito consignado. CPF 987.654.321-00."
            ),
        },
        config,
    )
    app.invoke(Command(resume={"spec": "Spec autorada pelo FDE."}), config)
    return app.invoke(Command(resume={"decisao": "aprovado", "observacao": "ok"}), config)


def test_hitl_rejeitado_termina_o_grafo():
    app = build_graph().compile(checkpointer=build_dev_checkpointer())
    config = {"configurable": {"thread_id": "rejeitado-1"}}

    app.invoke(
        {
            "origem": "regulatorio",
            "spec": (
                "Nova Instrução Normativa do BCB altera o Manual de Escopo de "
                "Dados e Serviços do Open Finance, introduzindo um campo ligado "
                "à portabilidade de crédito consignado. CPF 555.444.333-00."
            ),
        },
        config,
    )
    app.invoke(Command(resume={"spec": "Spec autorada pelo FDE."}), config)
    result = app.invoke(
        Command(resume={"decisao": "rejeitado", "observacao": "direção errada"}),
        config,
    )

    assert result["decisao_hitl"]["decisao"] == "rejeitado"
    assert result["status"] == "rejeitado"
    assert "resultado_eval" not in result
    assert "resultado_monitoramento" not in result


def test_hitl_aprovado_com_ressalvas_segue_ao_eval():
    app = build_graph().compile(checkpointer=build_dev_checkpointer())
    config = {"configurable": {"thread_id": "ressalvas-1"}}

    app.invoke(
        {
            "origem": "regulatorio",
            "spec": (
                "Nova Instrução Normativa do BCB altera o Manual de Escopo de "
                "Dados e Serviços do Open Finance, introduzindo um campo ligado "
                "à portabilidade de crédito consignado. CPF 777.888.999-00."
            ),
        },
        config,
    )
    app.invoke(Command(resume={"spec": "Spec autorada pelo FDE."}), config)
    result = app.invoke(
        Command(
            resume={
                "decisao": "aprovado_com_ressalvas",
                "observacao": "revisar cobertura de testes",
            }
        ),
        config,
    )

    assert result["decisao_hitl"]["decisao"] == "aprovado_com_ressalvas"
    assert result["decisao_hitl"]["observacao"] == "revisar cobertura de testes"
    assert result["resultado_eval"]["aprovado"] is True
    assert result["status"] == "monitorado"


def test_eval_reprovado_volta_ao_hitl():
    chamadas = {"n": 0}

    def runner(spec: str) -> ResultadoEval:
        chamadas["n"] += 1
        if chamadas["n"] == 1:
            return {"aprovado": False, "detalhes": "trajectory reprovado"}
        return {"aprovado": True, "detalhes": "aprovado"}

    app = build_graph(eval_runner=runner).compile(checkpointer=build_dev_checkpointer())
    config = {"configurable": {"thread_id": "eval-reprovado-1"}}

    app.invoke(
        {
            "origem": "regulatorio",
            "spec": (
                "Nova Instrução Normativa do BCB altera o Manual de Escopo de "
                "Dados e Serviços do Open Finance, introduzindo um campo ligado "
                "à portabilidade de crédito consignado. CPF 111.222.333-00."
            ),
        },
        config,
    )
    app.invoke(Command(resume={"spec": "Spec autorada pelo FDE."}), config)

    result = app.invoke(Command(resume={"decisao": "aprovado", "observacao": "ok"}), config)
    assert result["resultado_eval"]["aprovado"] is False
    assert result["status"] == "aguardando_hitl"

    state = app.get_state(config)
    assert "hitl" in state.next

    result2 = app.invoke(
        Command(resume={"decisao": "aprovado", "observacao": "ok"}),
        config,
    )
    assert result2["resultado_eval"]["aprovado"] is True
    assert result2["status"] == "monitorado"


def _levar_ate_sre(app, thread_id: str) -> dict:
    """Executa o fluxo feliz completo até o nó SRE e retorna o estado."""
    config = {"configurable": {"thread_id": thread_id}}
    app.invoke(
        {
            "origem": "regulatorio",
            "spec": (
                "Nova Instrução Normativa do BCB altera o Manual de Escopo de "
                "Dados e Serviços do Open Finance, introduzindo um campo ligado "
                "à portabilidade de crédito consignado. CPF 666.777.888-00."
            ),
        },
        config,
    )
    app.invoke(Command(resume={"spec": "Spec autorada pelo FDE."}), config)
    return app.invoke(Command(resume={"decisao": "aprovado", "observacao": "ok"}), config)


def test_sre_registra_resultado_monitoramento_estruturado():
    app = build_graph().compile(checkpointer=build_dev_checkpointer())
    result = _levar_ate_sre(app, "sre-ok-1")

    assert result["status"] == "monitorado"
    rm = result["resultado_monitoramento"]
    assert rm["task_gerada"] is False
    assert rm["motivo"]
    assert rm["descricao_task"] is None
    assert "metricas_brutas" in rm


def test_sre_gera_task_e_dispara_port_criar_demanda():
    chamadas: list[str] = []

    def monitorar() -> dict:
        return {"slo_ok": False, "error_budget": 0.09}

    def criar_demanda(texto: str) -> str:
        chamadas.append(texto)
        return "nova-thread-sre"

    app = build_graph(
        monitorar=monitorar,
        criar_demanda=criar_demanda,
    ).compile(checkpointer=build_dev_checkpointer())

    result = _levar_ate_sre(app, "sre-task-1")

    rm = result["resultado_monitoramento"]
    assert rm["task_gerada"] is True
    assert rm["descricao_task"]
    assert len(chamadas) == 1
    assert chamadas[0] == rm["descricao_task"]
