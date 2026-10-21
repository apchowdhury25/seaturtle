import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Women" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Women" intro="Women's clothing." preset={{ gender: "women" }} searchParams={searchParams} />;
}
