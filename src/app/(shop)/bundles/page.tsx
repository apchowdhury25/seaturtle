import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Bundles" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Bundles" intro="Kits at one planned price. The pieces are also sold separately in the lookbook." preset={{ productType: "bundle" }} searchParams={searchParams} />;
}
