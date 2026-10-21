import { CatalogScreen } from "@/components/catalog-screen";

export const metadata = { title: "Best Sellers" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen title="Best Sellers" intro="Ordered by featured placement until paid-order history exists. This is not a sales ranking yet." preset={{ sort: "popular" }} searchParams={searchParams} />;
}
