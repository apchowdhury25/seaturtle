import Link from "next/link";
import { Suspense } from "react";
import { OrderSummary, type OrderRecord } from "@/components/order-summary";
import { listMyOrders } from "@/server/storefront";

export const metadata = { title: "Orders", robots: { index: false, follow: false } };

async function Orders() {
  const orders = await listMyOrders();
  if (orders.length === 0) {
    return <p>No orders are linked to this sign-in. Guest orders stay available with their tracking token. <Link href="/track" className="underline">Track an order</Link></p>;
  }
  return (
    <div className="grid gap-4">
      {orders.map((order) => <OrderSummary key={String(order.order_number)} order={order as OrderRecord} />)}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-navy">Orders</h1>
      <div className="mt-8"><Suspense fallback={<p>Loading orders…</p>}><Orders /></Suspense></div>
    </section>
  );
}
