import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BRAND, COLLECTIONS, LINE_LINKS } from "@/content/pages";
import { formatMinor } from "@/lib/commerce";
import { getCatalog } from "@/server/data";

async function FeaturedProducts() {
  const result = await getCatalog({ featured: true, sort: "featured", page: 1 });
  if (result.cards.length === 0) {
    return (
      <div className="border border-line bg-white p-8">
        <p className="font-display text-3xl text-navy">The collection is being prepared.</p>
        <p className="mt-3 max-w-xl text-sm text-muted">Featured products appear when an administrator publishes them. Demonstration records stay off the production store.</p>
      </div>
    );
  }
  return (
    <>
      {result.source === "lookbook" ? (
        <p className="mb-6 max-w-2xl text-sm text-muted">Planned styles and planned prices. These pieces are not reserved stock.</p>
      ) : null}
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {result.cards.slice(0, 4).map((card) => (
          <li key={card.id}>
            <Link href={`/products/${card.slug}`} className="group block">
              <div className="relative aspect-[2/3] bg-sand">
                {card.image ? <Image src={card.image} alt={card.alt} fill className="object-cover" sizes="(min-width: 1024px) 22vw, 50vw" /> : null}
              </div>
              <p className="mt-3 font-display text-xl text-navy group-hover:text-turquoise">{card.name}</p>
              <p className="text-sm text-muted">{formatMinor(card.priceMinor, card.currency)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function HomePage() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sea Turtle Apparel",
    url: "https://seaturtleapparel.com",
    slogan: BRAND.tagline,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <section className="relative min-h-[68svh] bg-navy text-ivory md:min-h-[78vh]">
        <Image src="/images/lookbook/hero.jpg" alt="Two people walking a coastal boardwalk in an ivory tee, indigo jeans, and an ivory shirt dress. Campaign photograph, not a factory or a conservation partner." fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/15 to-navy/10" />
        <div className="relative mx-auto flex min-h-[68svh] w-full min-w-0 max-w-6xl flex-col justify-end px-4 py-8 md:min-h-[78vh] md:py-16">
          <p className="text-xs tracking-[0.14em] uppercase sm:tracking-[0.18em]">New this season</p>
          <h1 className="mt-3 max-w-xl font-display text-4xl leading-[0.95] sm:text-5xl md:text-7xl">{BRAND.heroTitle}</h1>
          <p className="mt-4 max-w-lg text-sand">{BRAND.heroText}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/men" className="inline-flex h-12 items-center bg-ivory px-5 text-sm text-navy">Shop Men</Link>
            <Link href="/women" className="inline-flex h-12 items-center border border-ivory px-5 text-sm">Shop Women</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full min-w-0 max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <h2 className="font-display text-3xl text-navy sm:text-4xl">Shop by category</h2>
          <Link href="/shop" className="inline-flex min-h-11 items-center text-sm underline">Shop all</Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {COLLECTIONS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group block">
                <div className="relative aspect-[2/3] bg-sand">
                  <Image src={item.image} alt={item.alt} fill className="object-cover transition-opacity group-hover:opacity-90" sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw" />
                </div>
                <p className="mt-3 font-display text-xl text-navy sm:text-2xl">{item.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <h2 className="font-display text-3xl text-navy sm:text-4xl">Featured</h2>
          <Link href="/best-sellers" className="inline-flex min-h-11 items-center text-sm underline">Best sellers</Link>
        </div>
        <div className="mt-8">
          <Suspense fallback={<p>Loading featured pieces…</p>}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>

      <section className="bg-sand/40">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
          <Link href="/pants" className="relative block min-h-96">
            <Image src="/images/lookbook/drift-chino.jpg" alt="Man in a sand chino on a dune. Campaign photograph." fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
          </Link>
          <div>
            <p className="text-xs tracking-[0.16em] text-turquoise uppercase">Drift</p>
            <h2 className="mt-2 font-display text-4xl text-navy">Pants for the whole week</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted">A sand chino and a straight jean, cut to move from the boardwalk to a desk. The cloth is a planned specification until a mill record exists.</p>
            <Link href="/pants" className="mt-6 inline-flex h-11 items-center bg-navy px-5 text-sm text-ivory">Shop pants</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
        <div className="md:order-2">
          <Link href="/dresses" className="relative block min-h-96">
            <Image src="/images/lookbook/dune-shirt-dress.jpg" alt="Woman in an ivory linen shirt dress on a boardwalk. Campaign photograph." fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
          </Link>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] text-turquoise uppercase">Dune</p>
          <h2 className="mt-2 font-display text-4xl text-navy">Linen, late light</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted">The shirt dress is the center of the women’s line: a collar, a covered placket, and a hem that moves. Lounge pants sit beside it for slower hours.</p>
          <Link href="/dresses" className="mt-6 inline-flex h-11 items-center border border-navy px-5 text-sm">Shop dresses</Link>
        </div>
      </section>

      <section className="relative min-h-[68svh] bg-navy text-ivory md:min-h-[70vh]">
        <Image src="/images/lookbook/story-lounge.jpg" alt="A man in sand lounge pants sits on a coastal boardwalk. Campaign photograph, not a nesting beach." fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-navy/35" />
        <div className="relative mx-auto flex min-h-[68svh] max-w-6xl flex-col justify-end px-4 py-8 md:min-h-[70vh] md:py-16">
          <p className="text-xs tracking-[0.14em] uppercase sm:tracking-[0.18em]">Worn on the coast</p>
          <h2 className="mt-3 max-w-lg font-display text-4xl leading-[0.95] sm:text-5xl">Clothes for the edge of the water</h2>
          <p className="mt-4 max-w-md text-sand">Sea turtles, nesting beaches, and cleaner making are why this house exists. A purchase is not a donation. The story is separate from any future contribution.</p>
          <Link href="/coast" className="mt-8 inline-flex h-12 w-fit items-center bg-ivory px-6 text-sm text-navy">Read the coast story</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-4xl text-navy">The lines</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {LINE_LINKS.map((line) => (
            <li key={line.href}>
              <Link href={line.href} className="block border border-line bg-white p-5 hover:border-navy">
                <p className="font-display text-2xl text-navy">{line.title}</p>
                <p className="mt-2 text-sm text-muted">{line.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line">
        <ul className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <li>
            <Link href="/size-guide" className="font-display text-2xl text-navy">Size guide</Link>
            <p className="mt-2 text-sm text-muted">Garment measurements appear on a product when they have been recorded.</p>
          </li>
          <li>
            <Link href="/fabric-care" className="font-display text-2xl text-navy">Fabric and care</Link>
            <p className="mt-2 text-sm text-muted">Composition stays blank until it is entered. Care labels will control.</p>
          </li>
          <li>
            <Link href="/returns" className="font-display text-2xl text-navy">Returns</Link>
            <p className="mt-2 text-sm text-muted">Windows follow the published policy. Underwear has a hygiene rule where the law allows.</p>
          </li>
          <li>
            <Link href="/conservation" className="font-display text-2xl text-navy">Sea turtles</Link>
            <p className="mt-2 text-sm text-muted">A purchase is not a donation. Contributions are recorded only after they are paid.</p>
          </li>
        </ul>
      </section>

      <section className="bg-navy text-ivory">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl">Sea turtles</h2>
            <p className="mt-4 text-sand">Their survival is tied to coasts and oceans that manufacturing must not treat as a drain. Cleaner production is a duty of its own. No payment to a partner is claimed until a record exists.</p>
            <Link href="/conservation" className="mt-6 inline-flex h-11 items-center border border-ivory px-5 text-sm">Our commitment</Link>
          </div>
          <div className="relative min-h-72">
            <Image src="/images/lookbook/sea-turtle.jpg" alt="A green sea turtle swimming in shallow water. Campaign photograph, not documentation of a funded project." fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
          </div>
        </div>
      </section>
    </>
  );
}
