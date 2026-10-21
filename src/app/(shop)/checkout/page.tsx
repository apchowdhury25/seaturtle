import { Suspense } from "react";
import { CheckoutForm } from "@/components/cart-forms";
import { randomToken } from "@/lib/security";
import { configuredProviders } from "@/lib/payments";
import { loadShippingAndTax } from "@/server/cart";
import { getSessionProfile } from "@/server/data";

export const metadata = { title: "Checkout", robots: { index: false, follow: false } };

async function CheckoutBody({ status }: { status?: string }) {
  const [{ methods }, profile] = await Promise.all([loadShippingAndTax(), getSessionProfile()]);
  const note = status === "cancelled" ? "The payment page was cancelled. The order stays unpaid until a signed notification arrives." : status === "failed" ? "The provider reported a failed return. Payment status still depends on the signed notification." : "";
  return (
    <>
      {note ? <p className="mb-6 text-sm" role="status">{note}</p> : null}
      <CheckoutForm
        emailDefault={profile?.email ?? ""}
        idempotency={randomToken(16)}
        providers={configuredProviders()}
        methods={methods.map((method) => ({ id: method.id, name: method.name, currency: method.currency }))}
      />
    </>
  );
}

export default function CheckoutPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-navy">Checkout</h1>
      <p className="mt-3 text-sm text-muted">Guest checkout is available. Totals are recalculated on the server when the order is created.</p>
      <div className="mt-8">
        <Suspense fallback={<p>Loading checkout…</p>}>
          <CheckoutGate searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function CheckoutGate({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  return <CheckoutBody status={params.status} />;
}
