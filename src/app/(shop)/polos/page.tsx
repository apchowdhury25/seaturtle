import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Cotton Polos" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Cotton Polos" intro="Polos currently published in the catalog." preset={{ productType: "polo" }} searchParams={searchParams} />;
}
