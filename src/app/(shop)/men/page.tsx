import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Men" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Men" intro="Men's styles in the Coastal Collection, plus unisex kits and socks." preset={{ gender: "men" }} searchParams={searchParams} />;
}
