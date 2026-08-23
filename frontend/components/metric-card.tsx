import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
  ativo = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "primary" | "blue" | "green" | "neutral";
  ativo?: boolean;
}) {
  const tones = {
    primary: "text-[#a78bfa]",
    blue: "text-[#818cf8]",
    green: "text-emerald-500",
    neutral: "text-zinc-400",
  };

  return (
    <div
      className={cn(
        "card-elevated card-hover group relative overflow-hidden rounded-2xl px-7 py-8",
        ativo && "ring-1 ring-[#a78bfa]/60",
      )}
    >
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground opacity-60">
            {label}
          </p>
          <p className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-muted/40",
            tones[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
