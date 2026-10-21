import { Suspense } from "react";
import { ContentView } from "@/components/content-view";
import { formatMinor } from "@/lib/commerce";
import { listPublicConservation } from "@/server/storefront";

export const metadata = { title: "Sea Turtle Conservation", description: "Sea Turtle Apparel's conservation philosophy and recorded contributions." };

async function Ledger() {
  const { programs, payments } = await listPublicConservation();
  const paid = payments.reduce((sum, row) => sum + Number(row.amount_minor), 0);
  return (
    <section className="mx-auto max-w-3xl px-4 pb-16">
      <h2 className="font-display text-3xl text-navy">Public ledger</h2>
      {programs.length === 0 ? <p className="mt-4 text-sm">No conservation program is approved for public display. Configuring a rate does not mean a donation has been paid.</p> : (
        <ul className="mt-4 grid gap-3 text-sm">
          {programs.map((program) => <li key={String(program.name)}><strong>{String(program.name)}</strong> · {String(program.model)} · {String(program.public_explanation)}</li>)}
        </ul>
      )}
      <p className="mt-6 text-sm">Approved public payments: {payments.length === 0 ? "none recorded." : formatMinor(paid, String(payments[0]?.currency ?? "USD"))}. Accruals are not shown as payments.</p>
    </section>
  );
}

export default function ConservationPage() {
  return (
    <>
      <ContentView slug="conservation" />
      <Suspense fallback={<p className="px-4">Loading the public ledger…</p>}><Ledger /></Suspense>
    </>
  );
}
