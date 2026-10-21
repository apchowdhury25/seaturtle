import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Dresses" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Dresses" intro="Dresses currently published in the catalog." preset={{ productType: "dress" }} searchParams={searchParams} />;
}
