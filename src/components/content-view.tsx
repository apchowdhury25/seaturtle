import { Suspense } from "react";
import { PAGES } from "@/content/pages";
import { getPublishedPage } from "@/server/data";

async function Body({ slug }: { slug: string }) {
  const published = await getPublishedPage(slug);
  const fallback = PAGES[slug];
  const title = published?.title || fallback?.title || "Page";
  const paragraphs = published?.body ? published.body.split(/\n\n+/) : fallback?.paragraphs ?? ["This page has not been published."];
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs tracking-[0.14em] text-turquoise uppercase sm:tracking-[0.18em]">{fallback?.kicker ?? "Sea Turtle Apparel"}</p>
      <h1 className="mt-2 font-display text-3xl text-balance text-navy sm:text-4xl md:text-5xl">{title}</h1>
      {published ? <p className="mt-3 text-xs tracking-wide text-turtle uppercase">Published from the content desk</p> : null}
      <div className="mt-8 grid gap-5 text-base leading-7 text-charcoal">
        {paragraphs.map((paragraph) => <p key={paragraph.slice(0, 48)}>{paragraph}</p>)}
      </div>
    </article>
  );
}

export function ContentView({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<p className="px-4 py-14 text-sm">Loading…</p>}>
      <Body slug={slug} />
    </Suspense>
  );
}
