import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Lounge" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Lounge" intro="Softer clothes in the Dune line." preset={{ productType: "lounge" }} searchParams={searchParams} />;
}
