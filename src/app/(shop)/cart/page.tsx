import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CartQuantityForm } from "@/components/cart-forms";
import { formatMinor } from "@/lib/commerce";
import { quoteCurrentCart } from "@/server/cart";

export const metadata = { title: "Cart", robots: { index: false, follow: false } };

async function CartBody() {
  const quoted = await quoteCurrentCart({});
  if (!quoted.configured) return <p>The cart is unavailable until the server database key is configured.</p>;
  if (quoted.display.length === 0) {
    return (
      <div>
        <p className="font-display text-3xl text-navy">Your cart is empty.</p>
        <Link href="/shop" className="mt-4 inline-block underline">Shop the collection</Link>
      </div>
    );
  }
  const currency = quoted.quote.currency ?? "USD";
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
      <ul className="grid gap-6">
        {quoted.display.map((line) => (
          <li key={line.variantId} className="grid grid-cols-[96px_1fr] gap-4 border-b border-line pb-6">
            <div className="relative h-28 bg-sand">{line.image ? <Image src={line.image} alt="" fill className="object-cover" sizes="96px" /> : null}</div>
            <div>
              <Link href={`/products/${line.slug}`} className="font-display text-xl text-navy">{line.name}</Link>
              <p className="text-sm text-muted">{line.color} / {line.size}</p>
              <p className="text-sm">{formatMinor(line.unitPriceMinor, line.currency)} · {line.available} available</p>
              <CartQuantityForm variantId={line.variantId} quantity={line.quantity} />
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit border border-line bg-white p-5">
        <h2 className="font-display text-2xl text-navy">Summary</h2>
        <p className="mt-3 text-sm">Subtotal {formatMinor(quoted.quote.subtotalMinor, currency)}</p>
        <p className="text-sm text-muted">Shipping, tax, and discounts are calculated at checkout. This subtotal is a server preview of current variant prices.</p>
        {quoted.quote.errors.map((error) => <p key={error} className="mt-2 text-sm text-turtle">{error}</p>)}
        <Link href="/checkout" className="mt-5 inline-flex h-11 items-center bg-navy px-5 text-sm text-ivory">Checkout</Link>
      </aside>
    </div>
  );
}

export default function CartPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl text-navy">Cart</h1>
      <Suspense fallback={<p className="mt-6">Loading your cart…</p>}>
        <div className="mt-8"><CartBody /></div>
      </Suspense>
    </section>
  );
}
