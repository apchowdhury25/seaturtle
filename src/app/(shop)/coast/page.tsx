import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Worn on the Coast",
  description: "Why the Coastal Collection is tied to sea turtle country, and what Sea Turtle Apparel does not claim yet.",
};

export default function CoastPage() {
  return (
    <>
      <section className="relative min-h-[68svh] bg-navy text-ivory md:min-h-[70vh]">
        <Image src="/images/lookbook/coast.jpg" alt="An empty coastal boardwalk at late afternoon. Not a documented nesting beach." fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-navy/30" />
        <div className="relative mx-auto flex min-h-[68svh] max-w-6xl flex-col justify-end px-4 py-8 md:min-h-[70vh] md:py-16">
          <p className="text-xs tracking-[0.14em] uppercase sm:tracking-[0.18em]">The coast</p>
          <h1 className="mt-3 max-w-xl font-display text-4xl leading-[0.95] sm:text-5xl md:text-7xl">Worn where the water starts</h1>
        </div>
      </section>
      <article className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1.2fr_0.8fr]">
        <div className="max-w-xl">
          <p className="text-sm leading-7">The Coastal Collection is clothing for boardwalks, dunes, and warm evenings. Cotton crews, linen, denim, and a jacket when the air cools. The photographs are a campaign. They are not a factory, a staff portrait, or a record of a nesting beach.</p>
          <p className="mt-4 text-sm leading-7">Sea turtles need dark beaches, cleaner water, and coasts that are not treated as a drain. That is why the house exists. Making clothes with a sourcing record is one job. Paying a conservation partner is another. Neither is claimed as finished work. A purchase on this site is a purchase. It is not a donation.</p>
          <p className="mt-4 text-sm leading-7">Prices in the lookbook are the planned retail prices. Fiber origin, mills, and the Dhaka workshop stay unpublished until a record is approved. The words on a product page say when a fact is still a plan.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="inline-flex h-11 items-center bg-navy px-5 text-sm text-ivory">Shop the collection</Link>
            <Link href="/conservation" className="inline-flex h-11 items-center border border-navy px-5 text-sm">Sea turtle commitment</Link>
          </div>
        </div>
        <div className="relative min-h-80">
          <Image src="/images/lookbook/sea-turtle.jpg" alt="A green sea turtle in shallow water. Campaign photograph, not a funded project." fill className="object-cover" sizes="40vw" />
        </div>
      </article>
      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 pb-16 sm:grid-cols-3">
        <Link href="/men" className="relative block aspect-[2/3] bg-sand">
          <Image src="/images/lookbook/reef-pima-crew.jpg" alt="Man in an ivory crew on a dune." fill className="object-cover" sizes="(min-width: 640px) 30vw, 45vw" />
          <span className="absolute bottom-4 left-4 bg-ivory px-3 py-2 text-sm text-navy">Shop men</span>
        </Link>
        <Link href="/women" className="relative block aspect-[2/3] bg-sand">
          <Image src="/images/lookbook/dune-shirt-dress.jpg" alt="Woman in an ivory shirt dress on a boardwalk." fill className="object-cover" sizes="(min-width: 640px) 30vw, 45vw" />
          <span className="absolute bottom-4 left-4 bg-ivory px-3 py-2 text-sm text-navy">Shop women</span>
        </Link>
        <Link href="/bundles" className="relative block aspect-[2/3] bg-sand">
          <Image src="/images/lookbook/reef-weekday-kit.jpg" alt="Folded tee, chino, and socks." fill className="object-cover" sizes="(min-width: 640px) 30vw, 45vw" />
          <span className="absolute bottom-4 left-4 bg-ivory px-3 py-2 text-sm text-navy">Shop bundles</span>
        </Link>
      </section>
    </>
  );
}
