import Image from "next/image";
import Link from "next/link";
import { ProductGallery } from "@/components/product-gallery";
import { formatMinor } from "@/lib/commerce";
import { getLookbookProduct } from "@/content/lookbook";
import type { CatalogCard } from "@/server/data";

type LookbookViewProduct = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  priceMinor: number;
  compareAtMinor: number | null;
  currency: string;
  material: string | null;
  fabricWeight: string | null;
  fabricOrigin: string | null;
  fit: string | null;
  care: string | null;
  sustainability: string | null;
  images: Array<{ src: string | null; alt: string }>;
  colors: Array<{ name: string; hex: string }>;
  sizes: string[];
  line: string;
  picturedColor: string;
  includes: string[];
  categorySlug: string | null;
};

export function LookbookProduct({ product, related }: { product: LookbookViewProduct; related: CatalogCard[] }) {
  const included = product.includes.map((slug) => getLookbookProduct(slug)).filter((item) => item !== null);
  return (
    <article className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
      <ProductGallery images={product.images.length ? product.images : [{ src: null, alt: product.name }]} name={product.name} />
      <div>
        <p className="text-xs tracking-[0.16em] text-turquoise uppercase">{product.line}</p>
        <h1 className="mt-2 font-display text-4xl text-navy md:text-5xl">{product.name}</h1>
        <p className="mt-4 text-muted">{product.shortDescription}</p>
        <p className="mt-6 font-display text-3xl text-navy">{formatMinor(product.priceMinor, product.currency)}</p>
        {product.compareAtMinor ? (
          <p className="mt-1 text-sm text-muted">Separate planned prices add to {formatMinor(product.compareAtMinor, product.currency)}.</p>
        ) : null}
        <p className="mt-4 border border-line bg-sand/40 p-4 text-sm leading-6">
          House lookbook. This is a planned style and a planned retail price. It is not reserved stock, so it cannot be added to a bag until the catalog database is connected.
        </p>
        <p className="mt-6 text-sm leading-6"><strong>Planned colors.</strong> {product.colors.map((color) => color.name).join(", ")}. The photograph shows {product.picturedColor}.</p>
        <p className="mt-2 text-sm leading-6"><strong>Planned sizes.</strong> {product.sizes.join(", ")}. None of these sizes are in inventory.</p>
        <p className="mt-2 text-sm"><Link href="/size-guide" className="underline">Size guide</Link></p>
        {included.length ? (
          <div className="mt-6">
            <p className="text-sm font-medium">In this kit</p>
            <ul className="mt-2 grid gap-1 text-sm">
              {included.map((item) => (
                <li key={item.slug}><Link href={`/products/${item.slug}`} className="underline">{item.name}</Link></li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-10 grid gap-4 text-sm leading-6">
          <p>{product.description}</p>
          <p><strong>Material.</strong> {product.material || "Not recorded yet."}</p>
          <p><strong>Fabric weight.</strong> {product.fabricWeight || "Not recorded yet."}</p>
          <p><strong>Fiber origin.</strong> {product.fabricOrigin || "Not recorded yet."}</p>
          <p><strong>Made in.</strong> Not recorded yet.</p>
          <p><strong>Fit.</strong> {product.fit || "Not recorded yet."}</p>
          <p><strong>Care.</strong> {product.care || "Not recorded yet."}</p>
          <p><strong>Sourcing note.</strong> {product.sustainability || "No verified sustainability attributes are published for this piece."}</p>
          {(product.categorySlug ?? "").includes("underwear") || product.slug.includes("underwear") || product.slug.includes("brief") || product.slug.includes("boxer") ? (
            <p>Underwear returns follow the hygiene rule in the returns policy, and any stronger right in the customer’s local law.</p>
          ) : null}
        </div>
      </div>
      {related.length ? (
        <section className="lg:col-span-2">
          <h2 className="font-display text-3xl text-navy">In this line</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-3">
            {related.slice(0, 3).map((card) => (
              <li key={card.id}>
                <Link href={`/products/${card.slug}`} className="group block">
                  <div className="relative aspect-[2/3] bg-sand">
                    {card.image ? <Image src={card.image} alt={card.alt} fill className="object-cover" sizes="30vw" /> : null}
                  </div>
                  <p className="mt-3 font-display text-xl text-navy group-hover:text-turquoise">{card.name}</p>
                  <p className="text-sm text-muted">{formatMinor(card.priceMinor, card.currency)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
