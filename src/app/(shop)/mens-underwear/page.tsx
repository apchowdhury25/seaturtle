import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Men's Underwear" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Men's Underwear" intro="Hygiene rules for returns are described on the returns page and apply where the law allows." preset={{ category: "mens-underwear", gender: "men" }} searchParams={searchParams} />;
}
