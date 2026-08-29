import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TenantBadge } from "@/components/tenant-badge";

describe("TenantBadge", () => {
  it("exibe o tenant quando presente", () => {
    render(<TenantBadge tenantId="tenant-a" />);
    expect(screen.getByText("tenant-a")).toBeInTheDocument();
  });

  it("não renderiza nada quando o tenant está ausente", () => {
    const { container } = render(<TenantBadge tenantId={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
