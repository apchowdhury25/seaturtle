import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatMinor } from "@/lib/commerce";
import { requireStaff } from "@/server/actions";
import { createSessionClient } from "@/server/supabase";

async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff("orders.read");
  const supabase = await createSessionClient();
  if (!staff || !supabase) return <p>Sign in with an order-reading role to open an invoice.</p>;
  const { id } = await params;
  const { data } = await supabase.from("orders").select("order_number, email, status, currency, subtotal_minor, discount_minor, shipping_minor, tax_minor, total_minor, created_at, order_items(product_name, sku, quantity, line_total_minor)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const currency = String(data.currency);
  return (
    <article className="mx-auto max-w-2xl bg-white p-8">
      <h1 className="font-display text-3xl text-navy">Invoice {String(data.order_number)}</h1>
      <p className="text-sm">{String(data.email)} · {String(data.status)} · {String(data.created_at).slice(0, 10)}</p>
      <ul className="mt-6 text-sm">
        {(data.order_items ?? []).map((item) => <li key={String(item.sku)}>{item.product_name} · {item.quantity} · {formatMinor(Number(item.line_total_minor), currency)}</li>)}
      </ul>
      <p className="mt-4">Total {formatMinor(Number(data.total_minor), currency)}</p>
      <p className="mt-6 text-xs text-muted">This printable invoice is an operational document. It is not a tax invoice until the business adds its legal identity and tax registration.</p>
    </article>
  );
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p>Loading the invoice…</p>}><Invoice params={params} /></Suspense>;
}
