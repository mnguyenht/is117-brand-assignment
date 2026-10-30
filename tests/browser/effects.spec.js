import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.route(/spline\.design/, (route) => route.abort());
});

test("the shop shows the flat shirt and never requests the 3D viewer", async ({
  page,
}) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await page.waitForLoadState("load");
  await expect(page.locator(".shirt-image")).toBeVisible();
  await expect(page.locator("spline-viewer")).toHaveCount(0);
  expect(requests.filter((url) => url.includes("spline.design"))).toEqual([]);
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

test("the panel grid stops painting while scrolled off-screen", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const canvas = page.locator(".panel-grid");
  const snapshot = () => canvas.evaluate((element) => element.toDataURL());
  const visibleBefore = await snapshot();
  await page.waitForTimeout(400);
  const visibleAfter = await snapshot();
  expect(visibleAfter).not.toBe(visibleBefore);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect
    .poll(() =>
      page.locator(".product-visual").evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.bottom <= 0 || box.top >= window.innerHeight;
      }),
    )
    .toBe(true);
  await page.waitForTimeout(100);
  const hiddenBefore = await snapshot();
  await page.waitForTimeout(400);
  const hiddenAfter = await snapshot();
  expect(hiddenAfter).toBe(hiddenBefore);
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
