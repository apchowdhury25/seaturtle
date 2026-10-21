"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SiteSearch } from "@/components/site-search";
import { NAV } from "@/content/pages";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="grid h-11 w-11 shrink-0 place-items-center border border-line"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X aria-hidden /> : <Menu aria-hidden />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>
      {open ? (
        <nav id="mobile-navigation" className="absolute inset-x-0 top-full z-40 border-b border-line bg-ivory px-5 py-6" aria-label="Mobile">
          <div className="mb-5">
            <SiteSearch id="mobile-search" />
          </div>
          <ul className="grid gap-4">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="font-display text-2xl text-navy" onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li><Link href="/journal" onClick={() => setOpen(false)}>Journal</Link></li>
            <li><Link href="/contact" onClick={() => setOpen(false)}>Contact</Link></li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
