import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "New Arrivals" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="New Arrivals" intro="Newest styles first. In the lookbook this is a design order, not a receiving date." preset={{ sort: "newest" }} searchParams={searchParams} />;
}
