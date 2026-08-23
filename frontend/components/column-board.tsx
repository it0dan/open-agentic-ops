"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DOMINIO_LABEL,
  ORIGEM_LABEL,
  STATUS_LABEL,
  type Demanda,
  type Status,
} from "@/lib/mock-data";

const FLUXO: Status[] = [
  "triado",
  "spec_pronta",
  "em_implementacao",
  "em_revisao",
  "aguardando_hitl",
  "aprovado",
  "em_eval",
  "deployado",
  "monitorado",
];

function ColumnCard({ demanda }: { demanda: Demanda }) {
  return (
    <Link
      href={`/registry/${demanda.thread_id}`}
      className="block rounded-xl border border-border/60 bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px]">
          {ORIGEM_LABEL[demanda.origem]}
        </Badge>
        <Badge variant="outline" className="text-[10px] capitalize">
          {DOMINIO_LABEL[demanda.dominio]}
        </Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium">{demanda.spec}</p>
      {demanda.progresso !== undefined && (
        <div className="mt-2 flex items-center gap-2">
          <Progress value={demanda.progresso} className="h-1.5" />
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {demanda.progresso}%
          </span>
        </div>
      )}
    </Link>
  );
}

export function ColumnBoard({ demandas }: { demandas: Demanda[] }) {
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());

  const porColuna = useMemo(() => {
    const mapa = new Map<Status, Demanda[]>();
    for (const s of FLUXO) mapa.set(s, []);
    for (const d of demandas) {
      mapa.get(d.status)?.push(d);
    }
    return mapa;
  }, [demandas]);

  function toggleExpansao(status: Status) {
    setExpandidas((prev) => {
      const prox = new Set(prev);
      if (prox.has(status)) prox.delete(status);
      else prox.add(status);
      return prox;
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {FLUXO.map((status) => {
        const cards = porColuna.get(status) ?? [];
        const vazia = cards.length === 0;
        const expandida = expandidas.has(status);

        if (vazia && !expandida) {
          return (
            <button
              key={status}
              type="button"
              onClick={() => toggleExpansao(status)}
              title={`${STATUS_LABEL[status]} (vazia) — clique para expandir`}
              className="flex w-12 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span
                className="whitespace-nowrap text-[11px] font-medium text-muted-foreground"
                style={{ writingMode: "vertical-rl" }}
              >
                {STATUS_LABEL[status]}
              </span>
            </button>
          );
        }

        return (
          <div
            key={status}
            className="flex min-h-[200px] w-64 shrink-0 flex-col rounded-xl border border-border/60 bg-muted/20 p-2"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold">{STATUS_LABEL[status]}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                {cards.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {cards.map((d) => (
                <ColumnCard key={d.thread_id} demanda={d} />
              ))}
              {cards.length === 0 && (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">
                  Nenhuma demanda neste estágio
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
