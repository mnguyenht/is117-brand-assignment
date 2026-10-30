import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.route(/spline\.design/, (route) => route.abort());
});

test("3D load fails gracefully when blocked", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".shirt-image")).toBeVisible();
  await expect(page.getByText("3D view couldn't load.")).toBeVisible({
    timeout: 25000,
  });
  await expect(page.locator(".shirt-image")).toBeVisible();
  expect(errors).toEqual([]);
});

test("only the product panel gets a decorative high-DPI grid", async ({
  browser,
}) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
    viewport: { width: 800, height: 900 },
  });
  const page = await context.newPage();
  await page.route(/spline\.design/, (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#grid-bg")).toHaveCount(0);
  const canvas = page.locator(".product-visual > .panel-grid");
  await expect(canvas).toHaveAttribute("aria-hidden", "true");
  const panelBox = await page.locator(".product-visual").boundingBox();
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).toEqual(panelBox);
  await context.close();
});

test("no page has the retired page-wide grid", async ({ page }) => {
  for (const route of [
    "/",
    "/checkout.html",
    "/payment.html",
    "/order.html",
    "/account.html",
    "/forgot.html",
    "/reset.html",
    "/styleguide.html",
  ]) {
    await page.goto(route);
    await expect(page.locator("#grid-bg")).toHaveCount(0);
  }
});

test("unboxing runs once in a tab and heading becomes visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    sessionStorage.setItem(
      "si:tune-overrides",
      JSON.stringify({ "--unbox-hold": "5000ms" }),
    );
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/unbox/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
    timeout: 2000,
  });
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/unbox/);
});

test("reduced motion never adds intro classes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/unbox|enter/);
});

test("local tuning page has ten controls and is axe clean", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tune.html");
  await expect(page.getByTitle("Shop preview")).toBeVisible();
  await expect(page.locator('input[type="range"]')).toHaveCount(10);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
