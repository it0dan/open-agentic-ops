"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, RefreshCcw, SearchCheck, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  corrigirHeuristica,
  listarAuditoria,
  type ClassificacaoAuditoria,
} from "@/lib/api";
import { demandasMock } from "@/lib/mock-data";

type Categoria = "backend" | "frontend" | "alta_ambiguidade";

const CATEGORIA_LABEL: Record<Categoria, string> = {
  backend: "Backend",
  frontend: "Frontend",
  alta_ambiguidade: "Alta ambiguidade",
};

const CALIBRATION_KEY = "fde-calibracao-intake";

type Decisao = "manteria" | "discordo";

const classificacoesMock: ClassificacaoAuditoria[] = demandasMock
  .filter((d) => d.classificacao_intake)
  .map((d) => ({
    thread_id: d.thread_id,
    dominio: d.classificacao_intake!.dominio,
    ambiguidade: d.classificacao_intake!.ambiguidade,
    justificativa: d.classificacao_intake!.justificativa,
    timestamp: d.classificacao_intake!.timestamp,
  }));

export default function AuditPage() {
  const [classificacoes, setClassificacoes] =
    useState<ClassificacaoAuditoria[]>(classificacoesMock);
  const [decisoes, setDecisoes] = useState<Record<string, Decisao>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(CALIBRATION_KEY) ?? "{}");
    } catch {
      return {};
    }
  });
  const [categoria, setCategoria] = useState<Categoria>("alta_ambiguidade");
  const [palavra, setPalavra] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    listarAuditoria()
      .then(setClassificacoes)
      .catch(() => {
        setClassificacoes(classificacoesMock);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(CALIBRATION_KEY, JSON.stringify(decisoes));
  }, [decisoes]);

  const metricas = useMemo(() => {
    const avaliadas = Object.keys(decisoes).length;
    const manteria = Object.values(decisoes).filter((d) => d === "manteria").length;
    const pct = avaliadas ? Math.round((manteria / avaliadas) * 100) : 0;
    return { avaliadas, manteria, discorda: avaliadas - manteria, pct };
  }, [decisoes]);

  function decidir(threadId: string, decisao: Decisao) {
    setDecisoes((prev) => ({ ...prev, [threadId]: decisao }));
  }

  async function corrigir(acao: "add" | "remove") {
    if (!palavra.trim()) return;
    setEnviando(true);
    try {
      await corrigirHeuristica({
        categoria,
        palavra: palavra.trim(),
        acao,
      });
      toast.success(
        acao === "add" ? "Palavra-chave adicionada" : "Palavra-chave removida",
        {
          description: `"${palavra.trim()}" em ${CATEGORIA_LABEL[categoria]} — vale para demandas futuras (prospectivo).`,
        },
      );
      setPalavra("");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Erro ao corrigir heurística.";
      toast.error("Falha ao corrigir heurística", { description: msg });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit"
        description="Revisão de calibração das classificações de ambiguidade do Intake Agent"
      />

      {/* Métrica de calibração */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              % que o FDE manteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{metricas.pct}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {metricas.manteria} de {metricas.avaliadas} classificações avaliadas
            </p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Concordâncias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              <ThumbsUp className="size-5" /> {metricas.manteria}
            </p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Discordâncias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-3xl font-bold tabular-nums text-orange-500">
              <ThumbsDown className="size-5" /> {metricas.discorda}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sinalizam drift na heurística do Intake Agent
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchCheck className="size-5 text-[#ac54eb]" />
            Classificações do Intake
          </CardTitle>
          <CardDescription>
            Avalie cada classificação de ambiguidade: concorde ou sinalize
            discordância. A correção é prospectiva (RNF-6).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead>Demanda</TableHead>
                <TableHead>Domínio</TableHead>
                <TableHead>Ambiguidade</TableHead>
                <TableHead>Justificativa</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Avaliação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classificacoes.map((c) => {
                const decisao = decisoes[c.thread_id];
                return (
                  <TableRow
                    key={c.thread_id}
                    className="border-border/60 transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="font-mono text-xs">
                      {c.thread_id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="capitalize">{c.dominio}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          c.ambiguidade === "alta"
                            ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                            : "border-border/60"
                        }
                      >
                        {c.ambiguidade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.justificativa.map((j) => (
                          <span
                            key={j}
                            className="rounded-md bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                          >
                            {j}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.timestamp}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant={decisao === "manteria" ? "default" : "outline"}
                          size="sm"
                          onClick={() => decidir(c.thread_id, "manteria")}
                          className="h-8 gap-1 text-xs"
                        >
                          <Check className="size-3.5" /> Manteria
                        </Button>
                        <Button
                          variant={decisao === "discordo" ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => decidir(c.thread_id, "discordo")}
                          className="h-8 gap-1 text-xs"
                        >
                          <X className="size-3.5" /> Discordo
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="card-elevated max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="size-5 text-[#ea5b0c]" />
            Correção da heurística
          </CardTitle>
          <CardDescription>
            Adicione ou remova palavras-chave. A correção é prospectiva — nunca
            reabre implementação já feita (RNF-6).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setCategoria(v as Categoria)}
              >
                <SelectTrigger
                  id="categoria"
                  className="h-11 rounded-xl bg-muted/40"
                >
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIA_LABEL) as Categoria[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORIA_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="palavra">Palavra-chave</Label>
              <Input
                id="palavra"
                placeholder="ex.: portabilidade"
                value={palavra}
                onChange={(e) => setPalavra(e.target.value)}
                className="h-11 rounded-xl bg-muted/40"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => corrigir("add")}
              disabled={!palavra.trim() || enviando}
              className="rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="mr-2 size-4" /> Adicionar
            </Button>
            <Button
              variant="outline"
              onClick={() => corrigir("remove")}
              disabled={!palavra.trim() || enviando}
              className="rounded-xl border-border/60"
            >
              <Trash2 className="mr-2 size-4" /> Remover
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
