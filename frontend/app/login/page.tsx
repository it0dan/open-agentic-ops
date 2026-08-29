"use client";

import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen overflow-hidden">
      {/* Fundo decorativo */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-[#ac54eb]/25 blur-[140px]" />
        <div className="absolute -right-32 bottom-1/4 h-[28rem] w-[28rem] rounded-full bg-[#ea5b0c]/20 blur-[140px]" />
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-16 px-16">
        {/* Painel esquerdo — branding */}
        <div className="relative hidden flex-1 flex-col justify-between py-12 lg:flex">
          <Logo />
          <div className="my-auto max-w-md">
            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight">
              Opere a squad{" "}
              <span className="text-gradient">Open Agentic Ops</span> com
              julgamento humano.
            </h1>
            <p className="mt-4 text-muted-foreground">
              Acompanhe o ciclo de vida de Open Finance — da norma regulatória ao
              deploy monitorado — com um único ponto de controle.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Sensedia · Open Finance
          </p>
        </div>

        {/* Painel direito — login OIDC */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>
            <div className="card-elevated rounded-3xl p-8">
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Bem-vindo de volta
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesse o console do FDE para operar a squad.
              </p>

              <Button
                type="button"
                onClick={() => signIn("keycloak")}
                className="mt-8 h-11 w-full rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm transition-all hover:bg-primary/90"
              >
                Entrar com Keycloak
                <LogIn className="ml-2 size-4" />
              </Button>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Autenticação via Keycloak (OIDC)
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
