import { Suspense } from "react";
import { OrderSummary, type OrderRecord } from "@/components/order-summary";
import { getRecentOrder } from "@/server/storefront";

export const metadata = { title: "Order confirmation", robots: { index: false, follow: false } };

async function Body({ sandbox }: { sandbox: boolean }) {
  const order = await getRecentOrder();
  if (!order) {
    return <p>This confirmation is available in the browser that placed the order, for a short time. Use order tracking with the token if you return later. An order number alone is not enough.</p>;
  }
  return <OrderSummary order={order as OrderRecord} sandbox={sandbox} />;
}

export default function ReturnPage({ searchParams }: { searchParams: Promise<{ sandbox?: string }> }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-navy">Order</h1>
      <p className="mt-3 text-sm text-muted">A return from the payment provider is not payment confirmation.</p>
      <div className="mt-6">
        <Suspense fallback={<p>Loading the order…</p>}>
          <Gate searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function Gate({ searchParams }: { searchParams: Promise<{ sandbox?: string }> }) {
  const params = await searchParams;
  return <Body sandbox={params.sandbox === "1"} />;
}
