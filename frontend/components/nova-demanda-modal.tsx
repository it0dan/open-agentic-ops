"use client";

import { useState } from "react";
import {
  Building2,
  Landmark,
  Lightbulb,
  Activity,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResizableDialogContent } from "@/components/resizable-dialog";
import { SegmentedControl } from "@/components/segmented-control";
import { injetarDemanda } from "@/lib/api";
import {
  ORIGEM_LABEL,
  ORIGEM_SUBTIPO_LABEL,
  ORIGEM_SUBTIPOS,
  type Origem,
  type OrigemSubtipo,
  type Prioridade,
} from "@/lib/mock-data";

const ORIGEM_OPCOES: { value: Origem; label: string; icon: React.ReactNode }[] = [
  { value: "cliente", label: "Cliente", icon: <Building2 className="size-4" /> },
  { value: "regulatorio", label: "Regulatório", icon: <Landmark className="size-4" /> },
  { value: "estrategia", label: "Estratégia", icon: <Lightbulb className="size-4" /> },
  { value: "sre", label: "SRE", icon: <Activity className="size-4" /> },
];

const PRIORIDADE_OPCOES: { value: Prioridade; label: string }[] = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

const SUBTIPO_HINT: Record<Origem, string> = {
  cliente: "Pedido de capacidade nova ou incidente relatado por um cliente.",
  regulatorio: "Norma publicada ou instrução normativa que impõe mudança.",
  estrategia: "Decisão de produto: capacidade nova ou evolução do que já existe.",
  sre: "Sinal de produção: bug ou degradação de performance observada.",
};

export function NovaDemandaModal({
  aberto,
  onClose,
  onCriada,
}: {
  aberto: boolean;
  onClose: () => void;
  onCriada?: () => void;
}) {
  const [origem, setOrigem] = useState<Origem>("regulatorio");
  const [subtipo, setSubtipo] = useState<OrigemSubtipo>(
    ORIGEM_SUBTIPOS["regulatorio"][0],
  );
  const [prioridade, setPrioridade] = useState<Prioridade>("media");
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  function handleOrigemChange(o: Origem) {
    setOrigem(o);
    setSubtipo(ORIGEM_SUBTIPOS[o][0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || !titulo.trim()) return;
    setEnviando(true);
    const payload = {
      origem,
      origem_subtipo: subtipo,
      prioridade,
      titulo: titulo.trim(),
      texto,
    };
    setTexto("");
    setTitulo("");
    setOrigem("regulatorio");
    setSubtipo(ORIGEM_SUBTIPOS["regulatorio"][0]);
    setPrioridade("media");
    onCriada?.();
    onClose();
    try {
      await injetarDemanda(payload);
      toast.success("Demanda criada", {
        description: "O Intake processou a nova demanda na squad.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar demanda.";
      toast.error("Falha ao criar demanda", { description: msg });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <ResizableDialogContent
          className="bg-background/80 backdrop-blur-2xl"
          defaultHeight={840}
          maxHeight={920}
        >
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <DialogTitle className="text-lg font-semibold">Nova demanda</DialogTitle>
            </div>
            <DialogDescription>
              A demanda segue o fluxo da squad: implementação → revisão → HITL →
              eval → deploy. O texto é mascarado na fronteira pelo Intake (PII).
            </DialogDescription>
          </DialogHeader>

          <form
            id="nova-demanda-form"
            onSubmit={handleSubmit}
            className="flex-1 space-y-7 overflow-y-auto px-6 py-6"
          >
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titulo"
              placeholder="Resumo curto da demanda"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="h-11 rounded-xl bg-muted/40"
            />
            <p className="text-xs text-muted-foreground">
              Aparece como título no board.
            </p>
          </div>

          {/* Origem */}
          <div className="space-y-2">
            <Label>Origem</Label>
            <SegmentedControl
              options={ORIGEM_OPCOES}
              value={origem}
              onChange={handleOrigemChange}
            />
            <p className="text-xs text-muted-foreground">
              {ORIGEM_LABEL[origem]} — {SUBTIPO_HINT[origem]}
            </p>
          </div>

          {/* Subtipo (progressive disclosure) */}
          <div className="space-y-2">
            <Label>Subtipo</Label>
            <div className="grid grid-cols-2 gap-2">
              {ORIGEM_SUBTIPOS[origem].map((s) => {
                const ativo = subtipo === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubtipo(s)}
                    className={`rounded-xl border p-3 text-left text-sm transition-all ${
                      ativo
                        ? "border-primary/60 bg-primary/10 text-foreground ring-1 ring-primary/30"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <span className="font-medium">{ORIGEM_SUBTIPO_LABEL[s]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORIDADE_OPCOES.map((p) => {
                const ativo = prioridade === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPrioridade(p.value)}
                    className={`rounded-xl border p-3 text-center text-sm font-medium transition-all ${
                      ativo
                        ? "border-primary/60 bg-primary/10 text-foreground ring-1 ring-primary/30"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Urgência de negócio, independente da ambiguidade técnica.
            </p>
          </div>

          {/* Texto */}
          <div className="space-y-2">
            <Label htmlFor="texto">Descrição da demanda</Label>
            <Textarea
              id="texto"
              rows={4}
              placeholder="Descreva a demanda com contexto suficiente para o Intake classificar domínio e ambiguidade…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="min-h-[6rem] resize-y rounded-xl bg-muted/40"
            />
          </div>
        </form>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <div className="flex w-full items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {texto.trim() && titulo.trim()
                ? "Pronto para criar"
                : "Preencha título e descrição para habilitar a criação"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="h-11 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="nova-demanda-form"
                disabled={!texto.trim() || !titulo.trim() || enviando}
                className="h-11 rounded-xl bg-primary px-6 text-primary-foreground font-semibold shadow-sm transition-all hover:bg-primary/90"
              >
                <Send className="mr-2 size-4" />
                {enviando ? "Criando…" : "Criar demanda"}
              </Button>
            </div>
          </div>
        </DialogFooter>
        </ResizableDialogContent>
      </DialogPortal>
    </Dialog>
  );
}
