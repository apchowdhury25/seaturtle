import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Men" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Men" intro="Men's clothing." preset={{ gender: "men" }} searchParams={searchParams} />;
}
