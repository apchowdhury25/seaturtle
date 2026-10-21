import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "New Arrivals" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="New Arrivals" intro="Ordered by publication date." preset={{ sort: "newest" }} searchParams={searchParams} />;
}
