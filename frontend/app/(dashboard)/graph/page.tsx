"use client";

import { useMemo } from "react";
import { LoopCanvas } from "@/components/loop-canvas";
import { useDemandasPolling } from "@/hooks/use-demandas-polling";
import { montarStages } from "@/lib/loop-stages";

export default function GraphPage() {
  const { demandas } = useDemandasPolling();

  const stages = useMemo(() => montarStages(demandas), [demandas]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col px-6 py-4">
      <div className="min-h-0 flex-1">
        <LoopCanvas stages={stages} />
      </div>
    </div>
  );
}
