import { describe, expect, it } from "vitest";
import { findUnsupportedClaims } from "@/lib/claims";
import { LOOKBOOK, filterLookbook } from "@/content/lookbook";

describe("house lookbook", () => {
  it("publishes a full coastal collection without unsupported claims", () => {
    expect(LOOKBOOK.length).toBeGreaterThanOrEqual(16);
    for (const product of LOOKBOOK) {
      const text = `${product.name} ${product.description} ${product.shortDescription} ${product.material} ${product.sustainability} ${product.care}`;
      expect(findUnsupportedClaims(text)).toEqual([]);
      expect(product.image.startsWith("/images/lookbook/")).toBe(true);
    }
  });

  it("keeps stock filters honest", () => {
    expect(filterLookbook({ availability: "in" })).toEqual([]);
    expect(filterLookbook({ availability: "out" }).length).toBe(LOOKBOOK.length);
  });

  it("splits the shop the way the category pages do", () => {
    expect(filterLookbook({ gender: "men", productType: "jeans" }).map((item) => item.slug)).toEqual(["drift-indigo-jean"]);
    expect(filterLookbook({ gender: "women", productType: "jeans" }).map((item) => item.slug)).toEqual(["drift-coastal-jean"]);
    expect(filterLookbook({ productType: "underwear" }).map((item) => item.slug).sort()).toEqual(["tide-boxer-brief", "tide-womens-brief"]);
    expect(filterLookbook({ productType: "bundle" })).toHaveLength(1);
    expect(filterLookbook({ collection: "harbor" }).every((item) => item.line === "harbor")).toBe(true);
    expect(filterLookbook({ q: "polo" }).map((item) => item.slug)).toEqual(["harbor-polo"]);
  });

  it("puts featured styles first unless a price or date sort is chosen", () => {
    const featured = filterLookbook({ sort: "featured" });
    expect(featured[0]?.featured).toBe(true);
    const prices = filterLookbook({ sort: "price-asc" }).map((item) => item.priceMinor);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
