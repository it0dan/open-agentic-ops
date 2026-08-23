import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  listarAuditoria: vi.fn(),
  corrigirHeuristica: vi.fn(),
}));

import { listarAuditoria } from "@/lib/api";
import AuditoriaPage from "./page";

describe("AuditoriaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    render(<AuditoriaPage />);

    expect(await screen.findByText("backend")).toBeInTheDocument();
    expect(screen.getByText("portabilidade")).toBeInTheDocument();
    expect(screen.getByText("consignado")).toBeInTheDocument();
  });
});
