import { Suspense } from "react";
import { CatalogScreen } from "@/components/catalog-screen";

const PRESETS: Record<string, { title: string; intro: string; gender?: string; productType?: string; category?: string }> = {
  "mens-denim": { title: "Men's Denim", intro: "Men's denim currently published.", gender: "men", productType: "jeans" },
  "womens-denim": { title: "Women's Denim", intro: "Women's denim currently published.", gender: "women", productType: "jeans" },
  "mens-underwear": { title: "Men's Underwear", intro: "Hygiene return rules apply where the law allows.", category: "mens-underwear" },
  "womens-underwear": { title: "Women's Underwear", intro: "Hygiene return rules apply where the law allows.", category: "womens-underwear" },
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
