import Link from "next/link";
import { Suspense } from "react";
import { listArticles } from "@/server/storefront";

export const metadata = { title: "Journal", description: "Editorial notes on materials, making, and oceans. Published only after review." };

async function Articles() {
  const articles = await listArticles();
  if (articles.length === 0) {
    return <p className="mt-6 max-w-xl text-sm text-muted">No article is published. Drafts stay in the admin desk until a person reviews them. Environmental claims are not auto-published.</p>;
  }
  return (
    <ul className="mt-8 grid gap-6">
      {articles.map((article) => (
        <li key={String(article.slug)}>
          <Link href={`/journal/${article.slug}`} className="font-display text-2xl text-navy">{String(article.title)}</Link>
          <p className="text-sm text-muted">{String(article.excerpt)}</p>
        </li>
      ))}
    </ul>
  );
}

export default function JournalPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs tracking-[0.18em] text-turquoise uppercase">Journal</p>
      <h1 className="mt-2 font-display text-4xl text-navy">Notes</h1>
      <Suspense fallback={<p className="mt-6">Loading articles…</p>}><Articles /></Suspense>
    </section>
  );
}
