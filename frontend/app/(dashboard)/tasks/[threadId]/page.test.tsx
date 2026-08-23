import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { demandasMock } from "@/lib/mock-data";

vi.mock("next/navigation", () => ({
  useParams: () => ({ threadId: "9f2c1a3e-7b4d-4c8e-9a1f-2d3e4f5a6b7c" }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  obterDemanda: vi.fn(),
  aprovarDemanda: vi.fn(),
  autorarSpec: vi.fn(),
}));

import { aprovarDemanda, obterDemanda } from "@/lib/api";
import DetalhePage from "./page";

const demandaHitl = demandasMock[0];

describe("DetalhePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obterDemanda).mockResolvedValue(demandaHitl);
  });

  it("renderiza a spec e os worktrees da demanda", async () => {
    const user = userEvent.setup();
    render(<DetalhePage />);

    expect(await screen.findByText(/Nova Instrução Normativa/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Worktrees/i }));
    expect(await screen.findByText("feat/backend")).toBeInTheDocument();
    expect(screen.getByText("feat/frontend")).toBeInTheDocument();
  });

  it("aciona aprovarDemanda ao clicar em Aprovar", async () => {
    const user = userEvent.setup();
    vi.mocked(aprovarDemanda).mockResolvedValue({
      ...demandaHitl,
      status: "monitorado",
      decisao_hitl: { decisao: "aprovado", observacao: "Aprovado pelo FDE." },
    });

    render(<DetalhePage />);

    const aprovar = await screen.findByRole("button", { name: /^Aprovar$/i });
    await user.click(aprovar);

    await waitFor(() => {
      expect(aprovarDemanda).toHaveBeenCalledWith({
        thread_id: "9f2c1a3e-7b4d-4c8e-9a1f-2d3e4f5a6b7c",
        decisao: "aprovado",
        observacao: "Aprovado pelo FDE.",
      });
    });
  });

  it("aciona aprovarDemanda com decisao=rejeitado ao clicar em Rejeitar", async () => {
    const user = userEvent.setup();
    vi.mocked(aprovarDemanda).mockResolvedValue({
      ...demandaHitl,
      status: "rejeitado",
      decisao_hitl: { decisao: "rejeitado", observacao: "Rejeitado pelo FDE." },
    });

    render(<DetalhePage />);

    const rejeitar = await screen.findByRole("button", { name: /Rejeitar/i });
    await user.click(rejeitar);

    await waitFor(() => {
      expect(aprovarDemanda).toHaveBeenCalledWith({
        thread_id: "9f2c1a3e-7b4d-4c8e-9a1f-2d3e4f5a6b7c",
        decisao: "rejeitado",
        observacao: "Rejeitado pelo FDE.",
      });
    });
  });

  it("aprova com ressalvas enviando a observação digitada", async () => {
    const user = userEvent.setup();
    vi.mocked(aprovarDemanda).mockResolvedValue({
      ...demandaHitl,
      status: "monitorado",
      decisao_hitl: {
        decisao: "aprovado_com_ressalvas",
        observacao: "revisar cobertura de testes",
      },
    });

    render(<DetalhePage />);

    const ressalvas = await screen.findByRole("button", {
      name: /Aprovar com ressalvas/i,
    });
    await user.click(ressalvas);

    const textarea = await screen.findByPlaceholderText(/Descreva a ressalva/i);
    await user.type(textarea, "revisar cobertura de testes");

    const confirmar = await screen.findByRole("button", {
      name: /Confirmar aprovação com ressalva/i,
    });
    await user.click(confirmar);

    await waitFor(() => {
      expect(aprovarDemanda).toHaveBeenCalledWith({
        thread_id: "9f2c1a3e-7b4d-4c8e-9a1f-2d3e4f5a6b7c",
        decisao: "aprovado_com_ressalvas",
        observacao: "revisar cobertura de testes",
      });
    });
  });
});
