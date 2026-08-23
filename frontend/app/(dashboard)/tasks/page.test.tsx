import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { demandasMock } from "@/lib/mock-data";

vi.mock("@/lib/api", () => ({
  listarDemandas: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { listarDemandas } from "@/lib/api";
import BoardPage from "./page";

describe("BoardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza as demandas vindas da API", async () => {
    vi.mocked(listarDemandas).mockResolvedValue(demandasMock);

    render(<BoardPage />);

    expect(await screen.findByText(/Adicionar botão de download/i)).toBeInTheDocument();
    expect(screen.getByText(/Nova Instrução Normativa/i)).toBeInTheDocument();
  });

  it("exibe estado vazio quando não há demandas", async () => {
    vi.mocked(listarDemandas).mockResolvedValue([]);

    render(<BoardPage />);

    expect(
      await screen.findByText(/Nenhuma demanda encontrada/i),
    ).toBeInTheDocument();
  });
});
