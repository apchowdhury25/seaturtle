import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getArticle } from "@/server/storefront";

async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  const json = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.published_at,
    author: article.author_name || "Sea Turtle Apparel",
    description: article.seo_description || article.excerpt,
  };
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
      <p className="text-xs tracking-[0.16em] text-turquoise uppercase">{String(article.category || "Journal")}</p>
      <h1 className="mt-2 font-display text-4xl text-navy">{String(article.title)}</h1>
      <p className="mt-3 text-sm text-muted">{article.author_name ? String(article.author_name) : "Author not recorded"}{article.published_at ? ` · ${String(article.published_at).slice(0, 10)}` : ""}</p>
      <div className="mt-8 grid gap-4 leading-7">{String(article.body).split(/\n\n+/).map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}</div>
    </article>
  );
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={<p className="px-4 py-14">Loading the article…</p>}><Article params={params} /></Suspense>;
}
