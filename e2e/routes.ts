import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const APP = path.join(process.cwd(), "src", "app");

function routeFrom(segments: string[]): string {
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

/** Public pages discovered from the App Router tree, plus one real lookbook URL. */
export function publicPages(): string[] {
  const routes = new Set<string>();

  function walk(directory: string, segments: string[]) {
    for (const entry of readdirSync(directory)) {
      const full = path.join(directory, entry);
      if (!statSync(full).isDirectory()) {
        if (entry === "page.tsx") routes.add(routeFrom(segments));
        continue;
      }
      if (entry.startsWith("[[")) {
        if (existsSync(path.join(full, "page.tsx"))) routes.add(routeFrom(segments));
        continue;
      }
      if (entry.startsWith("[")) continue;
      const next = entry.startsWith("(") && entry.endsWith(")") ? segments : [...segments, entry];
      walk(full, next);
    }
  }

  walk(APP, []);
  routes.add("/products/reef-pima-crew");
  routes.add("/collections/reef");
  return [...routes].sort();
}

export const LAYOUT_PAGES = ["/", "/shop", "/men", "/women", "/products/reef-pima-crew", "/cart", "/account/login", "/conservation"];
