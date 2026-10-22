import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Outerwear" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Outerwear" intro="Jackets in the Harbor line." preset={{ productType: "outerwear" }} searchParams={searchParams} />;
}
