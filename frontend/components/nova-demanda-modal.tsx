"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function NovaDemandaModal({
  aberto,
  onClose,
  onCriada,
}: {
  aberto: boolean;
  onClose: () => void;
  onCriada?: () => void;
}) {
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
      setOrigem("cliente");
      toast.success("Demanda injetada", {
        description: "O Intake processou a nova demanda na squad.",
      });
      onCriada?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao injetar demanda.";
      toast.error("Falha ao injetar demanda", { description: msg });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova demanda</DialogTitle>
          <DialogDescription>
            A demanda segue o fluxo da squad: implementação → revisão → HITL
            (você revisa o resultado) → eval → deploy. O texto é mascarado na
            fronteira pelo Intake (PII).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="origem">Origem</Label>
            <Select value={origem} onValueChange={(v) => setOrigem(v as Origem)}>
              <SelectTrigger id="origem" className="h-11 w-full rounded-xl bg-muted/40">
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
              rows={6}
              placeholder="Descreva a demanda…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="rounded-xl bg-muted/40"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={!texto.trim() || enviando}
              className="h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm transition-all hover:bg-primary/90"
            >
              <Send className="mr-2 size-4" />
              {enviando ? "Enviando…" : "Enviar para o Intake"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
