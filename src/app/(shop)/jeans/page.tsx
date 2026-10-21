import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Jeans and Denim" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Jeans and Denim" intro="Denim styles with a published product type of jeans." preset={{ productType: "jeans" }} searchParams={searchParams} />;
}
