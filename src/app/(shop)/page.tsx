import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { COLLECTIONS, BRAND } from "@/content/pages";
import { formatMinor } from "@/lib/commerce";
import { getCatalog } from "@/server/data";

async function FeaturedProducts() {
  const result = await getCatalog({ featured: true, sort: "featured", page: 1 });
  if (!result.configured) {
    return <p className="text-sm text-muted">Connect Supabase to publish products. Nothing is invented in their place.</p>;
  }
  if (result.cards.length === 0) {
    return (
      <div className="border border-line bg-white p-8">
        <p className="font-display text-3xl text-navy">The collection is being prepared.</p>
        <p className="mt-3 max-w-xl text-sm text-muted">Featured products appear when an administrator publishes them. Demonstration records stay off the production store.</p>
      </div>
    );
  }
  return (
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {result.cards.slice(0, 4).map((card) => (
        <li key={card.id}>
          <Link href={`/products/${card.slug}`}>
            <div className="relative aspect-[3/4] bg-sand">
              {card.image ? <Image src={card.image} alt={card.alt} fill className="object-cover" sizes="25vw" /> : null}
            </div>
            <p className="mt-3 font-display text-xl text-navy">{card.name}</p>
            <p className="text-sm text-muted">{formatMinor(card.priceMinor, card.currency)}</p>
          </Link>
        </li>
      ))}
    </ul>
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
      <section className="relative min-h-[70vh] bg-navy text-ivory">
        <Image src="/images/editorial/hero.jpg" alt="Two people in tailored clothing on a coastal dune. Provisional campaign photograph, not a factory or conservation partner." fill priority className="object-cover opacity-80" sizes="100vw" />
        <div className="relative mx-auto flex min-h-[70vh] w-full min-w-0 max-w-6xl flex-col justify-end px-4 py-16">
          <p className="min-w-0 max-w-full text-xs tracking-[0.14em] uppercase sm:tracking-[0.2em]">{BRAND.tagline}</p>
          <h1 className="mt-3 min-w-0 max-w-xl font-display text-5xl leading-none md:text-7xl">{BRAND.heroTitle}</h1>
          <p className="mt-4 min-w-0 max-w-lg text-sand">{BRAND.heroText}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="inline-flex h-12 items-center bg-ivory px-6 text-sm text-navy">Shop the Collection</Link>
            <Link href="/sustainability" className="inline-flex h-12 items-center border border-ivory px-6 text-sm">Our Commitment</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-4xl text-navy">Collections</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group block focus-visible:outline">
                <div className="relative aspect-[4/5] bg-sand">
                  <Image src={item.image} alt={item.alt} fill className="object-cover transition-opacity group-hover:opacity-90" sizes="(min-width: 1024px) 30vw, 50vw" />
                </div>
                <p className="mt-3 font-display text-2xl text-navy">{item.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-display text-4xl text-navy">Featured</h2>
        <div className="mt-8">
          <Suspense fallback={<p>Loading featured pieces…</p>}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>
      <section className="bg-sand/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl text-navy">Our commitment</h2>
            <ul className="mt-6 grid gap-3 text-sm leading-6">
              <li>Suppliers are reviewed before they are called vetted.</li>
              <li>Materials are traced when records exist, and marked unavailable when they do not.</li>
              <li>Manufacturing claims stay tied to a facility record.</li>
              <li>Textile waste, water, and chemical management are tracked as evidence, not slogans.</li>
              <li>Marine protection is part of the brief, separate from any future contribution payment.</li>
            </ul>
            <Link href="/sourcing" className="mt-6 inline-block text-sm underline">Responsible sourcing</Link>
          </div>
          <div className="relative min-h-80">
            <Image src="/images/editorial/atelier.jpg" alt="Hands sewing cloth in a workroom. Provisional photograph, not a picture of the planned Dhaka factory or its staff." fill className="object-cover" sizes="50vw" />
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
        <div className="relative min-h-80">
          <Image src="/images/editorial/coastline.jpg" alt="A quiet coastline. This is not a documented nesting beach used by a partner program." fill className="object-cover" sizes="50vw" />
        </div>
        <div>
          <h2 className="font-display text-4xl text-navy">Traceability</h2>
          <p className="mt-4 text-sm leading-6 text-muted">A published garment record can show material, processing, dyeing, making, inspection, packaging, and shipment. Missing stages stay missing. Verified, supplier-reported, measured, estimated, and planned information are labeled differently.</p>
          <Link href="/manufacturing" className="mt-6 inline-block text-sm underline">How a garment is recorded</Link>
        </div>
      </section>
      <section className="bg-navy text-ivory">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl">Sea turtles</h2>
            <p className="mt-4 text-sand">We care about sea turtles because their survival is tied to coasts and oceans that manufacturing must not treat as a drain. Contributions are configured, accrued, and paid as separate facts. None are claimed until they are recorded.</p>
            <Link href="/conservation" className="mt-6 inline-flex h-11 items-center border border-ivory px-5 text-sm">Our Commitment to Sea Turtles</Link>
          </div>
          <div className="relative min-h-72">
            <Image src="/images/editorial/sea-turtle.jpg" alt="A sea turtle swimming. Licensed-style campaign image, not documentation of a funded project." fill className="object-cover" sizes="50vw" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="font-display text-4xl text-navy">The people behind the brand</h2>
        <p className="mt-4 leading-7">The managing director started this house out of care for marine life, healthy oceans, clean air, and soil. A name, portrait, and biography will be published only when the owner supplies them. This section will not invent a person.</p>
        <Link href="/about" className="mt-6 inline-block text-sm underline">Read the mission</Link>
      </section>
    </>
  );
}
