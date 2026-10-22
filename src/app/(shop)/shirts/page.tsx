import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Shirts" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Shirts" intro="Overshirts and blouses in Harbor and Reef." preset={{ productType: "shirt" }} searchParams={searchParams} />;
}
