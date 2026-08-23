"use client";

import { useState } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { injetarDemanda } from "@/lib/api";
import { ORIGEM_LABEL, type Origem } from "@/lib/mock-data";

export default function IntakePage() {
  const [origem, setOrigem] = useState<Origem>("cliente");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await injetarDemanda({ origem, texto });
      setTexto("");
      toast.success("Demanda injetada", {
        description: "O Intake processou a nova demanda na squad.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao injetar demanda.";
      toast.error("Falha ao injetar demanda", { description: msg });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Intake manual"
        description="Injete uma nova demanda na squad (origem + texto)"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <CardTitle>Nova demanda</CardTitle>
            <CardDescription>
              O texto será mascarado na fronteira pelo Intake (PII).
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="origem">Origem</Label>
                <Select
                  value={origem}
                  onValueChange={(v) => setOrigem(v as Origem)}
                >
                  <SelectTrigger
                    id="origem"
                    className="h-11 w-full rounded-xl bg-muted/40"
                  >
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ORIGEM_LABEL) as Origem[]).map((o) => (
                      <SelectItem key={o} value={o}>
                        {ORIGEM_LABEL[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="texto">Texto da demanda</Label>
                <Textarea
                  id="texto"
                  rows={7}
                  placeholder="Descreva a demanda…"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  className="rounded-xl bg-muted/40"
                />
              </div>
              <Button
                type="submit"
                disabled={!texto.trim() || enviando}
                className="h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm transition-all hover:bg-primary/90"
              >
                <Send className="mr-2 size-4" />
                {enviando ? "Enviando…" : "Enviar para o Intake"}
              </Button>
            </CardContent>
          </form>
        </Card>

        <Card className="card-elevated h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-[#ac54eb]" />
              Proteção de PII
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              O texto é mascarado na fronteira de entrada pelo Intake, ancorado
              na classificação LGPD e no perfil de segurança do Open Finance
              (FAPI-BR).
            </p>
            <p>
              Dados pessoais e sensíveis nunca trafegam em claro entre agentes,
              telemetria ou logs.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
