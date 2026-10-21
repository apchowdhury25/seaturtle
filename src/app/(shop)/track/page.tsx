import { Suspense } from "react";
import { OrderSummary, type OrderRecord } from "@/components/order-summary";
import { firstParam } from "@/lib/utils";
import { getOrderByToken } from "@/server/storefront";

export const metadata = { title: "Track an order", robots: { index: false, follow: false } };

async function Result({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = firstParam(params.token) ?? "";
  const orderNumber = firstParam(params.order) ?? "";
  if (!token) return <p className="text-sm text-muted">Enter the tracking token from your confirmation. The order number alone will not open an order.</p>;
  const order = await getOrderByToken(token, orderNumber || undefined);
  if (!order) return <p role="status">No order matched that token.</p>;
  return <OrderSummary order={order as OrderRecord} />;
}

export default function TrackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-navy">Track an order</h1>
      <form className="mt-6 grid gap-3" method="get">
        <label className="text-sm">Tracking token
          <input name="token" required className="mt-1 h-11 w-full border border-line px-3" autoComplete="off" />
        </label>
        <label className="text-sm">Order number, optional
          <input name="order" className="mt-1 h-11 w-full border border-line px-3" />
        </label>
        <button className="h-11 bg-navy text-sm text-ivory">Look up</button>
      </form>
      <div className="mt-8">
        <Suspense fallback={<p>Looking up…</p>}>
          <Result searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}
