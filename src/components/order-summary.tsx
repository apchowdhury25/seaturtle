import { formatMinor } from "@/lib/commerce";

type Item = {
  product_name: string;
  sku: string;
  quantity: number;
  line_total_minor: number;
  color_name: string | null;
  size_label: string | null;
};

type Payment = { status: string; environment: string; provider: string };

export type OrderRecord = {
  order_number: string;
  email: string;
  status: string;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  shipping_minor: number;
  tax_minor: number;
  total_minor: number;
  shipping_method_name: string | null;
  shipping_estimate: string | null;
  order_items: Item[] | null;
  payments: Payment[] | null;
};

export function OrderSummary({ order, sandbox = false }: { order: OrderRecord; sandbox?: boolean }) {
  const currency = order.currency;
  const payment = order.payments?.[0];
  return (
    <article className="grid gap-3 border border-line bg-white p-5">
      <h2 className="font-display text-2xl text-navy">{order.order_number}</h2>
      <p className="text-sm">Order status: {order.status}</p>
      <p className="text-sm">Payment: {payment ? `${payment.status} via ${payment.provider} (${payment.environment})` : "No payment record yet."}</p>
      {sandbox ? <p className="text-sm">The sandbox button was used. Paid status appears only after the signed event is stored.</p> : null}
      <ul className="text-sm">
        {(order.order_items ?? []).map((item) => (
          <li key={`${item.sku}-${item.size_label}`}>{item.product_name} · {item.color_name} / {item.size_label} · {item.quantity} · {formatMinor(Number(item.line_total_minor), currency)}</li>
        ))}
      </ul>
      <p className="text-sm">Subtotal {formatMinor(Number(order.subtotal_minor), currency)}</p>
      <p className="text-sm">Discount {formatMinor(Number(order.discount_minor), currency)}</p>
      <p className="text-sm">Shipping {formatMinor(Number(order.shipping_minor), currency)}{order.shipping_method_name ? ` · ${order.shipping_method_name}` : ""}</p>
      <p className="text-sm">Tax {formatMinor(Number(order.tax_minor), currency)}</p>
      <p className="font-display text-xl">Total {formatMinor(Number(order.total_minor), currency)}</p>
      <p className="text-sm text-muted">{order.shipping_estimate ? `Configured estimate: ${order.shipping_estimate}` : "No delivery estimate is configured for this shipment."}</p>
      <p className="text-sm text-muted">Sent to {order.email}. Keep the tracking token private.</p>
    </article>
  );
}
