import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Search", robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Search" intro="Results come from published product names and SKUs." preset={{}} searchParams={searchParams} />;
}
