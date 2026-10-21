import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { formatMinor, toMajorString } from "@/lib/commerce";
import { getCatalog, getProduct } from "@/server/data";

async function ProductBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getProduct(slug);
  if (!result.configured) {
    return <p className="mx-auto max-w-3xl px-4 py-16">The catalog database is not connected, so this product cannot be loaded.</p>;
  }
  if (!result.product) notFound();
  const product = result.product;
  const related = await getCatalog({ category: product.categorySlug ?? undefined, page: 1 });
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.variants[0]?.sku,
    description: product.shortDescription,
    image: product.images.map((image) => image.src).filter(Boolean),
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      sku: variant.sku,
      priceCurrency: variant.currency,
      price: toMajorString(variant.priceMinor, variant.currency),
      availability: variant.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };
  return (
    <article className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
      <ProductGallery images={product.images.length ? product.images : [{ src: null, alt: product.name }]} name={product.name} />
      <div>
        <p className="text-xs tracking-[0.16em] text-turquoise uppercase">{product.categorySlug ?? "Sea Turtle Apparel"}</p>
        <h1 className="mt-2 font-display text-4xl text-navy md:text-5xl">{product.name}</h1>
        {product.isDemonstration ? <p className="mt-3 text-xs tracking-wide text-turtle uppercase">Demonstration product. Hidden in production.</p> : null}
        <p className="mt-4 text-muted">{product.shortDescription}</p>
        <div className="mt-8">
          <ProductPurchase
            productId={product.id}
            underwear={product.slug.includes("underwear") || (product.categorySlug ?? "").includes("underwear")}
            variants={product.variants}
          />
        </div>
        <div className="mt-10 grid gap-4 text-sm leading-6">
          <p>{product.description}</p>
          <p><strong>Material.</strong> {product.material || "Not recorded yet."}</p>
          <p><strong>Fabric weight.</strong> {product.fabricWeight || "Not recorded yet."}</p>
          <p><strong>Fiber origin.</strong> {product.fabricOrigin || "Not recorded yet."}</p>
          <p><strong>Made in.</strong> {product.manufacturingCountry || "Not recorded yet."}{product.manufacturingFacility ? ` · ${product.manufacturingFacility}` : ""}</p>
          <p><strong>Fit.</strong> {product.fit || "Not recorded yet."}</p>
          <p><strong>Care.</strong> {product.care || "Not recorded yet."}</p>
          <p><strong>Sourcing note.</strong> {product.sustainability || "No verified sustainability attributes are published for this piece."}</p>
          <p><Link href="/shipping" className="underline">Shipping</Link> and <Link href="/returns" className="underline">returns</Link> are calculated and described on their own pages. This product does not invent a delivery date.</p>
        </div>
      </div>
      {related.cards.filter((card) => card.slug !== product.slug).length ? (
        <section className="lg:col-span-2">
          <h2 className="font-display text-3xl text-navy">Related</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.cards.filter((card) => card.slug !== product.slug).slice(0, 3).map((card) => (
              <li key={card.id}><Link href={`/products/${card.slug}`}>{card.name} · {formatMinor(card.priceMinor, card.currency)}</Link></li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p className="px-4 py-16">Loading the piece…</p>}>
      <ProductBody params={params} />
    </Suspense>
  );
}
