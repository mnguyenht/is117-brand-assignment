import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(/spline\.design/, (route) => route.abort());
});

async function reset(page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

async function signInDemo(page) {
  await page.goto("/account.html");
  await page.locator("#signin-email").fill("alex@example.com");
  await page.locator("#signin-password").fill("demo123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Signed in as alex@example.com")).toBeVisible();
}
async function addSize(page, size, times = 1) {
  await page.goto("/");
  await page.locator(`input[name="size"][value="${size}"]`).check();
  for (let count = 0; count < times; count += 1) {
    await page.getByRole("button", { name: "Add to demo bag" }).click();
  }
}

async function seedStore(page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "standard-issue:demo-user",
      JSON.stringify({ id: "demo", email: "alex@example.com", demo: true }),
    );
    localStorage.setItem(
      "standard-issue:cart",
      JSON.stringify([{ size: "M", qty: 1 }]),
    );
    sessionStorage.setItem(
      "standard-issue:shipping",
      JSON.stringify({
        fullName: "Alex Doe",
        address: "12 Main Street",
        city: "Newark",
        postalCode: "07102",
        country: "United States",
      }),
    );
  });
}

async function openRealLayout(page, route) {
  if (["/account.html", "/forgot.html", "/reset.html"].includes(route)) {
    await page.goto(route);
    return page.locator(
      route === "/account.html"
        ? "#account-content"
        : route === "/forgot.html"
          ? "#forgot-form"
          : "#reset-form",
    );
  }
  await seedStore(page);
  if (route === "/order.html") {
    await page.goto("/payment.html");
    await page.locator("#place-order").click();
    await expect(page).toHaveURL(/order\.html\?id=/);
    return page.locator("#order-number");
  }
  await page.goto(route);
  return page.locator(
    route === "/checkout.html" ? "#fullName" : "#place-order",
  );
}

test("positive: a size stays in the bag after reload", async ({ page }) => {
  await reset(page);
  await addSize(page, "S");
  await page.reload();
  await expect(page.locator("#bag-count")).toHaveText("1");
  await expect(page.locator("#bag-items")).toContainText("Size S");
});

test("positive: Remove removes only that line", async ({ page }) => {
  await reset(page);
  await addSize(page, "S");
  await addSize(page, "L");
  await page.getByRole("button", { name: "Remove size S" }).click();
  await expect(page.locator("#bag-items")).not.toContainText("Size S");
  await expect(page.locator("#bag-items")).toContainText("Size L");
  await expect(page.locator("#bag-count")).toHaveText("1");
  await expect(
    page.getByRole("button", { name: "Remove size L" }),
  ).toBeFocused();
});

test("negative: a full bag stays unchanged and explains the limit", async ({
  page,
}) => {
  await reset(page);
  await addSize(page, "S", 11);
  await expect(page.locator("#bag-limit")).toHaveText(
    "Your bag is full: up to 10 of a size and 20 shirts in total.",
  );
  await expect(page.locator("#bag-limit")).toBeVisible();
  await expect(page.locator("#add-confirm")).toBeHidden();
  await expect(page.locator("#bag-count")).toHaveText("10");
});

test("positive: complete offline demo order", async ({ page }) => {
  await reset(page);
  await addSize(page, "M", 2);
  await signInDemo(page);
  await page.goto("/#demo-bag");
  await page.getByRole("link", { name: /Check out/ }).click();
  await page.locator("#fullName").fill("Alex Doe");
  await page.locator("#address").fill("12 Main Street");
  await page.locator("#city").fill("Newark");
  await page.locator("#postalCode").fill("07102");
  await page.locator("#country").fill("United States");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page).toHaveURL(/payment\.html$/);
  await expect(page.locator("input, select, textarea")).toHaveCount(0);
  await page.getByRole("button", { name: "Place demo order — $56.00" }).click();
  await expect(page).toHaveURL(/order\.html\?id=/);
  await expect(page.locator("#order-number")).toHaveText(/^[A-F0-9]{8}$/);
  await expect(page.locator("#order-total")).toContainText("$56.00");
  await expect(page.locator("#email-status")).toHaveText(
    "Offline demo: no email is sent.",
  );
  await expect(page.locator("#bag-count")).toHaveText("0");
});

test("negative: empty checkout form shows five errors and focuses name", async ({
  page,
}) => {
  await reset(page);
  await addSize(page, "M");
  await signInDemo(page);
  await page.goto("/checkout.html");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.locator(".field-error:visible")).toHaveCount(5);
  await expect(page).toHaveURL(/checkout\.html$/);
  await expect(page.locator("#fullName")).toBeFocused();
});

test("negative: empty bag checkout has no form", async ({ page }) => {
  await reset(page);
  await page.goto("/checkout.html");
  await expect(page.getByText("Your bag is empty.")).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
});

test("negative: payment without shipping links to checkout", async ({
  page,
}) => {
  await reset(page);
  await addSize(page, "M");
  await page.goto("/payment.html");
  await expect(
    page.getByRole("link", { name: "Back to checkout" }),
  ).toBeVisible();
  await expect(page.locator("#place-order")).toBeHidden();
});

test("account page explains offline accounts", async ({ page }) => {
  await reset(page);
  await page.goto("/account.html");
  await expect(
    page.getByText("Demo accounts: your email stays in this browser", {
      exact: false,
    }),
  ).toBeVisible();
});

for (const route of [
  "/checkout.html",
  "/payment.html",
  "/order.html",
  "/account.html",
  "/forgot.html",
  "/reset.html",
]) {
  test(`store page integrity and accessibility: ${route}`, async ({ page }) => {
    await reset(page);
    const failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    const layoutElement = await openRealLayout(page, route);
    await expect(layoutElement).toBeVisible();
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

  test(`store page has no narrow overflow: ${route}`, async ({ page }) => {
    await reset(page);
    await page.setViewportSize({ width: 375, height: 812 });
    const layoutElement = await openRealLayout(page, route);
    await expect(layoutElement).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  });
}

test("demo account changes the header and can sign out", async ({ page }) => {
  await reset(page);
  await signInDemo(page);
  await expect(page.locator("#account-link")).toHaveText("Account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.locator("#account-link")).toHaveText("Sign in");
});

test("signed-out checkout requires sign in and has no form", async ({
  page,
}) => {
  await reset(page);
  await addSize(page, "M");
  await page.goto("/checkout.html");
  await expect(page.getByText("Sign in to check out.")).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
});

test("forgot and reset pages explain demo behavior", async ({ page }) => {
  await reset(page);
  await page.goto("/forgot.html");
  await page.locator("#forgot-email").fill("alex@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.locator("#forgot-status")).toContainText(
    "Demo mode: no email is sent",
  );
  await page.goto("/reset.html");
  await page.locator("#new-password").fill("demo123");
  await page.locator("#confirm-password").fill("different");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.locator("#reset-status")).toHaveText(
    "Passwords must match.",
  );
  await page.locator("#confirm-password").fill("demo123");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.locator("#reset-status")).toContainText(
    "Demo mode: nothing was changed.",
  );
});

test("bag rows have thumbnails and a live checkout total", async ({ page }) => {
  await reset(page);
  await addSize(page, "M", 2);
  await expect(page.locator("#bag-items img")).toHaveCount(1);
  await expect(page.locator("#bag-items")).toContainText("Size M · Quantity 2");
  await expect(page.locator("#checkout-link")).toHaveText("Check out — $56.00");
});
