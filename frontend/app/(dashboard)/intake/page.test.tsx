import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  injetarDemanda: vi.fn(),
}));

import { injetarDemanda } from "@/lib/api";
import IntakePage from "./page";

describe("IntakePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantém o botão desabilitado com texto vazio", () => {
    render(<IntakePage />);

    const botao = screen.getByRole("button", { name: /Enviar para o Intake/i });
    expect(botao).toBeDisabled();
  });

  it("habilita o botão e envia a demanda ao preencher o texto", async () => {
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
});
