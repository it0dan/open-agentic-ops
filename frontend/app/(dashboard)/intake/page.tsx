"use client";

import { useEffect, useMemo, useState } from "react";
import { FilePenLine, Send, ShieldCheck } from "lucide-react";
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
import { autorarSpec, injetarDemanda, listarDemandas } from "@/lib/api";
import {
  demandasMock,
  ORIGEM_LABEL,
  type Demanda,
  type Origem,
} from "@/lib/mock-data";

export default function IntakePage() {
  const [origem, setOrigem] = useState<Origem>("cliente");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [demandas, setDemandas] = useState<Demanda[]>(demandasMock);
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});
  const [liberando, setLiberando] = useState<string | null>(null);

  useEffect(() => {
    listarDemandas()
      .then(setDemandas)
      .catch(() => setDemandas(demandasMock));
  }, []);

  const aguardandoAutoria = useMemo(
    () =>
      demandas.filter(
        (d) =>
          d.ambiguidade === "alta" &&
          d.spec_autor === "fde" &&
          ["triado", "spec_pronta"].includes(d.status),
      ),
    [demandas],
  );

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

  async function liberarSpec(threadId: string) {
    const spec = (rascunhos[threadId] ?? "").trim();
    if (!spec) return;
    setLiberando(threadId);
    try {
      await autorarSpec(threadId, spec);
      toast.success("Spec liberada", {
        description: "A spec re-entrou no grafo e o fluxo continuou (ADR-0009).",
      });
      setRascunhos((prev) => ({ ...prev, [threadId]: "" }));
      setDemandas((prev) =>
        prev.map((d) => (d.thread_id === threadId ? { ...d, status: "em_implementacao" } : d)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao liberar spec.";
      toast.error("Falha ao liberar spec", { description: msg });
    } finally {
      setLiberando(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Intake"
        description="Injete uma nova demanda na squad e autorize specs de alta ambiguidade"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <CardTitle>Nova demanda</CardTitle>
            <CardDescription>
              A demanda segue o fluxo da squad: implementação → revisão → HITL
              (você revisa o resultado) → eval → deploy. O texto é mascarado na
              fronteira pelo Intake (PII).
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

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePenLine className="size-5 text-[#ea5b0c]" />
            Autoria de spec (alta ambiguidade)
          </CardTitle>
          <CardDescription>
            Itens classificados como alta ambiguidade aguardando a spec do FDE.
            Ao liberar, a spec re-entra no grafo via POST /resume (ADR-0009).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aguardandoAutoria.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum item de alta ambiguidade aguardando autoria de spec.
            </p>
          ) : (
            aguardandoAutoria.map((d) => (
              <div
                key={d.thread_id}
                className="rounded-xl border border-border/60 bg-muted/30 p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase text-muted-foreground">
                    {ORIGEM_LABEL[d.origem]}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {d.thread_id.slice(0, 8)}
                  </span>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">{d.spec}</p>
                <Textarea
                  rows={4}
                  placeholder="Componha a spec do FDE…"
                  value={rascunhos[d.thread_id] ?? ""}
                  onChange={(e) =>
                    setRascunhos((prev) => ({
                      ...prev,
                      [d.thread_id]: e.target.value,
                    }))
                  }
                  className="rounded-xl bg-muted/40"
                />
                <Button
                  onClick={() => liberarSpec(d.thread_id)}
                  disabled={!(rascunhos[d.thread_id] ?? "").trim() || liberando === d.thread_id}
                  className="mt-3 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Send className="mr-2 size-4" />
                  {liberando === d.thread_id ? "Liberando…" : "Liberar para o grafo"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
