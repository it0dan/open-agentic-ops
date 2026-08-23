"use client";

import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const ativo = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              ativo
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
