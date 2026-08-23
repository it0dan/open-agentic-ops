import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  injetarDemanda: vi.fn(),
}));

import { injetarDemanda } from "@/lib/api";
import { NovaDemandaModal } from "./nova-demanda-modal";

describe("NovaDemandaModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza os campos de título, origem, subtipo, prioridade e descrição", () => {
    render(<NovaDemandaModal aberto onClose={() => {}} />);

    expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
    expect(screen.getByText("Origem")).toBeInTheDocument();
    expect(screen.getByText("Subtipo")).toBeInTheDocument();
    expect(screen.getByText("Prioridade")).toBeInTheDocument();
    expect(screen.getByLabelText(/Descrição da demanda/i)).toBeInTheDocument();
  });

  it("usa regulatório como origem default e troca subtipos ao mudar a origem", () => {
    render(<NovaDemandaModal aberto onClose={() => {}} />);

    expect(screen.getByText("Norma")).toBeInTheDocument();
    expect(screen.getByText("Instrução normativa")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /Estratégia/i }));

    expect(screen.getByText("Nova funcionalidade")).toBeInTheDocument();
    expect(screen.getByText("Melhoria")).toBeInTheDocument();
  });

  it("envia título, subtipo e prioridade no payload", async () => {
    vi.mocked(injetarDemanda).mockResolvedValue({} as never);

    render(<NovaDemandaModal aberto onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText(/Título/i), {
      target: { value: "Onboarding digital PJ" },
    });
    fireEvent.change(screen.getByLabelText(/Descrição da demanda/i), {
      target: { value: "Lançar onboarding digital para clientes PJ." },
    });
    fireEvent.click(screen.getByRole("radio", { name: /Estratégia/i }));
    fireEvent.click(screen.getByText("Nova funcionalidade"));
    fireEvent.click(screen.getByText("Alta"));

    fireEvent.click(screen.getByRole("button", { name: /Enviar para o Intake/i }));

    await waitFor(() => {
      expect(injetarDemanda).toHaveBeenCalledWith({
        origem: "estrategia",
        origem_subtipo: "nova_funcionalidade",
        prioridade: "alta",
        titulo: "Onboarding digital PJ",
        texto: "Lançar onboarding digital para clientes PJ.",
      });
    });
  });

  it("mantém o botão desabilitado sem título", async () => {
    render(<NovaDemandaModal aberto onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText(/Descrição da demanda/i), {
      target: { value: "Uma demanda sem título." },
    });

    expect(
      screen.getByRole("button", { name: /Enviar para o Intake/i }),
    ).toBeDisabled();
  });

  it("fecha ao pressionar Escape", async () => {
    const onClose = vi.fn();
    render(<NovaDemandaModal aberto onClose={onClose} />);

    fireEvent.keyDown(document.body, { key: "Escape" });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("fecha ao clicar fora do modal (overlay)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NovaDemandaModal aberto onClose={onClose} />);

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeNull();
    await user.pointer({ keys: "[MouseLeft]", target: overlay as Element });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
