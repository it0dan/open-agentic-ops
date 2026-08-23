"use client";

import { useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

export function FilterBar({
  groups,
  selected,
  onToggle,
  onClear,
  busca,
  onBusca,
  placeholder = "Buscar…",
}: {
  groups: FilterGroup[];
  selected: Record<string, Set<string>>;
  onToggle: (groupKey: string, value: string) => void;
  onClear: () => void;
  busca: string;
  onBusca: (value: string) => void;
  placeholder?: string;
}) {
  const [aberto, setAberto] = useState<string | null>(null);
  const totalAtivos = Object.values(selected).reduce(
    (acc, set) => acc + set.size,
    0,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            className="h-10 rounded-xl pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {groups.map((group) => {
            const count = selected[group.key]?.size ?? 0;
            const ativo = count > 0;
            return (
              <Popover
                key={group.key}
                open={aberto === group.key}
                onOpenChange={(open) => setAberto(open ? group.key : null)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-1.5 rounded-xl border text-sm font-medium",
                      ativo
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <SlidersHorizontal className="size-3.5" />
                    {count > 0 ? `${group.label}: ${count}` : group.label}
                    <ChevronDown className="size-3.5 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-1.5">
                  <p className="px-2 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground opacity-60">
                    {group.label}
                  </p>
                  <div className="flex flex-col">
                    {group.options.map((opt) => {
                      const marcado = selected[group.key]?.has(opt.value) ?? false;
                      return (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
                        >
                          <Checkbox
                            checked={marcado}
                            onCheckedChange={() => onToggle(group.key, opt.value)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}

          {totalAtivos > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-10 gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" /> Limpar ({totalAtivos})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
