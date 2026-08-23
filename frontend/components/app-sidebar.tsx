"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  SearchCheck,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/graph", label: "Graph", icon: Activity },
  { href: "/audit", label: "Audit", icon: SearchCheck },
];

function NavItems() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Operação</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href + "/")) ||
              (item.href === "/dashboard" && pathname === "/dashboard");
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function SidebarFooterContent() {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2">
      <Avatar className="size-9">
        <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
          FD
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium">FDE</p>
        <p className="truncate text-xs text-muted-foreground">
          Forward Deployed Engineer
        </p>
      </div>
      <Button variant="ghost" size="icon" aria-label="Sair">
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-14 items-center px-2">
          <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavItems />
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterContent />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
