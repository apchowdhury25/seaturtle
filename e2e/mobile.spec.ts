import { expect, test } from "@playwright/test";
import { hideCookieBar, horizontalOverflow } from "./layout";
import { LAYOUT_PAGES } from "./routes";

test.beforeEach(async ({ page }) => {
  await hideCookieBar(page);
});

test("the phone menu reaches the women's catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByText("Sea Turtle Apparel")).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("navigation", { name: "Mobile" });
  await expect(menu.getByRole("link", { name: "Shop All" })).toBeVisible();
  await menu.getByRole("link", { name: "Women" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Women" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
});

test("the swimming clip fits the phone band", async ({ page }) => {
  await page.goto("/");
  const video = page.locator("video");
  await video.scrollIntoViewIfNeeded();
  const box = await video.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(390);
  expect(box!.width / box!.height).toBeGreaterThan(0.95);
  expect(box!.width / box!.height).toBeLessThan(1.08);
});

test("key pages do not paint past a 390px phone", async ({ page }) => {
  for (const route of LAYOUT_PAGES) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await horizontalOverflow(page), route).toEqual([]);
  }
});
