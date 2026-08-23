import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    localStorage.clear();
  });

  it("não redireciona com credenciais vazias", () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /Entrar/i }));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("autentica (mock) e redireciona ao dashboard com credenciais válidas", () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: "fde@sensedia.com" },
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: "senha" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Entrar/i }));

    expect(localStorage.getItem("fde-auth")).toBe("mock");
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });
});
