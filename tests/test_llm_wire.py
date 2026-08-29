"""Testes do wire de LLM por domínio no grafo (item 3).

Verifica que `build_graph(llm_por_dominio=...)` usa o provider do backend para
o `feature_backend` e o do frontend para o `feature_frontend`, e que o fallback
único (`llm`) continua funcionando quando o mapa não é fornecido.
"""

from langgraph.types import Command

from open_agentic_ops.graph import build_graph
from open_agentic_ops.persistence import build_dev_checkpointer


class _RegistradorLLM:
    """LLM mock que registra os prompts que recebeu."""

    def __init__(self, nome: str) -> None:
        self.nome = nome
        self.chamadas: list[str] = []

    def invoke(self, prompt: str, *, system: str | None = None) -> str:
        self.chamadas.append(prompt)
        return f"[{self.nome}] implementado"


def _rodar_ate_worktrees(app, thread_id: str) -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    app.invoke(
        {
            "origem": "regulatorio",
            "spec": (
                "Nova Instrução Normativa do BCB altera o Manual de Escopo de "
                "Dados e Serviços do Open Finance, introduzindo um campo ligado "
                "à portabilidade de crédito consignado."
            ),
        },
        config,
    )
    app.invoke(Command(resume={"decisao": "aprovado", "observacao": "ok"}), config)
    app.invoke(Command(resume={"spec": "Spec autorada pelo FDE."}), config)
    return app.invoke(Command(resume={"decisao": "aprovado", "observacao": "ok"}), config)


def test_llm_por_dominio_usa_provider_correto():
    backend = _RegistradorLLM("backend")
    frontend = _RegistradorLLM("frontend")
    app = build_graph(llm_por_dominio={"backend": backend, "frontend": frontend}).compile(
        checkpointer=build_dev_checkpointer()
    )

    result = _rodar_ate_worktrees(app, "wire-1")

    branches = {w["branch"]: w for w in result["worktrees"]}
    assert branches["feat/backend"]["resultado"].startswith("[backend]")
    assert branches["feat/frontend"]["resultado"].startswith("[frontend]")
    assert backend.chamadas
    assert frontend.chamadas


def test_llm_unico_fallback_para_ambos():
    unico = _RegistradorLLM("unico")
    app = build_graph(llm=unico).compile(checkpointer=build_dev_checkpointer())

    result = _rodar_ate_worktrees(app, "wire-2")

    branches = {w["branch"]: w for w in result["worktrees"]}
    assert branches["feat/backend"]["resultado"].startswith("[unico]")
    assert branches["feat/frontend"]["resultado"].startswith("[unico]")


def test_sem_llm_usa_fallback_deterministico():
    app = build_graph().compile(checkpointer=build_dev_checkpointer())

    result = _rodar_ate_worktrees(app, "wire-3")

    branches = {w["branch"]: w for w in result["worktrees"]}
    assert branches["feat/backend"]["resultado"].startswith("[implementado]")
    assert branches["feat/frontend"]["resultado"].startswith("[implementado]")
