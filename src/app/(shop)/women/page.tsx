import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Women" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Women" intro="Women's styles in the Coastal Collection, plus unisex kits and socks." preset={{ gender: "women" }} searchParams={searchParams} />;
}
