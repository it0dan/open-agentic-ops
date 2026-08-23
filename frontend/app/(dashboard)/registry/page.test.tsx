import { fireEvent, render, screen } from "@testing-library/react";
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
import RegistryPage from "./page";

describe("RegistryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza as demandas vindas da API", async () => {
    vi.mocked(listarDemandas).mockResolvedValue(demandasMock);

    render(<RegistryPage />);

    expect(await screen.findByText(/Adicionar botão de download/i)).toBeInTheDocument();
    expect(screen.getByText(/Nova Instrução Normativa/i)).toBeInTheDocument();
  });

  it("exibe estado vazio quando não há demandas", async () => {
    vi.mocked(listarDemandas).mockResolvedValue([]);

    render(<RegistryPage />);

    expect(
      await screen.findByText(/Nenhuma demanda encontrada/i),
    ).toBeInTheDocument();
  });

  it("alterna para a visão de colunas ao clicar no toggle", async () => {
    vi.mocked(listarDemandas).mockResolvedValue(demandasMock);

    render(<RegistryPage />);

    await screen.findByText(/Adicionar botão de download/i);

    fireEvent.click(screen.getByRole("button", { name: /Colunas/i }));

    expect(await screen.findByText(/Triado/i)).toBeInTheDocument();
  });
});
