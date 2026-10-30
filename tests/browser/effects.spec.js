import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("default config does not load Spline", async ({ page }) => {
  const unpkgRequests = [];
  page.on("request", (request) => {
    if (request.url().startsWith("https://unpkg.com")) {
      unpkgRequests.push(request.url());
    }
  });
  await page.goto("/");
  await expect(page.locator("spline-viewer")).toHaveCount(0);
  expect(unpkgRequests).toEqual([]);
});

test("grid is decorative and does not block the shop", async ({ page }) => {
  await page.goto("/");
  const grid = page.locator("#grid-bg");
  await expect(grid).toHaveAttribute("aria-hidden", "true");
  await expect(grid).toHaveCSS("pointer-events", "none");
  await page.locator('input[name="size"][value="M"]').check();
  await page.getByRole("button", { name: "Add to demo bag" }).click();
  await expect(page.locator("#bag-count")).toHaveText("1");
});

test("grid canvas stays viewport-sized at high device scale", async ({
  browser,
}) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 800, height: 600 },
  });
  const page = await context.newPage();
  await page.goto("/");
  const box = await page.locator("#grid-bg").boundingBox();
  expect(box).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  await context.close();
});

test("reduced motion skips the intro", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/intro/);
});

test("intro runs once per session", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/intro/);
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/intro/);
});

test("local tuning page has nine controls and is axe clean", async ({
  page,
}) => {
  await page.goto("/tune.html");
  await expect(page.getByTitle("Shop preview")).toBeVisible();
  await expect(page.locator('input[type="range"]')).toHaveCount(9);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
