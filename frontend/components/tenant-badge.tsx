import { Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function TenantBadge({ tenantId }: { tenantId?: string | null }) {
  if (!tenantId) return null;
  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground"
      title={`Tenant ativo: ${tenantId}`}
    >
      <Building2 className="size-3.5 text-primary" />
      <span className="font-semibold text-foreground">{tenantId}</span>
    </Badge>
  );
}
