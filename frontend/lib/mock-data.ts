export type Origem = "cliente" | "regulatorio" | "estrategia" | "sre";
export type Ambiguidade = "baixa" | "alta";
export type SpecAutor = "intake" | "fde";
export type Dominio = "backend" | "frontend" | "ambos";
export type Status =
  | "triado"
  | "spec_pronta"
  | "em_implementacao"
  | "em_revisao"
  | "aguardando_hitl"
  | "aprovado"
  | "em_eval"
  | "deployado"
  | "monitorado";

export interface Worktree {
  dominio: Dominio;
  guia: string;
  branch: string;
  status: string;
  resultado: string | null;
}

export interface FeedbackReview {
  worktree: string;
  feedback: string;
  discorda_classificacao: boolean;
}

export interface Adr {
  titulo: string;
  conteudo: string;
}

export interface DecisaoHitl {
  aprovado: boolean;
  comentario: string | null;
}

export interface ResultadoEval {
  aprovado: boolean;
  detalhes: string | null;
}

export interface ClassificacaoIntake {
  dominio: Dominio;
  ambiguidade: Ambiguidade;
  justificativa: string[];
  timestamp: string;
}

export interface EventoLoop {
  timestamp: string;
  agente: string;
  tipo: "info" | "sucesso" | "erro" | "hitl";
  mensagem: string;
}

export interface Demanda {
  thread_id: string;
  origem: Origem;
  ambiguidade: Ambiguidade;
  spec_autor: SpecAutor;
  dominio: Dominio;
  status: Status;
  spec: string;
  spec_resumo?: string;
  worktrees: Worktree[];
  adrs: Adr[];
  feedback_review: FeedbackReview[];
  decisao_hitl?: DecisaoHitl;
  resultado_eval?: ResultadoEval;
  classificacao_intake?: ClassificacaoIntake;
  pii_masked?: boolean;
  progresso?: number;
  agente_atual?: string;
  erros?: number;
  eventos?: EventoLoop[];
  atualizado_em?: string;
}

export const demandasMock: Demanda[] = [
  {
    thread_id: "9f2c1a3e-7b4d-4c8e-9a1f-2d3e4f5a6b7c",
    origem: "regulatorio",
    ambiguidade: "alta",
    spec_autor: "fde",
    dominio: "backend",
    status: "aguardando_hitl",
    spec:
      "Nova Instrução Normativa do BCB altera o Manual de Escopo de Dados e Serviços do Open Finance, introduzindo um campo ligado à portabilidade de crédito consignado.",
    worktrees: [
      {
        dominio: "backend",
        guia: "backend-sensedia",
        branch: "feat/backend",
        status: "concluido",
        resultado: "Contrato de API atualizado com o novo campo.",
      },
      {
        dominio: "frontend",
        guia: "frontend-sensedia",
        branch: "feat/frontend",
        status: "concluido",
        resultado: "Campo exibido no formulário de portabilidade.",
      },
    ],
    adrs: [
      {
        titulo: "ADR-0014: Novo campo no contrato de portabilidade",
        conteudo:
          "O campo é obrigatório e segue o schema do Manual de Escopo vigente.",
      },
    ],
    feedback_review: [
      {
        worktree: "feat/backend",
        feedback: "Validar enum do novo campo contra a norma.",
        discorda_classificacao: false,
      },
      {
        worktree: "feat/frontend",
        feedback: "Adicionar máscara de CPF no campo.",
        discorda_classificacao: false,
      },
    ],
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "alta",
      justificativa: ["instrucao normativa", "portabilidade", "consignado"],
      timestamp: "2026-08-22T10:15:00Z",
    },
    pii_masked: true,
    progresso: 55,
    agente_atual: "Review Agent",
    erros: 0,
    atualizado_em: "2026-08-22T10:15:00Z",
    eventos: [
      {
        timestamp: "2026-08-22T10:15:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, alta ambiguidade.",
      },
      {
        timestamp: "2026-08-22T10:15:02Z",
        agente: "FDE",
        tipo: "info",
        mensagem: "Spec autorada pelo FDE (alta ambiguidade).",
      },
      {
        timestamp: "2026-08-22T10:15:03Z",
        agente: "Feature Agent (backend)",
        tipo: "sucesso",
        mensagem: "Worktree feat/backend implementado.",
      },
      {
        timestamp: "2026-08-22T10:15:04Z",
        agente: "Feature Agent (frontend)",
        tipo: "sucesso",
        mensagem: "Worktree feat/frontend implementado.",
      },
      {
        timestamp: "2026-08-22T10:15:05Z",
        agente: "Review Agent",
        tipo: "info",
        mensagem: "Feedback de review emitido. Aguardando HITL do FDE.",
      },
    ],
  },
  {
    thread_id: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    origem: "cliente",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "frontend",
    status: "em_implementacao",
    spec: "Adicionar botão de download no dashboard de investimentos.",
    worktrees: [
      {
        dominio: "frontend",
        guia: "frontend-sensedia",
        branch: "feat/frontend",
        status: "em_andamento",
        resultado: null,
      },
    ],
    adrs: [],
    feedback_review: [],
    classificacao_intake: {
      dominio: "frontend",
      ambiguidade: "baixa",
      justificativa: ["dashboard", "botao"],
      timestamp: "2026-08-21T14:02:00Z",
    },
    pii_masked: true,
    progresso: 35,
    agente_atual: "Feature Agent (frontend)",
    erros: 1,
    atualizado_em: "2026-08-21T14:02:00Z",
    eventos: [
      {
        timestamp: "2026-08-21T14:02:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: frontend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-21T14:02:02Z",
        agente: "Feature Agent (frontend)",
        tipo: "info",
        mensagem: "Implementando botão de download no dashboard.",
      },
      {
        timestamp: "2026-08-21T14:02:03Z",
        agente: "Feature Agent (frontend)",
        tipo: "erro",
        mensagem: "Falha no lint do componente. Corrigindo.",
      },
    ],
  },
  {
    thread_id: "7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b",
    origem: "sre",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "backend",
    status: "monitorado",
    spec: "Reduzir latência p95 do endpoint de extrato abaixo de 500ms.",
    worktrees: [
      {
        dominio: "backend",
        guia: "backend-sensedia",
        branch: "feat/backend",
        status: "concluido",
        resultado: "Cache de leitura implementado.",
      },
    ],
    adrs: [],
    feedback_review: [],
    decisao_hitl: { aprovado: true, comentario: "Aprovado." },
    resultado_eval: { aprovado: true, detalhes: "Trajectory eval passou." },
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "baixa",
      justificativa: ["latencia", "endpoint"],
      timestamp: "2026-08-20T09:30:00Z",
    },
    pii_masked: true,
    progresso: 100,
    agente_atual: "SRE Agent",
    erros: 0,
    atualizado_em: "2026-08-20T09:30:00Z",
    eventos: [
      {
        timestamp: "2026-08-20T09:30:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-20T09:30:02Z",
        agente: "Feature Agent (backend)",
        tipo: "sucesso",
        mensagem: "Cache de leitura implementado.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000001",
    origem: "cliente",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "frontend",
    status: "triado",
    spec: "Exibir saldo consolidado em múltiplas moedas no dashboard do app.",
    worktrees: [],
    adrs: [],
    feedback_review: [],
    classificacao_intake: {
      dominio: "frontend",
      ambiguidade: "baixa",
      justificativa: ["dashboard", "saldo", "moedas"],
      timestamp: "2026-08-22T11:00:00Z",
    },
    pii_masked: true,
    progresso: 5,
    agente_atual: "Intake Agent",
    erros: 0,
    atualizado_em: "2026-08-22T11:00:00Z",
    eventos: [
      {
        timestamp: "2026-08-22T11:00:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: frontend, baixa ambiguidade.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000002",
    origem: "regulatorio",
    ambiguidade: "alta",
    spec_autor: "fde",
    dominio: "backend",
    status: "spec_pronta",
    spec: "Adequar consentimento de compartilhamento de dados ao novo normativo do BCB.",
    worktrees: [],
    adrs: [
      {
        titulo: "ADR-0015: Consentimento explícito por escopo",
        conteudo: "Consentimento passa a exigir granularidade por escopo de dados.",
      },
    ],
    feedback_review: [],
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "alta",
      justificativa: ["normativo", "consentimento", "escopo"],
      timestamp: "2026-08-22T10:40:00Z",
    },
    pii_masked: true,
    progresso: 15,
    agente_atual: "FDE",
    erros: 0,
    atualizado_em: "2026-08-22T10:40:00Z",
    eventos: [
      {
        timestamp: "2026-08-22T10:40:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, alta ambiguidade.",
      },
      {
        timestamp: "2026-08-22T10:40:02Z",
        agente: "FDE",
        tipo: "info",
        mensagem: "Spec autorada pelo FDE (alta ambiguidade).",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000003",
    origem: "estrategia",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "ambos",
    status: "em_implementacao",
    spec: "Lançar onboarding digital com verificação facial para novos clientes PJ.",
    worktrees: [
      {
        dominio: "backend",
        guia: "backend-sensedia",
        branch: "feat/onboarding-backend",
        status: "em_andamento",
        resultado: null,
      },
      {
        dominio: "frontend",
        guia: "frontend-sensedia",
        branch: "feat/onboarding-frontend",
        status: "em_andamento",
        resultado: null,
      },
    ],
    adrs: [],
    feedback_review: [],
    classificacao_intake: {
      dominio: "ambos",
      ambiguidade: "baixa",
      justificativa: ["onboarding", "pj", "facial"],
      timestamp: "2026-08-21T16:20:00Z",
    },
    pii_masked: true,
    progresso: 40,
    agente_atual: "Feature Agent (backend)",
    erros: 0,
    atualizado_em: "2026-08-21T16:20:00Z",
    eventos: [
      {
        timestamp: "2026-08-21T16:20:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: ambos, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-21T16:20:02Z",
        agente: "Feature Agent (backend)",
        tipo: "info",
        mensagem: "Implementando fluxo de verificação facial.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000004",
    origem: "sre",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "backend",
    status: "em_revisao",
    spec: "Reduzir taxa de erro 5xx do gateway de pagamentos abaixo de 0,1%.",
    worktrees: [
      {
        dominio: "backend",
        guia: "backend-sensedia",
        branch: "feat/gateway-retry",
        status: "concluido",
        resultado: "Retry com backoff exponencial implementado.",
      },
    ],
    adrs: [],
    feedback_review: [
      {
        worktree: "feat/gateway-retry",
        feedback: "Adicionar circuit breaker no cliente HTTP.",
        discorda_classificacao: false,
      },
    ],
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "baixa",
      justificativa: ["gateway", "erro", "pagamento"],
      timestamp: "2026-08-21T13:10:00Z",
    },
    pii_masked: true,
    progresso: 65,
    agente_atual: "Review Agent",
    erros: 0,
    atualizado_em: "2026-08-21T13:10:00Z",
    eventos: [
      {
        timestamp: "2026-08-21T13:10:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-21T13:10:02Z",
        agente: "Review Agent",
        tipo: "info",
        mensagem: "Feedback de review emitido.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000005",
    origem: "cliente",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "frontend",
    status: "aguardando_hitl",
    spec: "Adicionar exportação de extratos em PDF no internet banking.",
    worktrees: [
      {
        dominio: "frontend",
        guia: "frontend-sensedia",
        branch: "feat/extrato-pdf",
        status: "concluido",
        resultado: "Exportação em PDF implementada.",
      },
    ],
    adrs: [],
    feedback_review: [],
    classificacao_intake: {
      dominio: "frontend",
      ambiguidade: "baixa",
      justificativa: ["extrato", "pdf", "exportacao"],
      timestamp: "2026-08-20T18:45:00Z",
    },
    pii_masked: true,
    progresso: 70,
    agente_atual: "FDE",
    erros: 0,
    atualizado_em: "2026-08-20T18:45:00Z",
    eventos: [
      {
        timestamp: "2026-08-20T18:45:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: frontend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-20T18:45:02Z",
        agente: "Feature Agent (frontend)",
        tipo: "sucesso",
        mensagem: "Exportação em PDF implementada.",
      },
      {
        timestamp: "2026-08-20T18:45:03Z",
        agente: "Review Agent",
        tipo: "info",
        mensagem: "Aguardando HITL do FDE.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000006",
    origem: "regulatorio",
    ambiguidade: "alta",
    spec_autor: "fde",
    dominio: "backend",
    status: "aprovado",
    spec: "Implementar jornada de portabilidade de salário conforme nova resolução.",
    worktrees: [
      {
        dominio: "backend",
        guia: "backend-sensedia",
        branch: "feat/portabilidade-salario",
        status: "concluido",
        resultado: "Jornada de portabilidade implementada.",
      },
    ],
    adrs: [
      {
        titulo: "ADR-0016: Portabilidade de salário",
        conteudo: "Integração com o sistema central de folha de pagamento.",
      },
    ],
    feedback_review: [],
    decisao_hitl: { aprovado: true, comentario: "Aprovado pelo FDE." },
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "alta",
      justificativa: ["portabilidade", "salario", "resolucao"],
      timestamp: "2026-08-19T09:00:00Z",
    },
    pii_masked: true,
    progresso: 80,
    agente_atual: "Eval Gate",
    erros: 0,
    atualizado_em: "2026-08-19T09:00:00Z",
    eventos: [
      {
        timestamp: "2026-08-19T09:00:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, alta ambiguidade.",
      },
      {
        timestamp: "2026-08-19T09:00:02Z",
        agente: "FDE",
        tipo: "sucesso",
        mensagem: "Gate HITL aprovado.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000007",
    origem: "estrategia",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "frontend",
    status: "em_eval",
    spec: "Redesenhar tela de investimentos com gráficos interativos.",
    worktrees: [
      {
        dominio: "frontend",
        guia: "frontend-sensedia",
        branch: "feat/investimentos-graficos",
        status: "concluido",
        resultado: "Gráficos interativos implementados.",
      },
    ],
    adrs: [],
    feedback_review: [],
    decisao_hitl: { aprovado: true, comentario: "Aprovado." },
    classificacao_intake: {
      dominio: "frontend",
      ambiguidade: "baixa",
      justificativa: ["investimentos", "graficos", "redesign"],
      timestamp: "2026-08-19T14:30:00Z",
    },
    pii_masked: true,
    progresso: 85,
    agente_atual: "Eval Gate",
    erros: 0,
    atualizado_em: "2026-08-19T14:30:00Z",
    eventos: [
      {
        timestamp: "2026-08-19T14:30:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: frontend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-19T14:30:02Z",
        agente: "Eval Gate",
        tipo: "info",
        mensagem: "Rodando trajectory eval.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000008",
    origem: "sre",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "backend",
    status: "deployado",
    spec: "Automatizar rollback de deploys com detecção de anomalias.",
    worktrees: [
      {
        dominio: "backend",
        guia: "backend-sensedia",
        branch: "feat/rollback-automatico",
        status: "concluido",
        resultado: "Rollback automático implementado.",
      },
    ],
    adrs: [],
    feedback_review: [],
    decisao_hitl: { aprovado: true, comentario: "Aprovado." },
    resultado_eval: { aprovado: true, detalhes: "Trajectory eval passou." },
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "baixa",
      justificativa: ["rollback", "anomalia", "deploy"],
      timestamp: "2026-08-18T11:15:00Z",
    },
    pii_masked: true,
    progresso: 95,
    agente_atual: "Platform Agent",
    erros: 0,
    atualizado_em: "2026-08-18T11:15:00Z",
    eventos: [
      {
        timestamp: "2026-08-18T11:15:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-18T11:15:02Z",
        agente: "Platform Agent",
        tipo: "sucesso",
        mensagem: "Deploy realizado.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000009",
    origem: "cliente",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "frontend",
    status: "monitorado",
    spec: "Melhorar acessibilidade do portal com contraste e navegação por teclado.",
    worktrees: [
      {
        dominio: "frontend",
        guia: "frontend-sensedia",
        branch: "feat/acessibilidade",
        status: "concluido",
        resultado: "Acessibilidade aprimorada.",
      },
    ],
    adrs: [],
    feedback_review: [],
    decisao_hitl: { aprovado: true, comentario: "Aprovado." },
    resultado_eval: { aprovado: true, detalhes: "Trajectory eval passou." },
    classificacao_intake: {
      dominio: "frontend",
      ambiguidade: "baixa",
      justificativa: ["acessibilidade", "contraste", "teclado"],
      timestamp: "2026-08-17T10:00:00Z",
    },
    pii_masked: true,
    progresso: 100,
    agente_atual: "SRE Agent",
    erros: 0,
    atualizado_em: "2026-08-17T10:00:00Z",
    eventos: [
      {
        timestamp: "2026-08-17T10:00:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: frontend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-17T10:00:02Z",
        agente: "SRE Agent",
        tipo: "info",
        mensagem: "Demanda monitorada.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000010",
    origem: "regulatorio",
    ambiguidade: "alta",
    spec_autor: "fde",
    dominio: "backend",
    status: "triado",
    spec: "Tratar novo campo de renda declarada no cadastro de clientes PF.",
    worktrees: [],
    adrs: [],
    feedback_review: [],
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "alta",
      justificativa: ["renda", "cadastro", "pf"],
      timestamp: "2026-08-22T12:30:00Z",
    },
    pii_masked: true,
    progresso: 5,
    agente_atual: "Intake Agent",
    erros: 0,
    atualizado_em: "2026-08-22T12:30:00Z",
    eventos: [
      {
        timestamp: "2026-08-22T12:30:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, alta ambiguidade.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000011",
    origem: "estrategia",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "ambos",
    status: "spec_pronta",
    spec: "Criar programa de cashback integrado ao app e ao core bancário.",
    worktrees: [],
    adrs: [],
    feedback_review: [],
    classificacao_intake: {
      dominio: "ambos",
      ambiguidade: "baixa",
      justificativa: ["cashback", "programa", "integracao"],
      timestamp: "2026-08-22T09:15:00Z",
    },
    pii_masked: true,
    progresso: 15,
    agente_atual: "Intake Agent",
    erros: 0,
    atualizado_em: "2026-08-22T09:15:00Z",
    eventos: [
      {
        timestamp: "2026-08-22T09:15:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: ambos, baixa ambiguidade.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000012",
    origem: "sre",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "backend",
    status: "em_implementacao",
    spec: "Adicionar tracing distribuído nas chamadas entre microsserviços.",
    worktrees: [
      {
        dominio: "backend",
        guia: "backend-sensedia",
        branch: "feat/tracing",
        status: "em_andamento",
        resultado: null,
      },
    ],
    adrs: [],
    feedback_review: [],
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "baixa",
      justificativa: ["tracing", "microsservicos", "observabilidade"],
      timestamp: "2026-08-21T15:00:00Z",
    },
    pii_masked: true,
    progresso: 45,
    agente_atual: "Feature Agent (backend)",
    erros: 1,
    atualizado_em: "2026-08-21T15:00:00Z",
    eventos: [
      {
        timestamp: "2026-08-21T15:00:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-21T15:00:02Z",
        agente: "Feature Agent (backend)",
        tipo: "erro",
        mensagem: "Falha na instrumentação do span. Corrigindo.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000013",
    origem: "cliente",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "frontend",
    status: "em_revisao",
    spec: "Permitir agendamento de pagamentos recorrentes no app.",
    worktrees: [
      {
        dominio: "frontend",
        guia: "frontend-sensedia",
        branch: "feat/pagamento-recorrente",
        status: "concluido",
        resultado: "Agendamento recorrente implementado.",
      },
    ],
    adrs: [],
    feedback_review: [
      {
        worktree: "feat/pagamento-recorrente",
        feedback: "Validar regra de dia útil para débito automático.",
        discorda_classificacao: false,
      },
    ],
    classificacao_intake: {
      dominio: "frontend",
      ambiguidade: "baixa",
      justificativa: ["pagamento", "recorrente", "agendamento"],
      timestamp: "2026-08-20T20:00:00Z",
    },
    pii_masked: true,
    progresso: 60,
    agente_atual: "Review Agent",
    erros: 0,
    atualizado_em: "2026-08-20T20:00:00Z",
    eventos: [
      {
        timestamp: "2026-08-20T20:00:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: frontend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-20T20:00:02Z",
        agente: "Review Agent",
        tipo: "info",
        mensagem: "Feedback de review emitido.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000014",
    origem: "regulatorio",
    ambiguidade: "alta",
    spec_autor: "fde",
    dominio: "backend",
    status: "aguardando_hitl",
    spec: "Implementar limites de transação PIX conforme nova circular.",
    worktrees: [
      {
        dominio: "backend",
        guia: "backend-sensedia",
        branch: "feat/limites-pix",
        status: "concluido",
        resultado: "Limites de PIX implementados.",
      },
    ],
    adrs: [
      {
        titulo: "ADR-0017: Limites PIX",
        conteudo: "Limites configuráveis por perfil de cliente.",
      },
    ],
    feedback_review: [],
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "alta",
      justificativa: ["pix", "limites", "circular"],
      timestamp: "2026-08-19T17:00:00Z",
    },
    pii_masked: true,
    progresso: 75,
    agente_atual: "FDE",
    erros: 0,
    atualizado_em: "2026-08-19T17:00:00Z",
    eventos: [
      {
        timestamp: "2026-08-19T17:00:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, alta ambiguidade.",
      },
      {
        timestamp: "2026-08-19T17:00:02Z",
        agente: "Review Agent",
        tipo: "info",
        mensagem: "Aguardando HITL do FDE.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000015",
    origem: "estrategia",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "frontend",
    status: "aprovado",
    spec: "Lançar campanha de indicação com recompensa em pontos.",
    worktrees: [
      {
        dominio: "frontend",
        guia: "frontend-sensedia",
        branch: "feat/indicacao",
        status: "concluido",
        resultado: "Fluxo de indicação implementado.",
      },
    ],
    adrs: [],
    feedback_review: [],
    decisao_hitl: { aprovado: true, comentario: "Aprovado." },
    classificacao_intake: {
      dominio: "frontend",
      ambiguidade: "baixa",
      justificativa: ["indicacao", "campanha", "pontos"],
      timestamp: "2026-08-18T13:00:00Z",
    },
    pii_masked: true,
    progresso: 82,
    agente_atual: "Eval Gate",
    erros: 0,
    atualizado_em: "2026-08-18T13:00:00Z",
    eventos: [
      {
        timestamp: "2026-08-18T13:00:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: frontend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-18T13:00:02Z",
        agente: "FDE",
        tipo: "sucesso",
        mensagem: "Gate HITL aprovado.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000016",
    origem: "sre",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "backend",
    status: "em_eval",
    spec: "Implementar cache distribuído para reduzir carga no banco de dados.",
    worktrees: [
      {
        dominio: "backend",
        guia: "backend-sensedia",
        branch: "feat/cache-distribuido",
        status: "concluido",
        resultado: "Cache distribuído implementado.",
      },
    ],
    adrs: [],
    feedback_review: [],
    decisao_hitl: { aprovado: true, comentario: "Aprovado." },
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "baixa",
      justificativa: ["cache", "distribuido", "banco"],
      timestamp: "2026-08-17T16:00:00Z",
    },
    pii_masked: true,
    progresso: 88,
    agente_atual: "Eval Gate",
    erros: 0,
    atualizado_em: "2026-08-17T16:00:00Z",
    eventos: [
      {
        timestamp: "2026-08-17T16:00:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-17T16:00:02Z",
        agente: "Eval Gate",
        tipo: "info",
        mensagem: "Rodando trajectory eval.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000017",
    origem: "cliente",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "frontend",
    status: "deployado",
    spec: "Adicionar modo escuro no portal de autoatendimento.",
    worktrees: [
      {
        dominio: "frontend",
        guia: "frontend-sensedia",
        branch: "feat/modo-escuro",
        status: "concluido",
        resultado: "Modo escuro implementado.",
      },
    ],
    adrs: [],
    feedback_review: [],
    decisao_hitl: { aprovado: true, comentario: "Aprovado." },
    resultado_eval: { aprovado: true, detalhes: "Trajectory eval passou." },
    classificacao_intake: {
      dominio: "frontend",
      ambiguidade: "baixa",
      justificativa: ["modo escuro", "portal", "tema"],
      timestamp: "2026-08-16T12:00:00Z",
    },
    pii_masked: true,
    progresso: 96,
    agente_atual: "Platform Agent",
    erros: 0,
    atualizado_em: "2026-08-16T12:00:00Z",
    eventos: [
      {
        timestamp: "2026-08-16T12:00:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: frontend, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-16T12:00:02Z",
        agente: "Platform Agent",
        tipo: "sucesso",
        mensagem: "Deploy realizado.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000018",
    origem: "regulatorio",
    ambiguidade: "alta",
    spec_autor: "fde",
    dominio: "backend",
    status: "monitorado",
    spec: "Garantir conformidade com a LGPD no armazenamento de dados biométricos.",
    worktrees: [
      {
        dominio: "backend",
        guia: "backend-sensedia",
        branch: "feat/lgpd-biometria",
        status: "concluido",
        resultado: "Armazenamento biométrico em conformidade.",
      },
    ],
    adrs: [
      {
        titulo: "ADR-0018: Biometria e LGPD",
        conteudo: "Dados biométricos criptografados e com política de retenção.",
      },
    ],
    feedback_review: [],
    decisao_hitl: { aprovado: true, comentario: "Aprovado." },
    resultado_eval: { aprovado: true, detalhes: "Trajectory eval passou." },
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "alta",
      justificativa: ["lgpd", "biometria", "conformidade"],
      timestamp: "2026-08-15T09:00:00Z",
    },
    pii_masked: true,
    progresso: 100,
    agente_atual: "SRE Agent",
    erros: 0,
    atualizado_em: "2026-08-15T09:00:00Z",
    eventos: [
      {
        timestamp: "2026-08-15T09:00:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, alta ambiguidade.",
      },
      {
        timestamp: "2026-08-15T09:00:02Z",
        agente: "SRE Agent",
        tipo: "info",
        mensagem: "Demanda monitorada.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000019",
    origem: "estrategia",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "ambos",
    status: "em_implementacao",
    spec: "Integrar assistente virtual de atendimento ao canal de WhatsApp.",
    worktrees: [
      {
        dominio: "backend",
        guia: "backend-sensedia",
        branch: "feat/whatsapp-backend",
        status: "em_andamento",
        resultado: null,
      },
      {
        dominio: "frontend",
        guia: "frontend-sensedia",
        branch: "feat/whatsapp-frontend",
        status: "em_andamento",
        resultado: null,
      },
    ],
    adrs: [],
    feedback_review: [],
    classificacao_intake: {
      dominio: "ambos",
      ambiguidade: "baixa",
      justificativa: ["whatsapp", "assistente", "atendimento"],
      timestamp: "2026-08-22T08:00:00Z",
    },
    pii_masked: true,
    progresso: 30,
    agente_atual: "Feature Agent (frontend)",
    erros: 0,
    atualizado_em: "2026-08-22T08:00:00Z",
    eventos: [
      {
        timestamp: "2026-08-22T08:00:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: ambos, baixa ambiguidade.",
      },
      {
        timestamp: "2026-08-22T08:00:02Z",
        agente: "Feature Agent (frontend)",
        tipo: "info",
        mensagem: "Implementando integração com WhatsApp.",
      },
    ],
  },
  {
    thread_id: "a1b2c3d4-1111-4aaa-8bbb-000000000020",
    origem: "sre",
    ambiguidade: "baixa",
    spec_autor: "intake",
    dominio: "backend",
    status: "triado",
    spec: "Configurar alertas proativos de degradação de performance no app.",
    worktrees: [],
    adrs: [],
    feedback_review: [],
    classificacao_intake: {
      dominio: "backend",
      ambiguidade: "baixa",
      justificativa: ["alertas", "performance", "degradacao"],
      timestamp: "2026-08-22T13:45:00Z",
    },
    pii_masked: true,
    progresso: 5,
    agente_atual: "Intake Agent",
    erros: 0,
    atualizado_em: "2026-08-22T13:45:00Z",
    eventos: [
      {
        timestamp: "2026-08-22T13:45:01Z",
        agente: "Intake Agent",
        tipo: "sucesso",
        mensagem: "Demanda classificada: backend, baixa ambiguidade.",
      },
    ],
  },
];

export const ORIGEM_LABEL: Record<Origem, string> = {
  cliente: "Cliente",
  regulatorio: "Regulatório",
  estrategia: "Estratégia",
  sre: "SRE",
};

export const DOMINIO_LABEL: Record<Dominio, string> = {
  backend: "Backend",
  frontend: "Frontend",
  ambos: "Ambos",
};

export const STATUS_LABEL: Record<Status, string> = {
  triado: "Triado",
  spec_pronta: "Spec pronta",
  em_implementacao: "Em implementação",
  em_revisao: "Em revisão",
  aguardando_hitl: "Aguardando HITL",
  aprovado: "Aprovado",
  em_eval: "Em eval",
  deployado: "Deployado",
  monitorado: "Monitorado",
};
