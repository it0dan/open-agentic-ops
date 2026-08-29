import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInMock = vi.fn();

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    signInMock.mockClear();
  });

  it("dispara signIn('keycloak') ao clicar em entrar", () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /Entrar com Keycloak/i }));

    expect(signInMock).toHaveBeenCalledWith("keycloak");
  });
});
