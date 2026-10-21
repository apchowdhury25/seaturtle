import { Suspense } from "react";
import { AddressForm } from "@/components/account-forms";
import { listMyAddresses } from "@/server/storefront";

export const metadata = { title: "Addresses", robots: { index: false, follow: false } };

async function Addresses() {
  const rows = await listMyAddresses();
  return (
    <div className="grid gap-8">
      <ul className="grid gap-3 text-sm">
        {rows.length === 0 ? <li>No saved addresses.</li> : rows.map((row) => (
          <li key={String(row.id)} className="border border-line p-3">{String(row.full_name)}, {String(row.line1)}, {String(row.city)} {String(row.postal_code)} {String(row.country_code)}</li>
        ))}
      </ul>
      <AddressForm />
    </div>
  );
}

export default function AddressesPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-navy">Addresses</h1>
      <div className="mt-8"><Suspense fallback={<p>Loading addresses…</p>}><Addresses /></Suspense></div>
    </section>
  );
}
