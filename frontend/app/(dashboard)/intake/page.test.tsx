import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  injetarDemanda: vi.fn(),
  listarDemandas: vi.fn(),
  autorarSpec: vi.fn(),
}));

import { injetarDemanda, autorarSpec, listarDemandas } from "@/lib/api";
import type { Demanda } from "@/lib/mock-data";
import IntakePage from "./page";

const DEMANDA_ALTA: Demanda = {
  thread_id: "abc-123",
  origem: "regulatorio",
  ambiguidade: "alta",
  spec_autor: "fde",
  dominio: "backend",
  status: "spec_pronta",
  spec: "Adequar consentimento ao novo normativo.",
  worktrees: [],
  adrs: [],
  feedback_review: [],
};

describe("IntakePage", () => {
  it("mantém o botão desabilitado com texto vazio", () => {
    vi.mocked(listarDemandas).mockResolvedValue([]);
    render(<IntakePage />);

    const botao = screen.getByRole("button", { name: /Enviar para o Intake/i });
    expect(botao).toBeDisabled();
  });

  it("habilita o botão e envia a demanda ao preencher o texto", async () => {
    vi.mocked(listarDemandas).mockResolvedValue([]);
    vi.mocked(injetarDemanda).mockResolvedValue({} as never);

    render(<IntakePage />);

    const textarea = screen.getByPlaceholderText(/Descreva a demanda/i);
    fireEvent.change(textarea, { target: { value: "Nova demanda de teste" } });

    const botao = screen.getByRole("button", { name: /Enviar para o Intake/i });
    expect(botao).toBeEnabled();

    fireEvent.click(botao);

    await waitFor(() => {
      expect(injetarDemanda).toHaveBeenCalledWith({
        origem: "cliente",
        texto: "Nova demanda de teste",
      });
    });
  });

  it("libera a spec autorada para o grafo", async () => {
    const user = userEvent.setup();
    vi.mocked(autorarSpec).mockResolvedValue({} as never);
    vi.mocked(listarDemandas).mockResolvedValue([DEMANDA_ALTA]);

    render(<IntakePage />);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText(/Componha a spec do FDE/i)).toHaveLength(1);
    });
    const textareas = screen.getAllByPlaceholderText(/Componha a spec do FDE/i);

    await user.type(textareas[0], "Spec autorada pelo FDE.");

    await waitFor(() => {
      const botao = screen.getAllByRole("button", { name: /Liberar para o grafo/i })[0];
      expect(botao).toBeEnabled();
    });

    const botao = screen.getAllByRole("button", { name: /Liberar para o grafo/i })[0];
    await user.click(botao);

    await waitFor(() => {
      expect(autorarSpec).toHaveBeenCalledWith("abc-123", "Spec autorada pelo FDE.");
    });
  });
});
