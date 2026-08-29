import { expect, test, type Page } from "@playwright/test";

const USER = "fde-tenant-a";
const PASS = "fde-password";

async function login(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("button", { name: /Entrar com Keycloak/i }).click();
  await page.waitForURL(/localhost:8080/);
  await page.locator("#username").fill(USER);
  await page.locator("#password").fill(PASS);
  await page.locator("#kc-login").click();
  await page.waitForURL(/localhost:3000/);
}

test.describe("Console do FDE — E2E", () => {
  test("login OIDC via Keycloak e TenantBadge", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("tenant-a").first()).toBeVisible();
  });

  test("demandas reais por tenant (sem modo demo)", async ({ page }) => {
    await login(page);
    await page.goto("/tasks");
    await expect(page.getByText("Modo demo", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Dashboard de saldo")).toBeVisible();
  });

  test("HITL — aprovar demanda em aguardando_hitl avança para a próxima etapa", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/tasks");
    const card = page.getByText("E2E baixa ambiguidade").first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.getByText("Decisão do FDE (HITL)")).toBeVisible();
    await expect(page.getByText(/etapa/i).first()).toBeVisible();
    await page
      .getByRole("button", { name: "Aprovar", exact: true })
      .click();
    // Com o HITL por etapa (ADR-0025), aprovar um gate avança para o próximo;
    // o painel permanece visível enquanto houver etapa pendente.
    await expect(page.getByText("Decisão do FDE (HITL)")).toBeVisible();
  });

  test("autoria de spec — liberar demanda em aguardando_autoria", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/tasks");
    const card = page.getByText("E2E alta ambiguidade").first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.getByText("Autoria de spec (FDE)")).toBeVisible();
    await page
      .getByPlaceholder("Componha a spec do FDE…")
      .fill("Spec E2E: implementar endpoint de interoperabilidade com contrato definido.");
    await page.getByRole("button", { name: /Liberar para o grafo/i }).click();
    await expect(page.getByText("Autoria de spec (FDE)")).toHaveCount(0);
  });

  test("Audit — classificações do Intake por tenant", async ({ page }) => {
    await login(page);
    await page.goto("/audit");
    await expect(page.getByText("Classificações do Intake")).toBeVisible();
    await expect(page.getByText("Correção da heurística")).toBeVisible();
  });
});
