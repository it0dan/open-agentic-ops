"use client";

import { AlertTriangle, CheckCircle2, Expand, Loader2, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface LoopStage {
  id: string;
  label: string;
  agente: string;
  estado: "pendente" | "executando" | "concluido" | "erro" | "hitl";
  progresso?: number;
  ultimaAcao?: string;
  duracao?: string;
  inicio?: string;
  link?: string;
  eventos?: { timestamp: string; tipo: "info" | "sucesso" | "erro" | "hitl"; mensagem: string }[];
}

export function LoopStatus({
  stages,
  progresso,
  erros,
  hitlPendente,
  onExpand,
}: {
  stages: LoopStage[];
  progresso: number;
  erros: number;
  hitlPendente: number;
  onExpand?: () => void;
}) {
  return (
    <div
      role={onExpand ? "button" : undefined}
      tabIndex={onExpand ? 0 : undefined}
      onClick={onExpand}
      onKeyDown={(e) => {
        if (onExpand && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onExpand();
        }
      }}
      className={cn(
        "card-elevated card-hover rounded-2xl p-5",
        onExpand && "cursor-pointer",
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-sm font-semibold">Loop da squad</h3>
          <p className="text-xs text-muted-foreground">
            Execução em tempo real dos agentes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hitlPendente > 0 && (
            <Badge
              variant="outline"
              className="border-[#ea5b0c]/30 bg-[#ea5b0c]/10 text-[#ea5b0c]"
            >
              <ShieldAlert className="mr-1 size-3" /> {hitlPendente} HITL
            </Badge>
          )}
          {erros > 0 && (
            <Badge
              variant="outline"
              className="border-[#ea5b0c]/30 bg-[#ea5b0c]/10 text-[#ea5b0c]"
            >
              <AlertTriangle className="mr-1 size-3" /> {erros} erro
              {erros > 1 ? "s" : ""}
            </Badge>
          )}
          {onExpand && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              Ver loop completo <Expand className="size-3.5" />
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Progress value={progresso} className="h-2 [&>div]:transition-[width] [&>div]:duration-400 [&>div]:ease-out" />
        <span className="text-sm font-medium tabular-nums">{progresso}%</span>
      </div>

      <ol className="space-y-3">
        {stages.map((stage, i) => (
          <li key={stage.id} className="flex items-center gap-3">
            <div className="flex w-6 flex-col items-center">
              <StageIcon estado={stage.estado} />
              {i < stages.length - 1 && (
                <div className="h-5 w-px bg-border" />
              )}
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-sm",
                    stage.estado === "pendente" && "text-muted-foreground",
                  )}
                >
                  {stage.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {stage.agente}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {stage.duracao && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {stage.duracao}
                  </span>
                )}
                {stage.estado === "executando" && (
                  <span className="flex items-center gap-1.5 text-xs text-primary">
                    <Loader2 className="size-3 animate-spin" /> executando
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StageIcon({ estado }: { estado: LoopStage["estado"] }) {
  if (estado === "concluido")
    return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (estado === "erro")
    return (
      <span className="dot-halo-erro flex size-2 rounded-full bg-[#ea5b0c]" />
    );
  if (estado === "hitl")
    return (
      <span className="dot-halo-hitl flex size-2 rounded-full bg-[#ea5b0c]" />
    );
  if (estado === "executando")
    return (
      <span className="dot-halo-executando flex size-2 rounded-full bg-[#a78bfa]" />
    );
  return <span className="size-2 rounded-full bg-border" />;
}
