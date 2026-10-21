import { Suspense } from "react";
import { unsubscribeNewsletter } from "@/server/actions";

async function Stop({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await unsubscribeNewsletter(token);
  return <p role="status">{result.message}</p>;
}

export const metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl text-navy">Unsubscribe</h1>
      <div className="mt-6"><Suspense fallback={<p>Checking the link…</p>}><Stop params={params} /></Suspense></div>
    </section>
  );
}
