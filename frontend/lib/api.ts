import type { Demanda, Origem, OrigemSubtipo, Prioridade } from "@/lib/mock-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      // corpo não-JSON: mantém o status
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function listarDemandas(): Promise<Demanda[]> {
  return request<Demanda[]>("/tasks");
}

export function obterDemanda(threadId: string): Promise<Demanda> {
  return request<Demanda>(`/tasks/${threadId}`);
}

export interface ResumePayload {
  thread_id: string;
  decisao?: "aprovado" | "aprovado_com_ressalvas" | "rejeitado";
  observacao?: string | null;
  spec?: string;
}

export function aprovarDemanda(payload: ResumePayload): Promise<Demanda> {
  return request<Demanda>("/resume", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function autorarSpec(threadId: string, spec: string): Promise<Demanda> {
  return request<Demanda>("/resume", {
    method: "POST",
    body: JSON.stringify({ thread_id: threadId, spec }),
  });
}

export interface IntakePayload {
  origem: Origem;
  origem_subtipo?: OrigemSubtipo;
  prioridade?: Prioridade;
  titulo?: string;
  texto: string;
}

export function injetarDemanda(payload: IntakePayload): Promise<Demanda> {
  return request<Demanda>("/intake", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ClassificacaoAuditoria {
  thread_id: string;
  dominio: string;
  ambiguidade: string;
  justificativa: string[];
  timestamp: string;
}

export function listarAuditoria(): Promise<ClassificacaoAuditoria[]> {
  return request<ClassificacaoAuditoria[]>("/auditoria");
}

export interface HeuristicaPayload {
  categoria: "backend" | "frontend" | "alta_ambiguidade";
  palavra: string;
  acao: "add" | "remove";
}

export interface Heuristica {
  backend: string[];
  frontend: string[];
  alta_ambiguidade: string[];
}

export function corrigirHeuristica(payload: HeuristicaPayload): Promise<Heuristica> {
  return request<Heuristica>("/auditoria/heuristica", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
