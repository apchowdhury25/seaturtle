import Link from "next/link";
import { Suspense } from "react";
import { listWishlist } from "@/server/storefront";

export const metadata = { title: "Wishlist", robots: { index: false, follow: false } };

async function Saved() {
  const rows = await listWishlist();
  if (rows.length === 0) return <p>Nothing is saved. Sign in on a product page and choose Save to wishlist.</p>;
  return (
    <ul className="grid gap-3">
      {rows.map((row) => {
        const product = Array.isArray(row.products) ? row.products[0] : row.products;
        if (!product) return null;
        return <li key={String(row.product_id)}><Link href={`/products/${product.slug}`} className="underline">{String(product.name)}</Link></li>;
      })}
    </ul>
  );
}

export default function WishlistPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-navy">Wishlist</h1>
      <div className="mt-8"><Suspense fallback={<p>Loading saved pieces…</p>}><Saved /></Suspense></div>
    </section>
  );
}
