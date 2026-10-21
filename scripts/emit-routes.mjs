import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
// Windows file URL pathname starts with /C: — normalize.
const base = root.startsWith("/") && process.platform === "win32" ? root.slice(1) : root;

function write(relative, source) {
  const path = join(base, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, source);
}

const catalog = (title, intro, preset) => `import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: ${JSON.stringify(title)} };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title=${JSON.stringify(title)} intro=${JSON.stringify(intro)} preset={${preset}} searchParams={searchParams} />;
}
`;

const pages = {
  "src/app/(shop)/shop/page.tsx": catalog("Shop All", "Active products from the catalog.", "{}"),
  "src/app/(shop)/new/page.tsx": catalog("New Arrivals", "Ordered by publication date.", '{ sort: "newest" }'),
  "src/app/(shop)/best-sellers/page.tsx": catalog("Best Sellers", "Ordered by featured placement until paid-order history exists. This is not a sales ranking yet.", '{ sort: "popular" }'),
  "src/app/(shop)/men/page.tsx": catalog("Men", "Men's clothing.", '{ gender: "men" }'),
  "src/app/(shop)/women/page.tsx": catalog("Women", "Women's clothing.", '{ gender: "women" }'),
  "src/app/(shop)/jeans/page.tsx": catalog("Jeans and Denim", "Denim styles with a published product type of jeans.", '{ productType: "jeans" }'),
  "src/app/(shop)/polos/page.tsx": catalog("Cotton Polos", "Polos currently published in the catalog.", '{ productType: "polo" }'),
  "src/app/(shop)/dresses/page.tsx": catalog("Dresses", "Dresses currently published in the catalog.", '{ productType: "dress" }'),
  "src/app/(shop)/mens-underwear/page.tsx": catalog("Men's Underwear", "Hygiene rules for returns are described on the returns page and apply where the law allows.", '{ category: "mens-underwear", gender: "men" }'),
  "src/app/(shop)/womens-underwear/page.tsx": catalog("Women's Underwear", "Hygiene rules for returns are described on the returns page and apply where the law allows.", '{ category: "womens-underwear", gender: "women" }'),
  "src/app/(shop)/search/page.tsx": `import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Search", robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Search" intro="Results come from published product names and SKUs." preset={{}} searchParams={searchParams} />;
}
`,
};

const editorial = ["about", "mission", "sustainability", "sourcing", "manufacturing", "impact", "fabric-care", "shipping", "returns", "privacy", "terms", "shipping-policy", "returns-policy", "cookies", "accessibility"];
const titles = {
  about: "About Us",
  mission: "Our Mission",
  sustainability: "Sustainability",
  sourcing: "Responsible Sourcing",
  manufacturing: "Manufacturing and Traceability",
  impact: "Impact and Progress",
  "fabric-care": "Fabric and Care",
  shipping: "Shipping and Delivery",
  returns: "Returns and Exchanges",
  privacy: "Privacy Policy",
  terms: "Terms and Conditions",
  "shipping-policy": "Shipping Policy",
  "returns-policy": "Returns and Refund Policy",
  cookies: "Cookie Preferences",
  accessibility: "Accessibility Statement",
};

for (const [file, source] of Object.entries(pages)) write(file, source);
for (const slug of editorial) {
  const route = slug === "shipping-policy" ? "shipping-policy" : slug === "returns-policy" ? "returns-policy" : slug === "fabric-care" ? "fabric-care" : slug;
  write(`src/app/(shop)/${route}/page.tsx`, `import { ContentView } from "@/components/content-view";

export const metadata = { title: ${JSON.stringify(titles[slug])} };

export default function Page() {
  return <ContentView slug=${JSON.stringify(slug)} />;
}
`);
}

console.log("wrote routes", Object.keys(pages).length + editorial.length);
