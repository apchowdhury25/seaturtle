import Link from "next/link";
import { Suspense } from "react";
import { getSessionProfile } from "@/server/data";

const LINKS = [
  ["", "Overview"],
  ["products", "Products"],
  ["orders", "Orders"],
  ["discounts", "Discounts"],
  ["shipping", "Shipping"],
  ["tax", "Tax"],
  ["content", "Content"],
  ["support", "Support"],
  ["suppliers", "Suppliers"],
  ["trace", "Traceability"],
  ["conservation", "Conservation"],
  ["staff", "Staff"],
  ["audit", "Audit"],
] as const;

async function Nav() {
  const profile = await getSessionProfile();
  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl text-navy">Sea Turtle Apparel</Link>
        <p className="text-xs tracking-[0.14em] uppercase text-muted">{profile?.email ?? "Staff desk"}</p>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 pb-3 text-sm" aria-label="Administration">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href ? `/admin/${href}` : "/admin"}>{label}</Link>
        ))}
      </nav>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-ivory">
      <Suspense fallback={<p className="px-4 py-4 text-sm">Opening the desk…</p>}><Nav /></Suspense>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
