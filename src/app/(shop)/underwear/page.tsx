import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Underwear" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Underwear" intro="Folded still lifes. Hygiene return rules apply where the law allows." preset={{ productType: "underwear" }} searchParams={searchParams} />;
}
