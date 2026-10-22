import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Socks" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Socks" intro="Dress socks in the Tide line, shown folded." preset={{ productType: "socks" }} searchParams={searchParams} />;
}
