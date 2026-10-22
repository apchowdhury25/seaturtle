import { expect, test } from "@playwright/test";
import { publicPages } from "./routes";

test("public pages answer and the health check stays free of secrets", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  const body = (await health.json()) as { ok?: boolean; service?: string; supabase?: boolean };
  expect(body.ok).toBe(true);
  expect(body.service).toBe("seaturtle-apparel");
  expect(body).not.toHaveProperty("key");

  const pages = publicPages();
  expect(pages.length).toBeGreaterThan(30);
  const failures: string[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < pages.length) {
      const route = pages[cursor++];
      const response = await request.get(route);
      if (response.status() >= 400) failures.push(`${response.status()} ${route}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, () => worker()));
  expect(failures, failures.join("\n")).toEqual([]);
});

test("missing URLs and the sitemap stay honest", async ({ request }) => {
  const missing = await request.get("/does-not-exist");
  expect(missing.status()).toBe(404);

  const unknownProduct = await request.get("/products/not-a-real-style");
  expect([200, 404]).toContain(unknownProduct.status());
  expect(await unknownProduct.text()).toContain("This page is not on the map.");

  expect((await request.get("/sitemap.xml")).ok()).toBeTruthy();
  expect((await request.get("/robots.txt")).ok()).toBeTruthy();
});
