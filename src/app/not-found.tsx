import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-frame";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main id="content" className="mx-auto max-w-xl flex-1 px-4 py-20">
        <p className="text-xs tracking-[0.18em] text-turquoise uppercase">404</p>
        <h1 className="mt-2 font-display text-5xl text-navy">This page is not on the map.</h1>
        <p className="mt-4 text-sm text-muted">The link may be old, or the product is not published.</p>
        <Link href="/shop" className="mt-6 inline-block underline">Return to the shop</Link>
      </main>
      <SiteFooter />
    </div>
  );
}
