import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/brand-mark";
import { MobileNav } from "@/components/mobile-nav";
import { NewsletterForm } from "@/components/newsletter-form";
import { SiteSearch } from "@/components/site-search";
import { NAV } from "@/content/pages";
import { allowDemoCatalog } from "@/lib/env";
import { getAnnouncements } from "@/server/data";
import { readCartCount } from "@/server/cart";

async function AnnouncementBar() {
  const messages = await getAnnouncements();
  const line = messages.length ? messages.join("  ·  ") : "Thoughtfully Made. Responsibly Sourced.";
  return (
    <p className="w-full max-w-full bg-navy px-4 py-2 text-center text-[10px] leading-5 break-words whitespace-normal text-ivory uppercase sm:text-[11px] sm:tracking-[0.14em]">{messages.length ? line : "The Coastal Collection · Responsibly sourced"}</p>
  );
}

async function CartCount() {
  const count = await readCartCount();
  return (
    <Link href="/cart" className="inline-flex h-11 shrink-0 items-center gap-1 px-1.5 text-sm whitespace-nowrap" aria-label={`Shopping cart, ${count} items`}>
      <span aria-hidden>Bag</span>
      <span className="bg-turtle px-1 text-[10px] leading-4 text-ivory">{count}</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 w-full max-w-[100vw] border-b border-line bg-ivory/95 backdrop-blur">
      <Suspense fallback={<p className="bg-navy px-4 py-2 text-center text-[11px] text-ivory uppercase">Sea Turtle Apparel</p>}>
        <AnnouncementBar />
      </Suspense>
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 lg:h-20 lg:px-4">
        <Link href="/" aria-label="Sea Turtle Apparel" className="flex min-w-0 items-center gap-3 text-navy">
          <BrandMark className="shrink-0" />
          <span className="hidden truncate font-display text-lg leading-none sm:inline sm:text-xl">Sea Turtle Apparel</span>
        </Link>
        <div className="min-w-0">
          <nav className="hidden items-center justify-end gap-6 text-sm lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-turquoise">{item.label}</Link>
            ))}
          </nav>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <div className="hidden md:block">
            <SiteSearch id="site-search" />
          </div>
          <MobileNav />
          <Suspense fallback={<Link href="/cart" className="inline-flex h-11 shrink-0 items-center px-1.5 text-sm">Bag</Link>}>
            <CartCount />
          </Suspense>
          <Link href="/account" className="inline-flex h-11 shrink-0 items-center px-1.5 text-sm whitespace-nowrap">Account</Link>
          <Link href="/account/wishlist" className="hidden h-11 place-items-center px-2 text-sm sm:grid">Saved</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-navy text-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <BrandMark inverted className="h-12 lg:h-14" />
            <p className="font-display text-2xl">Sea Turtle Apparel</p>
          </div>
          <p className="mt-4 max-w-md text-sm text-sand">Wear the Change. Protect Our Oceans.</p>
          <p className="mt-2 max-w-md text-sm text-stone">A public email, phone number, and address will appear here when the owner publishes them.</p>
          {allowDemoCatalog() ? <p className="mt-4 text-xs tracking-wide text-sand uppercase">Development catalog is visible. It is hidden in production.</p> : null}
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] uppercase text-sand">Visit</p>
          <ul className="mt-3 grid gap-2 text-sm">
            <li><Link href="/shop">Shop</Link></li>
            <li><Link href="/new">New arrivals</Link></li>
            <li><Link href="/best-sellers">Best sellers</Link></li>
            <li><Link href="/pants">Pants</Link></li>
            <li><Link href="/shirts">Shirts</Link></li>
            <li><Link href="/jeans">Jeans</Link></li>
            <li><Link href="/outerwear">Outerwear</Link></li>
            <li><Link href="/bundles">Bundles</Link></li>
            <li><Link href="/coast">The coast</Link></li>
            <li><Link href="/about">Our story</Link></li>
            <li><Link href="/journal">Journal</Link></li>
            <li><Link href="/mission">Mission</Link></li>
            <li><Link href="/impact">Impact</Link></li>
            <li><Link href="/sustainability">Sustainability</Link></li>
            <li><Link href="/conservation">Sea turtles</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] uppercase text-sand">Service</p>
          <ul className="mt-3 grid gap-2 text-sm">
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/faq">Questions</Link></li>
            <li><Link href="/size-guide">Size guide</Link></li>
            <li><Link href="/fabric-care">Fabric and care</Link></li>
            <li><Link href="/track">Track an order</Link></li>
            <li><Link href="/shipping">Shipping</Link></li>
            <li><Link href="/shipping-policy">Shipping policy</Link></li>
            <li><Link href="/returns">Returns</Link></li>
            <li><Link href="/returns-policy">Returns policy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/accessibility">Accessibility</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <NewsletterForm />
          <p className="mt-6 text-xs text-stone">Payment marks appear only after a provider is enabled. None are shown as active until credentials are configured.</p>
        </div>
      </div>
    </footer>
  );
}
