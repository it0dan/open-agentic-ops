import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  listarAuditoria: vi.fn(),
  corrigirHeuristica: vi.fn(),
  obterContadorAmbiguidade: vi.fn(),
  registrarAmbiguidadeKeyword: vi.fn(),
}));

import { listarAuditoria, obterContadorAmbiguidade } from "@/lib/api";
import AuditPage from "./page";

describe("AuditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obterContadorAmbiguidade).mockResolvedValue({ contador: 0 });
  });

  it("renderiza as classificações vindas da API", async () => {
    vi.mocked(listarAuditoria).mockResolvedValue([
      {
        thread_id: "abc-123",
        dominio: "backend",
        ambiguidade: "alta",
        justificativa: ["portabilidade", "consignado"],
        timestamp: "2026-08-22T10:15:00Z",
      },
    ]);

    render(<AuditPage />);

    expect(await screen.findByText("backend")).toBeInTheDocument();
    expect(screen.getByText("portabilidade")).toBeInTheDocument();
    expect(screen.getByText("consignado")).toBeInTheDocument();
  });

  it("permite avaliar uma classificação como 'Manteria'", async () => {
    vi.mocked(listarAuditoria).mockResolvedValue([
      {
        thread_id: "abc-123",
        dominio: "backend",
        ambiguidade: "alta",
        justificativa: ["portabilidade"],
        timestamp: "2026-08-22T10:15:00Z",
      },
    ]);

    render(<AuditPage />);

    const manteria = await screen.findAllByRole("button", { name: /Manteria/i });
    expect(manteria.length).toBeGreaterThan(0);
  });
});
