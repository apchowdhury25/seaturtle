import { Suspense } from "react";
import { CatalogScreen } from "@/components/catalog-screen";

const PRESETS: Record<string, { title: string; intro: string; gender?: string; productType?: string; category?: string; collection?: string }> = {
  "mens-denim": { title: "Men's Denim", intro: "Men's denim. The house lookbook fills this page while the catalog database is offline.", gender: "men", productType: "jeans" },
  "womens-denim": { title: "Women's Denim", intro: "Women's denim. The house lookbook fills this page while the catalog database is offline.", gender: "women", productType: "jeans" },
  "mens-underwear": { title: "Men's Underwear", intro: "Shown folded. Hygiene return rules apply where the law allows.", category: "mens-underwear" },
  "womens-underwear": { title: "Women's Underwear", intro: "Shown folded. Hygiene return rules apply where the law allows.", category: "womens-underwear" },
  reef: { title: "Reef", intro: "Everyday cotton and linen. Planned styles, not reserved stock.", collection: "reef" },
  drift: { title: "Drift", intro: "Pants and denim. Planned styles, not reserved stock.", collection: "drift" },
  tide: { title: "Tide", intro: "Underwear and socks, shown folded. Planned styles, not reserved stock.", collection: "tide" },
  harbor: { title: "Harbor", intro: "Polos, shirts, and jackets. Planned styles, not reserved stock.", collection: "harbor" },
  dune: { title: "Dune", intro: "Lounge clothes and the shirt dress. Planned styles, not reserved stock.", collection: "dune" },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const preset = PRESETS[slug];
  const title = preset?.title ?? slug.replaceAll("-", " ");
  return { title: title.slice(0, 1).toUpperCase() + title.slice(1) };
}

async function CollectionBody({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const preset = PRESETS[slug] ?? { title: slug.replaceAll("-", " "), intro: "Collection filtered by the slug.", category: slug };
  return <CatalogScreen title={preset.title} intro={preset.intro} preset={preset} searchParams={searchParams} />;
}

export default function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<p className="px-4 py-12">Loading the collection…</p>}>
      <CollectionBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}
