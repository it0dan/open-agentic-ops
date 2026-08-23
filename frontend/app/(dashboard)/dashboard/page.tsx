"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Clock,
  Layers,
  ShieldAlert,
} from "lucide-react";

import { LoopStatus } from "@/components/loop-status";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { listarDemandas } from "@/lib/api";
import { montarStages } from "@/lib/loop-stages";
import {
  demandasMock,
  type Demanda,
  type EventoLoop,
} from "@/lib/mock-data";

const POLL_INTERVAL = 4000;

function simularTick(d: Demanda): Demanda {
  if (d.progresso === undefined || d.progresso >= 100) return d;
  const incremento = d.status === "aguardando_hitl" ? 0 : 3;
  return {
    ...d,
    progresso: Math.min(100, d.progresso + incremento),
    atualizado_em: new Date().toISOString(),
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [demandas, setDemandas] = useState<Demanda[]>(demandasMock);
  const [usandoMock, setUsandoMock] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function buscar() {
      try {
        const data = await listarDemandas();
        if (!ativo) return;
        setDemandas(data);
        setUsandoMock(false);
      } catch {
        if (!ativo) return;
        setDemandas(demandasMock);
        setUsandoMock(true);
      }
    }
    buscar();
    const id = setInterval(buscar, POLL_INTERVAL);
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!usandoMock) return;
    const id = setInterval(() => {
      setDemandas((prev) => prev.map(simularTick));
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [usandoMock]);

  const kpis = useMemo(() => {
    const total = demandas.length;
    const emExecucao = demandas.filter((d) =>
      ["em_implementacao", "em_revisao"].includes(d.status),
    ).length;
    const hitl = demandas.filter((d) => d.status === "aguardando_hitl").length;
    const erros = demandas.reduce((acc, d) => acc + (d.erros ?? 0), 0);
    const progressoMedio = total
      ? Math.round(
          demandas.reduce((acc, d) => acc + (d.progresso ?? 0), 0) / total,
        )
      : 0;
    return { total, emExecucao, hitl, erros, progressoMedio };
  }, [demandas]);

  const eventos = useMemo(() => {
    const todos: (EventoLoop & { thread_id: string })[] = [];
    for (const d of demandas) {
      for (const e of d.eventos ?? []) {
        todos.push({ ...e, thread_id: d.thread_id });
      }
    }
    return todos.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);
  }, [demandas]);

  const destaque = useMemo(() => {
    const ordem: Record<string, number> = {
      aguardando_hitl: 0,
      em_implementacao: 1,
      em_revisao: 2,
      monitorado: 3,
    };
    return [...demandas].sort(
      (a, b) => (ordem[a.status] ?? 9) - (ordem[b.status] ?? 9),
    );
  }, [demandas]);

  const stages = useMemo(() => montarStages(demandas), [demandas]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Visão geral da squad em tempo real"
      />

      {/* KPIs globais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Layers} label="Total" value={kpis.total} tone="primary" />
        <MetricCard
          icon={Activity}
          label="Em execução"
          value={kpis.emExecucao}
          tone="blue"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Aguardando HITL"
          value={kpis.hitl}
          tone="neutral"
        />
        <MetricCard
          icon={Clock}
          label="Concluído médio"
          value={`${kpis.progressoMedio}%`}
          tone="green"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Squad Graph */}
        <div className="lg:col-span-2">
          <LoopStatus
            stages={stages}
            progresso={kpis.progressoMedio}
            erros={kpis.erros}
            hitlPendente={kpis.hitl}
            onExpand={() => router.push("/graph")}
          />
        </div>

        {/* Timeline de eventos */}
        <Collapsible defaultOpen className="lg:col-span-1">
          <Card className="card-elevated">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer select-none">
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                  Eventos recentes
                  <ChevronDown className="size-4 text-muted-foreground transition-transform data-[state=open]:rotate-180 lg:hidden" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {eventos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum evento registrado.
                  </p>
                ) : (
                  eventos.map((e, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <EventDot tipo={e.tipo} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{e.mensagem}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {e.agente} · {e.timestamp}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Últimas demandas — preview compacto */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">
            Últimas demandas
          </h2>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver demandas <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {destaque.slice(0, 3).map((d) => (
            <Link
              key={d.thread_id}
              href={`/tasks/${d.thread_id}`}
              className="card-elevated card-hover group flex items-center justify-between gap-3 rounded-2xl p-4"
            >
              <p className="line-clamp-2 text-sm font-medium">{d.spec}</p>
              <StatusBadge status={d.status} className="shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function EventDot({ tipo }: { tipo: EventoLoop["tipo"] }) {
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
