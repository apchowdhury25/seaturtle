import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { formatMinor, majorToMinor } from "@/lib/commerce";
import { firstParam } from "@/lib/utils";
import { getCatalog, type CatalogFilters } from "@/server/data";

function moneyFilter(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const minor = majorToMinor(value, "USD");
  return minor === null ? undefined : minor;
}

async function CatalogResults({ preset, searchParams }: { preset: CatalogFilters; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const page = Number(firstParam(params.page) ?? 1);
  const sort = (firstParam(params.sort) as CatalogFilters["sort"]) || preset.sort || "featured";
  const result = await getCatalog({
    ...preset,
    q: firstParam(params.q) || preset.q,
    size: firstParam(params.size) || preset.size,
    color: firstParam(params.color) || preset.color,
    material: firstParam(params.material) || preset.material,
    availability: (firstParam(params.availability) as CatalogFilters["availability"]) || preset.availability,
    min: moneyFilter(firstParam(params.min)),
    max: moneyFilter(firstParam(params.max)),
    sort,
    page: Number.isFinite(page) ? page : 1,
  });
  const pages = Math.max(1, Math.ceil(result.total / 12));
  return (
    <div>
      <form className="mt-8 grid gap-3 border border-line bg-white p-4 md:grid-cols-6" method="get">
        <label className="text-xs tracking-wide text-muted uppercase">Sort
          <select name="sort" defaultValue={sort} className="mt-1 h-10 w-full border border-line bg-ivory px-2 text-sm normal-case">
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="popular">Featured until sales history exists</option>
          </select>
        </label>
        <label className="text-xs tracking-wide text-muted uppercase">Size
          <input name="size" defaultValue={firstParam(params.size) ?? ""} className="mt-1 h-10 w-full border border-line px-2 text-sm" />
        </label>
        <label className="text-xs tracking-wide text-muted uppercase">Color
          <input name="color" defaultValue={firstParam(params.color) ?? ""} className="mt-1 h-10 w-full border border-line px-2 text-sm" />
        </label>
        <label className="text-xs tracking-wide text-muted uppercase">Material
          <input name="material" defaultValue={firstParam(params.material) ?? ""} className="mt-1 h-10 w-full border border-line px-2 text-sm" />
        </label>
        <label className="text-xs tracking-wide text-muted uppercase">Availability
          <select name="availability" defaultValue={firstParam(params.availability) ?? ""} className="mt-1 h-10 w-full border border-line bg-ivory px-2 text-sm normal-case">
            <option value="">Any</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </select>
        </label>
        <div className="flex items-end">
          <button className="h-10 w-full bg-navy text-sm text-ivory">Apply</button>
        </div>
        <label className="text-xs tracking-wide text-muted uppercase md:col-span-2">Minimum USD
          <input name="min" inputMode="decimal" defaultValue={firstParam(params.min) ?? ""} className="mt-1 h-10 w-full border border-line px-2 text-sm" />
        </label>
        <label className="text-xs tracking-wide text-muted uppercase md:col-span-2">Maximum USD
          <input name="max" inputMode="decimal" defaultValue={firstParam(params.max) ?? ""} className="mt-1 h-10 w-full border border-line px-2 text-sm" />
        </label>
        {preset.q ? <input type="hidden" name="q" value={preset.q} /> : null}
      </form>
      <p className="mt-4 text-sm text-muted">{result.configured ? `${result.total} published pieces` : "The catalog database is not connected."} Price filters use USD. Other currencies are not converted.</p>
      {result.cards.length === 0 ? (
        <div className="mt-8 border border-line bg-sand/40 p-8">
          <p className="font-display text-3xl text-navy">Nothing is published in this view.</p>
          <p className="mt-3 max-w-xl text-sm text-muted">Active products appear here from the database. Demonstration products stay hidden unless a non-production environment explicitly allows them. No sample garment is offered for sale in their place.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {result.cards.map((card) => (
            <li key={card.id}>
              <Link href={`/products/${card.slug}`} className="group block">
                <div className="relative aspect-[3/4] bg-sand">
                  {card.image ? (
                    <Image src={card.image} alt={card.alt} fill sizes="(min-width: 1024px) 30vw, 50vw" className="object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-sm text-muted">No image</span>
                  )}
                </div>
                <p className="mt-3 font-display text-xl text-navy group-hover:text-turquoise">{card.name}</p>
                <p className="text-sm text-muted">{formatMinor(card.priceMinor, card.currency)}{card.compareAtMinor ? ` · was ${formatMinor(card.compareAtMinor, card.currency)}` : ""}</p>
                {card.isDemonstration ? <p className="mt-1 text-xs tracking-wide text-turtle uppercase">Demonstration — not production inventory</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 ? (
        <nav className="mt-8 flex gap-4 text-sm" aria-label="Pagination">
          {page > 1 ? <Link href={`?page=${page - 1}&sort=${sort}`}>Previous</Link> : null}
          <span>Page {page} of {pages}</span>
          {page < pages ? <Link href={`?page=${page + 1}&sort=${sort}`}>Next</Link> : null}
        </nav>
      ) : null}
    </div>
  );
}

export function CatalogScreen({
  title,
  intro,
  preset,
  searchParams,
}: {
  title: string;
  intro?: string;
  preset: CatalogFilters;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs tracking-[0.18em] text-turquoise uppercase">Catalog</p>
      <h1 className="mt-2 font-display text-4xl text-navy md:text-5xl">{title}</h1>
      {intro ? <p className="mt-4 max-w-2xl text-muted">{intro}</p> : null}
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading the catalog…</p>}>
        <CatalogResults preset={preset} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
