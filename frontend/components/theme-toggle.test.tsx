import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

const setThemeMock = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: setThemeMock, theme: "light" }),
}));

import { ThemeToggle } from "@/components/theme-toggle";

function renderToggle() {
  return render(
    <TooltipProvider>
      <ThemeToggle />
    </TooltipProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    setThemeMock.mockClear();
  });

  it("cicla para o próximo tema com um clique (light -> system)", async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole("button"));

    expect(setThemeMock).toHaveBeenCalledWith("system");
  });

  it("expõe o tema atual e o próximo no aria-label", () => {
    renderToggle();

    expect(
      screen.getByRole("button", { name: /Tema atual: light/i }),
    ).toBeInTheDocument();
  });
});
