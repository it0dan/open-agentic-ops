"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles, Workflow } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Auth mockada no MVP (D7): aceita qualquer credencial não vazia.
    // Evolui para OIDC no futuro.
    if (!email.trim() || !senha.trim()) return;
    localStorage.setItem("fde-auth", "mock");
    router.push("/dashboard");
  }

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
          <div className="mt-8 space-y-3">
            {[
              { icon: Workflow, text: "Board unificado de demandas" },
              { icon: ShieldCheck, text: "Gate HITL com aprovação do FDE" },
              { icon: Sparkles, text: "Auditoria prospectiva da heurística" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                  <f.icon className="size-4.5" />
                </div>
                <span className="text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 Sensedia · Open Finance
        </p>
      </div>

      {/* Painel direito — formulário */}
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

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="fde@sensedia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-11 rounded-xl bg-muted/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 rounded-xl bg-muted/40"
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm transition-all hover:bg-primary/90"
              >
                Entrar
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Autenticação mockada no MVP · OIDC em breve
            </p>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
