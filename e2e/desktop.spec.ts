import { expect, test } from "@playwright/test";
import { hideCookieBar, horizontalOverflow } from "./layout";
import { LAYOUT_PAGES } from "./routes";

test.beforeEach(async ({ page }) => {
  await hideCookieBar(page);
});

test("homepage plays the swimming clip inside the sea turtles band", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "The Coastal Collection" })).toBeVisible();
  await page.getByRole("link", { name: "Shop Men" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Men" })).toBeVisible();

  await page.goto("/");
  const video = page.locator("video");
  await video.scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Sea turtles" })).toBeVisible();
  await expect.poll(async () =>
    video.evaluate((node) => {
      const element = node as HTMLVideoElement;
      return element.readyState >= 2 && element.videoWidth === 960 && element.videoHeight === 944 && !element.paused;
    }),
  ).toBe(true);
  const mask = await video.evaluate((node) => getComputedStyle(node).maskImage);
  expect(mask).not.toBe("none");
});

test("search reaches a lookbook style and the product cannot be bagged", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("search").getByRole("textbox", { name: "Search the catalog" });
  await search.fill("pima");
  await expect(page.getByRole("listbox", { name: "Search suggestions" }).getByRole("link", { name: "Reef Pima Crew" })).toBeVisible();
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=pima/);
  await expect(page.getByRole("heading", { level: 1, name: "Search" })).toBeVisible();
  await page.getByRole("link", { name: "Reef Pima Crew" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Reef Pima Crew" })).toBeVisible();
  await expect(page.getByText("cannot be added to a bag")).toBeVisible();
  await expect(page.getByRole("button", { name: /add to/i })).toHaveCount(0);
});

test("cart, checkout, and sign-in stay honest without a database", async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByText("The cart is unavailable until the server database key is configured.")).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { level: 1, name: "Checkout" })).toBeVisible();
  await page.goto("/account/login");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Sign in" }) });
  await form.getByLabel("Email").fill("qa@example.com");
  await form.getByLabel("Password").fill("not-a-real-password");
  await form.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("status")).toContainText("Sign-in needs Supabase Auth.");
});

test("cookie choice can be rejected", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("sta_cookie"));
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Cookies" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Reject optional" }).click();
  await expect(dialog).toBeHidden();
});

test("key pages do not paint past the desktop viewport", async ({ page }) => {
  for (const route of LAYOUT_PAGES) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await horizontalOverflow(page), route).toEqual([]);
  }
});
