import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Women's Underwear" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Women's Underwear" intro="Hygiene rules for returns are described on the returns page and apply where the law allows." preset={{ category: "womens-underwear", gender: "women" }} searchParams={searchParams} />;
}
