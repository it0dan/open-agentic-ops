"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ORDER = ["dark", "light", "system"] as const;
type ThemeMode = (typeof ORDER)[number];

const NEXT_LABEL: Record<ThemeMode, string> = {
  dark: "Claro",
  light: "Sistema",
  system: "Escuro",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const resolved = theme ?? "system";
  const current: ThemeMode = ORDER.includes(resolved as ThemeMode)
    ? (resolved as ThemeMode)
    : "system";
  const nextIndex = (ORDER.indexOf(current) + 1) % ORDER.length;
  const next = ORDER[nextIndex];

  function cycle() {
    setTheme(next);
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={cycle}
          aria-label={`Tema atual: ${current}. Alternar para ${NEXT_LABEL[current]}`}
        >
          {current === "dark" && <Moon className="size-4" />}
          {current === "light" && <Sun className="size-4" />}
          {current === "system" && <Monitor className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Tema: {current} · próximo: {NEXT_LABEL[current]}</TooltipContent>
    </Tooltip>
  );
}
