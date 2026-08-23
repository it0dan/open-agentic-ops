import type { LoopStage } from "@/components/loop-status";
import type { Demanda } from "@/lib/mock-data";

export function montarStages(demandas: Demanda[]): LoopStage[] {
  const emExecucao = demandas.some((d) =>
    ["em_implementacao", "em_revisao"].includes(d.status),
  );
  const hitl = demandas.filter((d) => d.status === "aguardando_hitl");
  const monitoradas = demandas.filter((d) => d.status === "monitorado").length;
  const erros = demandas.reduce((acc, d) => acc + (d.erros ?? 0), 0);
  const emEval = demandas.filter((d) => d.status === "em_eval");
  const progressoMedio = demandas.length
    ? Math.round(
        demandas.reduce((acc, d) => acc + (d.progresso ?? 0), 0) /
          demandas.length,
      )
    : 0;

  return [
    {
      id: "intake",
      label: "Intake",
      agente: "Intake Agent",
      estado: "concluido",
      progresso: 100,
      ultimaAcao: "Classificou domínio e ambiguidade das novas demandas.",
      duracao: "0m 12s",
      inicio: "10:15:00",
      eventos: [
        {
          timestamp: "10:15:00",
          tipo: "sucesso",
          mensagem: "Demanda recebida e classificada por domínio e ambiguidade.",
        },
        {
          timestamp: "10:15:12",
          tipo: "info",
          mensagem: "Spec rascunhada para baixa ambiguidade com precedente.",
        },
      ],
    },
    {
      id: "feature_backend",
      label: "Feature Backend",
      agente: "Feature Agent",
      estado: emExecucao ? "executando" : "concluido",
      progresso: emExecucao ? Math.max(20, progressoMedio) : 100,
      ultimaAcao: emExecucao
        ? "Implementando spec aprovada no domínio backend."
        : "Feature backend implementada conforme spec.",
      duracao: emExecucao ? "2m 04s" : "3m 01s",
      inicio: "10:15:13",
      eventos: [
        {
          timestamp: "10:15:13",
          tipo: "info",
          mensagem: "Worktree backend criado a partir do guia do domínio.",
        },
        {
          timestamp: "10:16:40",
          tipo: "sucesso",
          mensagem: "Contrato de API atualizado com o novo campo.",
        },
        ...(emExecucao
          ? [
              {
                timestamp: "10:17:17",
                tipo: "info",
                mensagem: "Implementando spec aprovada no domínio backend.",
              } as const,
            ]
          : []),
      ],
    },
    {
      id: "feature_frontend",
      label: "Feature Frontend",
      agente: "Feature Agent",
      estado: emExecucao ? "executando" : "concluido",
      progresso: emExecucao ? Math.max(20, progressoMedio) : 100,
      ultimaAcao: emExecucao
        ? "Implementando spec aprovada no domínio frontend."
        : "Feature frontend implementada conforme spec.",
      duracao: emExecucao ? "1m 58s" : "2m 47s",
      inicio: "10:15:13",
      eventos: [
        {
          timestamp: "10:15:13",
          tipo: "info",
          mensagem: "Worktree frontend criado a partir do guia do domínio.",
        },
        {
          timestamp: "10:16:35",
          tipo: "sucesso",
          mensagem: "Componentes de interface atualizados.",
        },
        ...(emExecucao
          ? [
              {
                timestamp: "10:17:17",
                tipo: "info",
                mensagem: "Implementando spec aprovada no domínio frontend.",
              } as const,
            ]
          : []),
      ],
    },
    {
      id: "review",
      label: "Review",
      agente: "Review Agent",
      estado: emExecucao ? "executando" : "concluido",
      progresso: emExecucao ? Math.max(10, progressoMedio - 20) : 100,
      ultimaAcao: emExecucao
        ? "Revisando PR contra padrões do time."
        : "Feedback de PR concluído.",
      duracao: emExecucao ? "1m 09s" : "1m 02s",
      inicio: "10:17:18",
      eventos: [
        {
          timestamp: "10:17:18",
          tipo: "info",
          mensagem: "PR aberto para revisão contra padrões do time.",
        },
        {
          timestamp: "10:18:20",
          tipo: "sucesso",
          mensagem: "Feedback de review emitido sem discordância.",
        },
      ],
    },
    {
      id: "hitl",
      label: "HITL",
      agente: "FDE",
      estado: hitl.length > 0 ? "hitl" : "concluido",
      progresso: hitl.length > 0 ? 50 : 100,
      thread_id: hitl[0]?.thread_id,
      ultimaAcao:
        hitl.length > 0
          ? "Aguardando aprovação humana no gate de merge."
          : "Gate aprovado pelo FDE.",
      duracao: hitl.length > 0 ? "—" : "0m 05s",
      inicio: "10:18:21",
      eventos: [
        ...(hitl.length > 0
          ? [
              {
                timestamp: "10:18:21",
                tipo: "hitl",
                mensagem: "Aguardando decisão do FDE no gate de merge.",
              } as const,
            ]
          : [
              {
                timestamp: "10:18:21",
                tipo: "sucesso",
                mensagem: "Gate aprovado pelo FDE.",
              } as const,
            ]),
      ],
    },
    {
      id: "eval",
      label: "Eval",
      agente: "Eval Gate",
      estado: erros > 0 ? "erro" : "concluido",
      progresso: erros > 0 ? 60 : 100,
      resultado_eval: emEval[0]?.resultado_eval,
      ultimaAcao:
        erros > 0
          ? "Trajectory eval reprovou com falhas de conformidade."
          : "Trajectory eval aprovado (PromptFoo).",
      duracao: erros > 0 ? "0m 00s" : "0m 03s",
      inicio: "10:18:26",
      eventos: [
        ...(erros > 0
          ? [
              {
                timestamp: "10:18:26",
                tipo: "erro",
                mensagem: "Trajectory eval reprovou com falhas de conformidade.",
              } as const,
            ]
          : [
              {
                timestamp: "10:18:26",
                tipo: "sucesso",
                mensagem: "Trajectory eval aprovado (PromptFoo).",
              } as const,
            ]),
      ],
    },
    {
      id: "deploy",
      label: "Deploy",
      agente: "Platform Agent",
      estado: monitoradas > 0 ? "concluido" : "pendente",
      progresso: monitoradas > 0 ? 100 : 0,
      ultimaAcao:
        monitoradas > 0
          ? "Deploy realizado e ambiente saudável."
          : "Aguardando feature pronta para deploy.",
      duracao: monitoradas > 0 ? "1m 40s" : "—",
      inicio: monitoradas > 0 ? "10:18:29" : undefined,
      eventos: [
        ...(monitoradas > 0
          ? [
              {
                timestamp: "10:18:29",
                tipo: "sucesso",
                mensagem: "Deploy realizado e ambiente saudável.",
              } as const,
            ]
          : []),
      ],
    },
    {
      id: "monitor",
      label: "Monitor",
      agente: "SRE Agent",
      estado: monitoradas > 0 ? "concluido" : "pendente",
      progresso: monitoradas > 0 ? 100 : 0,
      ultimaAcao:
        monitoradas > 0
          ? "SLOs dentro do error budget."
          : "Nada em monitoramento ativo.",
      duracao: monitoradas > 0 ? "contínuo" : "—",
      inicio: monitoradas > 0 ? "10:20:09" : undefined,
      eventos: [
        ...(monitoradas > 0
          ? [
              {
                timestamp: "10:20:09",
                tipo: "info",
                mensagem: "Demanda monitorada. SLOs dentro do error budget.",
              } as const,
            ]
          : []),
      ],
    },
  ];
}
