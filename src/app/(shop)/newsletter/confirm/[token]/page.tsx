import { Suspense } from "react";
import { confirmNewsletter } from "@/server/actions";

async function Confirm({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await confirmNewsletter(token);
  return <p role="status">{result.message}</p>;
}

export const metadata = { title: "Confirm subscription", robots: { index: false, follow: false } };

export default function ConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl text-navy">Subscription</h1>
      <div className="mt-6"><Suspense fallback={<p>Checking the link…</p>}><Confirm params={params} /></Suspense></div>
    </section>
  );
}
