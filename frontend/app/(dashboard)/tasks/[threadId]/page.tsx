"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Check,
  FilePenLine,
  FileText,
  GitBranch,
  MessageSquare,
  ScrollText,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { POLL_INTERVAL } from "@/hooks/use-demandas-polling";
import { aprovarDemanda, autorarSpec, obterDemanda } from "@/lib/api";
import {
  DOMINIO_LABEL,
  ORIGEM_LABEL,
  ORIGEM_SUBTIPO_LABEL,
  PRIORIDADE_LABEL,
  demandasMock,
  type Demanda,
  type EventoLoop,
  type Status,
} from "@/lib/mock-data";

const FLUXO: Status[] = [
  "triado",
  "aguardando_autoria",
  "spec_pronta",
  "em_implementacao",
  "em_revisao",
  "aguardando_hitl",
  "aprovado",
  "em_eval",
  "deployado",
  "monitorado",
  "rejeitado",
];

function formatarData(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function criadoPor(d: Demanda): string {
  if (d.origem === "cliente") return "Cliente";
  return d.spec_autor === "fde" ? "FDE" : "Intake Agent";
}

function prioridade(d: Demanda): string {
  if (d.prioridade) return PRIORIDADE_LABEL[d.prioridade];
  return d.ambiguidade === "alta" ? "Alta" : "Baixa";
}

export default function DetalhePage() {
  const params = useParams<{ threadId: string }>();
  const mock = useMemo(
    () => demandasMock.find((d) => d.thread_id === params.threadId),
    [params.threadId],
  );
  const [demanda, setDemanda] = useState<Demanda | undefined>(mock);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [rascunhoSpec, setRascunhoSpec] = useState("");
  const [liberando, setLiberando] = useState(false);
  const [modoRessalva, setModoRessalva] = useState(false);
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    let ativo = true;
    async function buscar() {
      try {
        const data = await obterDemanda(params.threadId);
        if (ativo) {
          setDemanda(data);
          setCarregando(false);
        }
      } catch {
        if (ativo) {
          setDemanda(mock);
          setCarregando(false);
        }
      }
    }
    buscar();
    const id = setInterval(buscar, POLL_INTERVAL);
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, [params.threadId, mock]);

  if (carregando) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!demanda) {
    notFound();
  }

  const aguardando = demanda.status === "aguardando_hitl";
  const etapaAtual = Math.max(0, FLUXO.indexOf(demanda.status));
  const progresso = Math.round((etapaAtual / (FLUXO.length - 1)) * 100);

  async function decidir(
    decisao: "aprovado" | "aprovado_com_ressalvas" | "rejeitado",
  ) {
    setEnviando(true);
    setErro(null);
    try {
      const atualizada = await aprovarDemanda({
        thread_id: params.threadId,
        decisao,
        observacao:
          decisao === "aprovado_com_ressalvas"
            ? observacao.trim() || "Aprovado com ressalvas."
            : decisao === "rejeitado"
              ? "Rejeitado pelo FDE."
              : "Aprovado pelo FDE.",
      });
      setDemanda(atualizada);
      setModoRessalva(false);
      setObservacao("");
      toast.success(
        decisao === "rejeitado"
          ? "Demanda rejeitada"
          : decisao === "aprovado_com_ressalvas"
            ? "Aprovado com ressalvas"
            : "Demanda aprovada",
        { description: "Decisão registrada no HITL gate." },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao enviar decisão.";
      setErro(msg);
      toast.error("Falha ao registrar decisão", { description: msg });
    } finally {
      setEnviando(false);
    }
  }

  async function liberarSpec() {
    const spec = rascunhoSpec.trim();
    if (!spec) return;
    setLiberando(true);
    setErro(null);
    try {
      const atualizada = await autorarSpec(params.threadId, spec);
      setDemanda(atualizada);
      setRascunhoSpec("");
      toast.success("Spec liberada", {
        description: "A spec re-entrou no grafo e o fluxo continuou (ADR-0009).",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao liberar spec.";
      setErro(msg);
      toast.error("Falha ao liberar spec", { description: msg });
    } finally {
      setLiberando(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar às tasks
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Detalhe da demanda
            </h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {demanda.thread_id}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {ORIGEM_LABEL[demanda.origem] ?? demanda.origem}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {DOMINIO_LABEL[demanda.dominio] ?? demanda.dominio}
            </Badge>
            <StatusBadge status={demanda.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Coluna principal */}
        <div className="min-w-0 space-y-8">
      {/* Progresso do ciclo de vida */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Ciclo de vida</span>
            <span className="text-muted-foreground">
              {Math.round(etapaAtual + 1)}/{FLUXO.length} · {progresso}%
            </span>
          </div>
          <Progress value={progresso} className="h-2 [&>div]:transition-[width] [&>div]:duration-400 [&>div]:ease-out" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FLUXO.map((s, i) => (
              <span
                key={s}
                className={
                  i <= etapaAtual
                    ? "text-xs font-medium text-primary"
                    : "text-xs text-muted-foreground"
                }
              >
                {i === etapaAtual && (
                  <span className="dot-halo-executando mr-1.5 inline-block size-1.5 rounded-full bg-[#a78bfa] align-middle" />
                )}
                {s.replace(/_/g, " ")}
                {i < FLUXO.length - 1 && <span className="mx-1 opacity-40">·</span>}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Painel de autoria de spec (alta ambiguidade) */}
      {demanda.status === "aguardando_autoria" && (
        <Card className="relative overflow-hidden border-[#ac54eb]/30 bg-[#ac54eb]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilePenLine className="size-5 text-[#ac54eb]" />
              Autoria de spec (FDE)
            </CardTitle>
            <CardDescription>
              Esta demanda foi classificada como alta ambiguidade. Componha a
              spec do FDE para liberar o fluxo no grafo (ADR-0009).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              rows={4}
              placeholder="Componha a spec do FDE…"
              value={rascunhoSpec}
              onChange={(e) => setRascunhoSpec(e.target.value)}
              className="rounded-xl bg-muted/40"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={liberarSpec}
                disabled={!rascunhoSpec.trim() || liberando}
                className="rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Send className="mr-2 size-4" />
                {liberando ? "Liberando…" : "Liberar para o grafo"}
              </Button>
              {erro && <p className="text-sm text-destructive">{erro}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Painel HITL */}
      {aguardando && (
        <Card className="relative overflow-hidden border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-orange-500" />
              Decisão do FDE (HITL)
            </CardTitle>
            <CardDescription>
              Revise o resultado da implementação (worktrees, ADRs, feedbacks)
              antes do merge. Aprovar libera para eval/deploy; rejeitar devolve
              para revisão.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => decidir("aprovado")}
                disabled={enviando}
                className="rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
              >
                <Check className="mr-2 size-4" /> Aprovar
              </Button>
              <Button
                onClick={() => setModoRessalva((v) => !v)}
                disabled={enviando}
                variant="outline"
                className="rounded-xl"
              >
                <MessageSquare className="mr-2 size-4" /> Aprovar com ressalvas
              </Button>
              <Button
                variant="destructive"
                onClick={() => decidir("rejeitado")}
                disabled={enviando}
                className="rounded-xl"
              >
                <X className="mr-2 size-4" /> Rejeitar
              </Button>
            </div>
            {modoRessalva && (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Descreva a ressalva (registrada no HITL, não bloqueia o fluxo)..."
                  rows={2}
                />
                <Button
                  onClick={() => decidir("aprovado_com_ressalvas")}
                  disabled={enviando}
                  className="self-end rounded-xl"
                >
                  <Send className="mr-2 size-4" /> Confirmar aprovação com ressalva
                </Button>
              </div>
            )}
            {erro && <p className="text-sm text-destructive">{erro}</p>}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="spec" className="w-full">
        <TabsList className="glass-strong h-auto flex-wrap gap-1 rounded-2xl p-1.5">
          <TabsTrigger value="spec" className="gap-2 rounded-xl">
            <FileText className="size-4" /> Spec
          </TabsTrigger>
          <TabsTrigger value="worktrees" className="gap-2 rounded-xl">
            <GitBranch className="size-4" /> Worktrees
          </TabsTrigger>
          <TabsTrigger value="adrs" className="gap-2 rounded-xl">
            <ScrollText className="size-4" /> ADRs
          </TabsTrigger>
          <TabsTrigger value="feedbacks" className="gap-2 rounded-xl">
            <MessageSquare className="size-4" /> Feedbacks
          </TabsTrigger>
          <TabsTrigger value="decisoes" className="gap-2 rounded-xl">
            <ShieldCheck className="size-4" /> HITL & Eval
          </TabsTrigger>
          <TabsTrigger value="eventos" className="gap-2 rounded-xl">
            <Activity className="size-4" /> Eventos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spec" className="mt-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Spec</CardTitle>
              <CardDescription>
                Autor: <span className="uppercase">{demanda.spec_autor}</span> ·
                Domínio: <span className="capitalize">{demanda.dominio}</span> ·
                Ambiguidade: {demanda.ambiguidade}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap leading-relaxed">
                {demanda.spec}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worktrees" className="mt-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Worktrees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(demanda.worktrees ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum worktree.</p>
              ) : (
                demanda.worktrees!.map((wt) => (
                  <div
                    key={wt.branch}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-mono text-sm">{wt.branch}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {wt.guia} · {wt.resultado ?? "—"}
                      </p>
                    </div>
                    <Badge variant="secondary">{wt.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adrs" className="mt-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>ADRs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(demanda.adrs ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum ADR.</p>
              ) : (
                demanda.adrs!.map((adr) => (
                  <div
                    key={adr.titulo}
                    className="rounded-xl border border-border/60 bg-muted/30 p-4"
                  >
                    <p className="text-sm font-medium">{adr.titulo}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {adr.conteudo}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedbacks" className="mt-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Feedbacks de review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(demanda.feedback_review ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum feedback.
                </p>
              ) : (
                demanda.feedback_review!.map((fb, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/60 bg-muted/30 p-4"
                  >
                    <p className="font-mono text-xs text-muted-foreground">
                      {fb.worktree}
                    </p>
                    <p className="mt-1 text-sm">{fb.feedback}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisoes" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Decisão HITL</CardTitle>
              </CardHeader>
              <CardContent>
                {demanda.decisao_hitl ? (
                  <div className="space-y-2">
                    <Badge
                      variant="outline"
                      className={
                        demanda.decisao_hitl.decisao === "rejeitado"
                          ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                          : demanda.decisao_hitl.decisao === "aprovado_com_ressalvas"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }
                    >
                      {demanda.decisao_hitl.decisao === "rejeitado"
                        ? "Rejeitado"
                        : demanda.decisao_hitl.decisao === "aprovado_com_ressalvas"
                          ? "Aprovado com ressalvas"
                          : "Aprovado"}
                    </Badge>
                    {demanda.decisao_hitl.observacao && (
                      <p className="text-xs text-muted-foreground">
                        {demanda.decisao_hitl.observacao}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aguardando decisão do FDE.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Resultado de eval</CardTitle>
              </CardHeader>
              <CardContent>
                {demanda.resultado_eval ? (
                  <div className="space-y-1">
                    <Badge
                      variant="outline"
                      className={
                        demanda.resultado_eval.aprovado
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                      }
                    >
                      {demanda.resultado_eval.aprovado ? "Aprovado" : "Reprovado"}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {demanda.resultado_eval.detalhes}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Eval pendente.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="eventos" className="mt-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Execution loop</CardTitle>
              <CardDescription>
                Traço de execução intra-agente (tool-calling trace)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(demanda.eventos ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum evento registrado.
                </p>
              ) : (
                [...(demanda.eventos ?? [])]
                  .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                  .map((e, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <EventDot tipo={e.tipo} />
                      <div className="min-w-0">
                        <p className="text-sm">{e.mensagem}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {e.agente} · {e.timestamp}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
        </div>

        {/* Metadados — painel lateral sticky */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Metadados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetaItem label="Título" value={demanda.titulo ?? "—"} />
              <MetaItem label="Criado por" value={criadoPor(demanda)} />
              <MetaItem label="Owner atual" value={demanda.agente_atual ?? "—"} />
              <MetaItem
                label="Criado em"
                value={formatarData(demanda.classificacao_intake?.timestamp)}
              />
              <MetaItem
                label="Última atualização"
                value={formatarData(demanda.atualizado_em)}
              />
              <MetaItem label="Prioridade" value={prioridade(demanda)} />
              <MetaItem
                label="Subtipo"
                value={
                  demanda.origem_subtipo
                    ? ORIGEM_SUBTIPO_LABEL[demanda.origem_subtipo]
                    : "—"
                }
              />
              <MetaItem
                label="Domínio"
                value={DOMINIO_LABEL[demanda.dominio] ?? demanda.dominio}
              />
              <MetaItem
                label="Origem"
                value={ORIGEM_LABEL[demanda.origem] ?? demanda.origem}
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      <Separator className="my-2" />
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground opacity-60">
        {label}
      </p>
      <p className="mt-0.5 text-sm capitalize">{value}</p>
    </div>
  );
}

function EventDot({ tipo }: { tipo: EventoLoop["tipo"] }) {
  const cls =
    tipo === "sucesso"
      ? "bg-emerald-500"
      : tipo === "erro"
        ? "bg-red-500"
        : tipo === "hitl"
          ? "bg-orange-500"
          : "bg-primary";
  return <span className={`mt-1 size-2 shrink-0 rounded-full ${cls}`} />;
}
