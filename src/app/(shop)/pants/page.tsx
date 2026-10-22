import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Pants" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Pants" intro="Chinos and trousers in the Drift line." preset={{ productType: "pants" }} searchParams={searchParams} />;
}
