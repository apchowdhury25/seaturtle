"use client";

import Link from "next/link";
import { useState } from "react";

type Suggestion = { name: string; slug: string };

export function SiteSearch({ id }: { id: string }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);

  function onChange(value: string) {
    setQuery(value);
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setItems([]);
      return;
    }
    const requested = trimmed;
    void fetch(`/api/search?q=${encodeURIComponent(requested)}`)
      .then(async (response) => {
        if (!response.ok) return { suggestions: [] as Suggestion[] };
        return response.json() as Promise<{ suggestions?: Suggestion[] }>;
      })
      .then((body) => {
        setItems(body.suggestions ?? []);
      })
      .catch(() => setItems([]));
  }

  return (
    <form action="/search" role="search" className="relative">
      <label htmlFor={id} className="sr-only">Search the catalog</label>
      <input
        id={id}
        name="q"
        value={query}
        placeholder="Search"
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full border border-line bg-white px-3 text-sm md:w-36"
      />
      {items.length > 0 ? (
        <ul className="absolute top-11 z-40 w-64 border border-line bg-white p-2 text-sm shadow-sm" role="listbox" aria-label="Search suggestions">
          {items.map((item) => (
            <li key={item.slug}>
              <Link href={`/products/${item.slug}`} className="block px-2 py-2 hover:bg-sand">{item.name}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
