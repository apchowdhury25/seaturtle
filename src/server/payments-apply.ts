import "server-only";

import { createAdminClient } from "@/server/supabase";

export async function applySignedPayment(payload: Record<string, unknown>): Promise<{ ok: boolean; message: string; duplicate?: boolean }> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "The server database key is missing." };
  const { data: order } = await admin.from("orders").select("id, total_minor, currency").eq("id", String(payload.order_id ?? "")).maybeSingle();
  if (!order) return { ok: false, message: "The order was not found." };
  if (Number(order.total_minor) !== Number(payload.amount_minor) || String(order.currency).toUpperCase() !== String(payload.currency ?? "").toUpperCase()) {
    return { ok: false, message: "The paid amount did not match the order." };
  }
  const { data, error } = await admin.rpc("apply_payment_event", {
    payload: {
      ...payload,
      sanitized: { provider: payload.provider, status: payload.status, environment: payload.environment },
    },
  });
  if (error) return { ok: false, message: "The payment event could not be stored." };
  const result = data as { ok?: boolean; error?: string; duplicate?: boolean };
  if (!result?.ok) {
    return { ok: false, message: result?.error === "amount_mismatch" ? "The paid amount did not match the order." : "The payment could not be applied." };
  }
  if (!result.duplicate && payload.status === "paid") {
    await admin.from("analytics_events").insert({ event_name: "order_paid", metadata: { orderId: String(payload.order_id) } });
  }
  if (!result.duplicate && payload.status === "failed") {
    await admin.from("analytics_events").insert({ event_name: "payment_failed", metadata: { orderId: String(payload.order_id) } });
  }
  return { ok: true, message: result.duplicate ? "This event was already processed." : "Payment recorded.", duplicate: Boolean(result.duplicate) };
}
