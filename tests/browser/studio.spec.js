import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(/spline\.design/, (route) => route.abort());
});

test("negative: choosing no size explains the problem and keeps the bag empty", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Add to demo bag", exact: true })
    .click();
  await expect(page.locator("#size-error")).toBeVisible();
  await expect(page.locator("#size-error")).not.toBeEmpty();
  await expect(page.locator("#bag-count")).toHaveText("0");
});

test('negative: an empty demo bag shows no "Empty demo bag" button', async ({
  page,
}) => {
  await page.goto("/");
  const clearBag = page.getByRole("button", {
    name: "Empty demo bag",
    exact: true,
  });
  await expect(clearBag).toBeHidden();
  await page.locator('input[name="size"][value="M"]').check();
  await page
    .getByRole("button", { name: "Add to demo bag", exact: true })
    .click();
  await expect(clearBag).toBeVisible();
  await clearBag.click();
  await expect(clearBag).toBeHidden();
});

test("positive: a shopper can choose sizes, add items, and empty the demo bag", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('input[name="size"][value="M"]').check();
  await page
    .getByRole("button", { name: "Add to demo bag", exact: true })
    .click();
  await expect(page.locator("#bag-count")).toHaveText("1");
  await expect(page.locator("#bag-status")).toContainText("M");
  await page.locator('input[name="size"][value="L"]').check();
  await page
    .getByRole("button", { name: "Add to demo bag", exact: true })
    .click();
  await expect(page.locator("#bag-count")).toHaveText("2");
  await page
    .getByRole("button", { name: "Empty demo bag", exact: true })
    .click();
  await expect(page.locator("#bag-count")).toHaveText("0");
  await page.reload();
  await expect(page.locator("#bag-count")).toHaveText("0");
});

test("positive: adding a size shows a visible confirmation next to the button", async ({
  page,
}) => {
  await page.goto("/");
  const confirmation = page.locator("#add-confirm");
  await expect(confirmation).toBeHidden();
  await page.locator('input[name="size"][value="S"]').check();
  await page
    .getByRole("button", { name: "Add to demo bag", exact: true })
    .click();
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toHaveText("Added to demo bag");
});

test("negative: no confirmation appears when no size is chosen", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Add to demo bag", exact: true })
    .click();
  await expect(page.locator("#size-error")).toBeVisible();
  await expect(page.locator("#add-confirm")).toBeHidden();
});

test("keyboard: the skip link reaches main and the size controls work without a mouse", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: /skip/i });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  // Focus a native radio, then use its real keyboard behavior and the next control.
  await page.locator('input[name="size"][value="S"]').focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('input[name="size"][value="M"]')).toBeChecked();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Add to demo bag", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#bag-count")).toHaveText("1");
});

for (const route of ["/", "/styleguide.html", "/studio.html"]) {
  test(`page integrity and automated accessibility: ${route}`, async ({
    page,
  }) => {
    const failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("response", (response) => {
      if (
        response.url().startsWith("http://127.0.0.1:5174") &&
        response.status() >= 400
      ) {
        failures.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible();
    const brokenImages = await page
      .locator("img")
      .evaluateAll((images) =>
        images
          .filter((image) => !image.complete || image.naturalWidth === 0)
          .map((image) => image.src),
      );
    expect(brokenImages).toEqual([]);
    const links = await page
      .locator("a[href]")
      .evaluateAll((anchors) =>
        anchors.map((anchor) => anchor.getAttribute("href")),
      );
    for (const href of links) {
      if (href.startsWith("#")) {
        expect(
          await page.locator(`[id="${href.slice(1)}"]`).count(),
          href,
        ).toBeGreaterThan(0);
      } else if (!/^(https?:|mailto:)/.test(href)) {
        const response = await page.request.get(new URL(href, page.url()).href);
        expect(response.ok(), href).toBeTruthy();
      }
    }
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(failures).toEqual([]);
  });

  test(`narrow screen: readable page without horizontal overflow ${route}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await expect(page.getByRole("main")).toBeVisible();
  });
}
