"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  RotateCcw,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import type { LoopStage } from "@/components/loop-status";

const STORAGE_KEY = "fde-loop-node-positions";

const ESTADO_LABEL: Record<LoopStage["estado"], string> = {
  pendente: "Pendente",
  executando: "Executando",
  concluido: "Concluído",
  erro: "Erro",
  hitl: "Aguardando HITL",
};

function LoopNode({ data }: NodeProps) {
  const stage = data as unknown as LoopStage;
  return (
    <div
      className={cn(
        "w-44 rounded-xl border bg-card p-3 shadow-sm transition-colors",
        stage.estado === "executando" && "border-[#a78bfa]/60",
        stage.estado === "erro" && "border-[#ea5b0c]/60",
        stage.estado === "hitl" && "border-[#ea5b0c]/60",
      )}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{stage.label}</p>
        <StageMini estado={stage.estado} />
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {stage.agente}
      </p>
      {stage.duracao && (
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          {stage.duracao}
        </p>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function StageMini({ estado }: { estado: LoopStage["estado"] }) {
  if (estado === "concluido")
    return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (estado === "erro")
    return <TriangleAlert className="size-4 text-[#ea5b0c]" />;
  if (estado === "hitl")
    return <ShieldAlert className="size-4 animate-pulse text-[#ea5b0c]" />;
  if (estado === "executando")
    return <Loader2 className="size-4 animate-spin text-[#a78bfa]" />;
  return <span className="size-2 rounded-full bg-border" />;
}

const nodeTypes = { loop: LoopNode };

function posicaoPadrao(stages: LoopStage[]) {
  return stages.map((stage, i) => ({ x: i * 220, y: 0 }));
}

function LoopCanvasInner({
  stages,
  showToolbar = true,
}: {
  stages: LoopStage[];
  showToolbar?: boolean;
}) {
  const [selecionado, setSelecionado] = useState<LoopStage | null>(null);
  const [posicoes, setPosicoes] = useState<Record<string, { x: number; y: number }>>(
    () => {
      if (typeof window === "undefined") return {};
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    },
  );
  const { fitView } = useReactFlow();

  const nodes = useMemo<Node[]>(
    () =>
      stages.map((stage, i) => {
        const padrao = posicaoPadrao(stages)[i];
        const salvo = posicoes[stage.id];
        return {
          id: stage.id,
          type: "loop",
          position: salvo ?? padrao,
          data: stage as unknown as Record<string, unknown>,
        };
      }),
    [stages, posicoes],
  );

  const edges = useMemo<Edge[]>(
    () =>
      stages.slice(0, -1).map((stage, i) => ({
        id: `e-${stage.id}-${stages[i + 1].id}`,
        source: stage.id,
        target: stages[i + 1].id,
        animated: stages[i + 1].estado === "executando",
      })),
    [stages],
  );

  const onNodeClick = useCallback(
    (_: unknown, node: Node) =>
      setSelecionado(node.data as unknown as LoopStage),
    [],
  );

  const onNodeDragStop: OnNodeDrag = useCallback((_, node) => {
    setPosicoes((prev) => {
      const prox = { ...prev, [node.id]: node.position };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prox));
      } catch {
        // ignora falha de persistência
      }
      return prox;
    });
  }, []);

  function resetarLayout() {
    localStorage.removeItem(STORAGE_KEY);
    setPosicoes({});
    fitView({ padding: 0.2, duration: 400 });
  }

  return (
    <div className="flex h-full flex-col">
      {showToolbar && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Arraste os nós para reorganizar · role para zoom · clique num agente
            para detalhes
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={resetarLayout}
            className="h-8 gap-1 text-xs"
          >
            <RotateCcw className="size-3.5" /> Resetar layout
          </Button>
        </div>
      )}

      <div className="min-h-[420px] flex-1 rounded-xl border border-border/60 bg-muted/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          nodesConnectable={false}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} />
          <Controls />
        </ReactFlow>
      </div>

      <Sheet
        open={!!selecionado}
        onOpenChange={(open) => !open && setSelecionado(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selecionado?.label}
              {selecionado && (
                <Badge variant="outline">{ESTADO_LABEL[selecionado.estado]}</Badge>
              )}
            </SheetTitle>
            <SheetDescription>{selecionado?.agente}</SheetDescription>
          </SheetHeader>
          {selecionado && (
            <div className="space-y-5 px-4 pb-6">
              <div className="grid gap-4 grid-cols-2">
                <InfoItem label="Progresso" value={`${selecionado.progresso ?? 0}%`} />
                <InfoItem label="Duração" value={selecionado.duracao ?? "—"} />
              </div>
              {selecionado.inicio && (
                <InfoItem label="Início" value={selecionado.inicio} />
              )}

              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground opacity-60">
                  Histórico de eventos
                </p>
                {(selecionado.eventos ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum evento registrado.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {[...(selecionado.eventos ?? [])]
                      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                      .map((e, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <EventDot tipo={e.tipo} />
                          <div className="min-w-0">
                            <p className="text-sm">{e.mensagem}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {e.timestamp}
                            </p>
                          </div>
                        </li>
                      ))}
                  </ol>
                )}
              </div>

              {selecionado.link && (
                <Button asChild variant="outline" size="sm" className="gap-1">
                  <a href={selecionado.link} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" /> Abrir thread/spec
                  </a>
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function LoopCanvas(props: {
  stages: LoopStage[];
  showToolbar?: boolean;
}) {
  return (
    <ReactFlowProvider>
      <LoopCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground opacity-60">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function EventDot({ tipo }: { tipo: "info" | "sucesso" | "erro" | "hitl" }) {
  const cls =
    tipo === "sucesso"
      ? "bg-emerald-500"
      : tipo === "erro"
        ? "bg-red-500"
        : tipo === "hitl"
          ? "bg-orange-500"
          : "bg-primary";
  return <span className={`mt-1 size-2 shrink-0 rounded-full ${cls}`} />;
}
