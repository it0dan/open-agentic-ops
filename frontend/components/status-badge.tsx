import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type Status } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<Status, string> = {
  triado: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  aguardando_autoria: "bg-[#ac54eb]/10 text-[#ac54eb] border-[#ac54eb]/25 animate-pulse",
  spec_pronta: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  em_implementacao: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  em_revisao: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  aguardando_hitl: "bg-[#ea5b0c]/10 text-[#ea5b0c] border-[#ea5b0c]/25 animate-pulse",
  aprovado: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  em_eval: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20",
  deployado: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  monitorado: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  rejeitado: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-lg border font-medium",
        STATUS_STYLE[status],
        className,
      )}
    >
      <span className="mr-1.5 inline-block size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
