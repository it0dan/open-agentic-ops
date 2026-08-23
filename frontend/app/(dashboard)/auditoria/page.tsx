"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCcw, SearchCheck, Trash2 } from "lucide-react";
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

const classificacoesMock: ClassificacaoAuditoria[] = demandasMock
  .filter((d) => d.classificacao_intake)
  .map((d) => ({
    thread_id: d.thread_id,
    dominio: d.classificacao_intake!.dominio,
    ambiguidade: d.classificacao_intake!.ambiguidade,
    justificativa: d.classificacao_intake!.justificativa,
    timestamp: d.classificacao_intake!.timestamp,
  }));

export default function AuditoriaPage() {
  const [classificacoes, setClassificacoes] =
    useState<ClassificacaoAuditoria[]>(classificacoesMock);
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
        title="Auditoria"
        description="Classificações do Intake e correção prospectiva da heurística"
      />

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchCheck className="size-5 text-[#ac54eb]" />
            Classificações do Intake
          </CardTitle>
          <CardDescription>
            Domínio, ambiguidade, justificativa e timestamp por demanda
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {classificacoes.map((c) => (
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
                </TableRow>
              ))}
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
