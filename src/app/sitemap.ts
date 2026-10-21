import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

const paths = [
  "", "/shop", "/new", "/best-sellers", "/men", "/women", "/jeans", "/polos", "/dresses",
  "/mens-underwear", "/womens-underwear", "/about", "/mission", "/sustainability", "/sourcing",
  "/manufacturing", "/conservation", "/impact", "/size-guide", "/fabric-care", "/shipping",
  "/returns", "/faq", "/contact", "/privacy", "/terms", "/shipping-policy", "/returns-policy",
  "/cookies", "/accessibility", "/journal",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: `${siteUrl()}${path || "/"}`, changeFrequency: "weekly", priority: path === "" ? 1 : 0.6 }));
}
