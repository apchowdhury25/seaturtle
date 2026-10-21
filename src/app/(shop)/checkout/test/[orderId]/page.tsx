import { notFound } from "next/navigation";
import { Suspense } from "react";
import { simulateTestPayment } from "@/server/actions";
import { paymentMode } from "@/lib/env";
import { createAdminClient } from "@/server/supabase";
import { formatMinor } from "@/lib/commerce";

export const metadata = { title: "Sandbox payment", robots: { index: false, follow: false } };

async function TestCheckoutBody({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (paymentMode() !== "test" || !process.env.PAYMENT_TEST_WEBHOOK_SECRET) notFound();
  const admin = createAdminClient();
  if (!admin) notFound();
  const { data } = await admin.from("orders").select("order_number, total_minor, currency, status").eq("id", orderId).maybeSingle();
  if (!data) notFound();
  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl text-navy">Sandbox checkout</h1>
      <p className="mt-4 text-sm">Order {String(data.order_number)} · {formatMinor(Number(data.total_minor), String(data.currency))} · {String(data.status)}</p>
      <p className="mt-3 text-sm text-muted">This signs a test webhook and does not charge a card. It works only when PAYMENT_MODE is test and the test webhook secret is set.</p>
      <form action={simulateTestPayment.bind(null, orderId)} className="mt-6">
        <button className="h-11 bg-navy px-5 text-sm text-ivory">Submit signed test payment</button>
      </form>
    </section>
  );
}

export default function TestCheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  return <Suspense fallback={<p className="px-4 py-16">Loading sandbox checkout…</p>}><TestCheckoutBody params={params} /></Suspense>;
}
