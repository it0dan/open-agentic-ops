"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Clock,
  Columns3,
  Inbox,
  Layers,
  List,
  Loader2,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ColumnBoard } from "@/components/column-board";
import { FilterBar, type FilterGroup } from "@/components/filter-bar";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { listarDemandas } from "@/lib/api";
import {
  DOMINIO_LABEL,
  ORIGEM_LABEL,
  demandasMock,
  type Demanda,
  type Dominio,
  type Origem,
} from "@/lib/mock-data";

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "origem",
    label: "Origem",
    options: (Object.keys(ORIGEM_LABEL) as Origem[]).map((o) => ({
      value: o,
      label: ORIGEM_LABEL[o],
    })),
  },
  {
    key: "status",
    label: "Status",
    options: [
      { value: "aguardando_hitl", label: "HITL" },
      { value: "em_implementacao", label: "Implementação" },
      { value: "em_revisao", label: "Revisão" },
      { value: "monitorado", label: "Monitorado" },
    ],
  },
  {
    key: "dominio",
    label: "Domínio",
    options: (["backend", "frontend", "ambos"] as Dominio[]).map((d) => ({
      value: d,
      label: DOMINIO_LABEL[d],
    })),
  },
];

const POLL_INTERVAL = 4000;

function simularTick(d: Demanda): Demanda {
  if (d.progresso === undefined || d.progresso >= 100) return d;
  const incremento = d.status === "aguardando_hitl" ? 0 : 3;
  const novoProgresso = Math.min(100, d.progresso + incremento);
  return {
    ...d,
    progresso: novoProgresso,
    atualizado_em: new Date().toISOString(),
  };
}

export default function BoardPage() {
  const [demandas, setDemandas] = useState<Demanda[]>(demandasMock);
  const [carregando, setCarregando] = useState(true);
  const [usandoMock, setUsandoMock] = useState(false);
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<
    Record<string, Set<string>>
  >({});
  const [filtroKpi, setFiltroKpi] = useState<string | null>(null);
  const [visao, setVisao] = useState<"lista" | "colunas">(() => {
    if (typeof window === "undefined") return "lista";
    const salva = window.localStorage.getItem("fde-visao-demandas");
    return salva === "colunas" ? "colunas" : "lista";
  });

  useEffect(() => {
    localStorage.setItem("fde-visao-demandas", visao);
  }, [visao]);

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
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    buscar();
    const id = setInterval(buscar, POLL_INTERVAL);
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, []);

  // Simulação de avanço quando usando mock (loop vivo)
  useEffect(() => {
    if (!usandoMock) return;
    const id = setInterval(() => {
      setDemandas((prev) => prev.map(simularTick));
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [usandoMock]);

  const filtradas = useMemo(() => {
    return demandas.filter((d) => {
      const q = busca.toLowerCase();
      const matchBusca =
        !q || d.spec.toLowerCase().includes(q) || d.thread_id.includes(q);
      const matchOrigem =
        !selecionados.origem?.size || selecionados.origem.has(d.origem);
      const matchStatus =
        !selecionados.status?.size || selecionados.status.has(d.status);
      const matchDominio =
        !selecionados.dominio?.size || selecionados.dominio.has(d.dominio);
      return matchBusca && matchOrigem && matchStatus && matchDominio;
    });
  }, [demandas, busca, selecionados]);

  const kpis = useMemo(
    () => ({
      total: demandas.length,
      hitl: demandas.filter((d) => d.status === "aguardando_hitl").length,
      implementacao: demandas.filter((d) =>
        ["em_implementacao", "em_revisao"].includes(d.status),
      ).length,
      monitoradas: demandas.filter((d) => d.status === "monitorado").length,
    }),
    [demandas],
  );

  function toggleFiltro(groupKey: string, value: string) {
    setSelecionados((prev) => {
      const atual = new Set(prev[groupKey] ?? []);
      if (atual.has(value)) atual.delete(value);
      else atual.add(value);
      return { ...prev, [groupKey]: atual };
    });
  }

  function limparFiltros() {
    setSelecionados({});
    setBusca("");
    setFiltroKpi(null);
  }

  function aplicarFiltroKpi(kpi: string | null) {
    setFiltroKpi(kpi);
    setSelecionados((prev) => {
      const proximo = { ...prev };
      if (kpi === null) {
        delete proximo.status;
      } else {
        const statusSet = new Set<string>();
        if (kpi === "hitl") statusSet.add("aguardando_hitl");
        if (kpi === "andamento") {
          statusSet.add("em_implementacao");
          statusSet.add("em_revisao");
        }
        if (kpi === "monitoradas") statusSet.add("monitorado");
        proximo.status = statusSet;
      }
      return proximo;
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Demandas"
        description="Demandas da squad Open Agentic Ops"
        actions={
          <Button asChild className="rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
            <Link href="/intake">
              <Inbox className="mr-2 size-4" /> Nova demanda
            </Link>
          </Button>
        }
      />

      {/* KPIs — atalhos de filtro */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => aplicarFiltroKpi(filtroKpi === null ? null : null)}
          className="text-left"
        >
          <MetricCard
            icon={Layers}
            label="Total"
            value={kpis.total}
            tone="primary"
            ativo={filtroKpi === null}
          />
        </button>
        <button
          type="button"
          onClick={() => aplicarFiltroKpi(filtroKpi === "hitl" ? null : "hitl")}
          className="text-left"
        >
          <MetricCard
            icon={Clock}
            label="Aguardando HITL"
            value={kpis.hitl}
            tone="neutral"
            ativo={filtroKpi === "hitl"}
          />
        </button>
        <button
          type="button"
          onClick={() =>
            aplicarFiltroKpi(filtroKpi === "andamento" ? null : "andamento")
          }
          className="text-left"
        >
          <MetricCard
            icon={Activity}
            label="Em andamento"
            value={kpis.implementacao}
            tone="blue"
            ativo={filtroKpi === "andamento"}
          />
        </button>
        <button
          type="button"
          onClick={() =>
            aplicarFiltroKpi(filtroKpi === "monitoradas" ? null : "monitoradas")
          }
          className="text-left"
        >
          <MetricCard
            icon={ArrowUpRight}
            label="Monitoradas"
            value={kpis.monitoradas}
            tone="green"
            ativo={filtroKpi === "monitoradas"}
          />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar
          groups={FILTER_GROUPS}
          selected={selecionados}
          onToggle={toggleFiltro}
          onClear={limparFiltros}
          busca={busca}
          onBusca={setBusca}
          placeholder="Buscar por spec ou thread_id…"
        />
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <Button
            variant={visao === "lista" ? "default" : "ghost"}
            size="sm"
            onClick={() => setVisao("lista")}
            className="h-8 gap-1 text-xs"
          >
            <List className="size-3.5" /> Lista
          </Button>
          <Button
            variant={visao === "colunas" ? "default" : "ghost"}
            size="sm"
            onClick={() => setVisao("colunas")}
            className="h-8 gap-1 text-xs"
          >
            <Columns3 className="size-3.5" /> Colunas
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhuma demanda encontrada"
          description="Ajuste os filtros ou injete uma nova demanda pelo Intake."
        />
      ) : visao === "colunas" ? (
        <ColumnBoard demandas={filtradas} />
      ) : (
        <div className="space-y-3">
          {filtradas.map((d) => (
            <Link
              key={d.thread_id}
              href={`/tasks/${d.thread_id}`}
              className="card-elevated card-hover group block min-h-[8rem] rounded-2xl p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {ORIGEM_LABEL[d.origem] ?? d.origem}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {DOMINIO_LABEL[d.dominio] ?? d.dominio}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        d.ambiguidade === "alta"
                          ? "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                          : ""
                      }
                    >
                      {d.ambiguidade}
                    </Badge>
                    <span className="text-xs uppercase text-muted-foreground">
                      por {d.spec_autor}
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm font-medium text-foreground/90">
                    {d.spec}
                  </p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {d.thread_id}
                  </p>

                  {/* Progresso / agente em tempo real */}
                  {d.progresso !== undefined && d.progresso < 100 && (
                    <div className="mt-4 flex items-center gap-3">
                      <Progress value={d.progresso} className="h-1.5 w-40 [&>div]:transition-[width] [&>div]:duration-400 [&>div]:ease-out" />
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="size-3 animate-spin text-primary" />
                        {d.agente_atual ?? "Agente"} · {d.progresso}%
                      </span>
                      {d.erros ? (
                        <span className="text-xs text-destructive">
                          {d.erros} erro{d.erros > 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.status} />
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
