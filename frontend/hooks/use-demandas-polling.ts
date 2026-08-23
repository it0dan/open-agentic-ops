"use client";

import { useEffect, useState } from "react";

import { listarDemandas } from "@/lib/api";
import { demandasMock, type Demanda } from "@/lib/mock-data";

export const POLL_INTERVAL = 4000;

function simularTick(d: Demanda): Demanda {
  if (d.progresso === undefined || d.progresso >= 100) return d;
  const incremento = d.status === "aguardando_hitl" ? 0 : 3;
  return {
    ...d,
    progresso: Math.min(100, d.progresso + incremento),
    atualizado_em: new Date().toISOString(),
  };
}

export function useDemandasPolling() {
  const [demandas, setDemandas] = useState<Demanda[]>(demandasMock);
  const [usandoMock, setUsandoMock] = useState(false);
  const [carregando, setCarregando] = useState(true);

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

  useEffect(() => {
    if (!usandoMock) return;
    const id = setInterval(() => {
      setDemandas((prev) => prev.map(simularTick));
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [usandoMock]);

  return { demandas, usandoMock, carregando };
}
