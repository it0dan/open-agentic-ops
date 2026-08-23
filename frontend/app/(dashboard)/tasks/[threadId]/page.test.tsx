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
      decisao_hitl: { aprovado: true, comentario: "Aprovado pelo FDE." },
    });

    render(<DetalhePage />);

    const aprovar = await screen.findByRole("button", { name: /Aprovar/i });
    await user.click(aprovar);

    await waitFor(() => {
      expect(aprovarDemanda).toHaveBeenCalledWith({
        thread_id: "9f2c1a3e-7b4d-4c8e-9a1f-2d3e4f5a6b7c",
        aprovado: true,
        comentario: "Aprovado pelo FDE.",
      });
    });
  });

  it("aciona aprovarDemanda com aprovado=false ao clicar em Rejeitar", async () => {
    const user = userEvent.setup();
    vi.mocked(aprovarDemanda).mockResolvedValue({
      ...demandaHitl,
      status: "aguardando_hitl",
      decisao_hitl: { aprovado: false, comentario: "Rejeitado pelo FDE." },
    });

    render(<DetalhePage />);

    const rejeitar = await screen.findByRole("button", { name: /Rejeitar/i });
    await user.click(rejeitar);

    await waitFor(() => {
      expect(aprovarDemanda).toHaveBeenCalledWith({
        thread_id: "9f2c1a3e-7b4d-4c8e-9a1f-2d3e4f5a6b7c",
        aprovado: false,
        comentario: "Rejeitado pelo FDE.",
      });
    });
  });
});
