import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Shop All" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Shop All" intro="The Coastal Collection. Published inventory replaces the house lookbook once the catalog database is connected." preset={{}} searchParams={searchParams} />;
}
