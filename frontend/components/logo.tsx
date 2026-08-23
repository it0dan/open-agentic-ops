import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="Ir para o dashboard"
    >
      <div className="relative flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-shadow group-hover:shadow-md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8" />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="font-heading text-sm font-bold tracking-tight">
          Open Agentic Ops
        </p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Console do FDE
        </p>
      </div>
    </Link>
  );
}
