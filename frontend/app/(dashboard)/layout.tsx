import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { ContentContainer } from "@/components/content-container";
import { TenantBadge } from "@/components/tenant-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/60 px-4 backdrop-blur-xl sm:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Console</span>
            <span className="hidden sm:inline">· Operação da squad</span>
            <TenantBadge tenantId={session.tenant_id} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                FD
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <ContentContainer>{children}</ContentContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
