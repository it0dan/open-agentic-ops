"use client";

import { useEffect, useMemo, useState } from "react";
import { LoopCanvas } from "@/components/loop-canvas";
import { listarDemandas } from "@/lib/api";
import { montarStages } from "@/lib/loop-stages";
import { demandasMock, type Demanda } from "@/lib/mock-data";

const POLL_INTERVAL = 4000;

export default function GraphPage() {
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
      setDemandas((prev) =>
        prev.map((d) => {
          if (d.progresso === undefined || d.progresso >= 100) return d;
          const incremento = d.status === "aguardando_hitl" ? 0 : 3;
          return {
            ...d,
            progresso: Math.min(100, d.progresso + incremento),
            atualizado_em: new Date().toISOString(),
          };
        }),
      );
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [usandoMock]);

  const stages = useMemo(() => montarStages(demandas), [demandas]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col px-6 py-4">
      <div className="min-h-0 flex-1">
        <LoopCanvas stages={stages} />
      </div>
    </div>
  );
}
