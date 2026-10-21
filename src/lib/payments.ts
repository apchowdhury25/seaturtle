import { majorToMinor } from "@/lib/commerce";
import { hmacSha256, safeEqual } from "@/lib/security";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "authorized"
  | "paid"
  | "failed"
  | "cancelled"
  | "partially_refunded"
  | "refunded";

export type PaymentDecision =
  | { type: "duplicate" }
  | { type: "ignore"; reason: string }
  | { type: "apply"; status: PaymentStatus }
  | { type: "reject"; reason: string };

export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSec = 300,
  nowMs = Date.now(),
): { ok: true } | { ok: false; reason: string } {
  if (!header || !secret) return { ok: false, reason: "missing_signature" };
  const parts = header.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return { ok: false, reason: "malformed" };
  const age = Math.abs(nowMs / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSec) return { ok: false, reason: "expired" };
  const expected = hmacSha256(secret, `${timestamp}.${payload}`);
  if (!signatures.some((signature) => safeEqual(expected, signature))) {
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true };
}

export function verifyTestSignature(
  payload: string,
  header: string | null,
  secret: string,
): { ok: true } | { ok: false; reason: string } {
  if (!header || !secret) return { ok: false, reason: "missing_signature" };
  const expected = hmacSha256(secret, payload);
  if (!safeEqual(expected, header)) return { ok: false, reason: "mismatch" };
  return { ok: true };
}

export function paymentAmountsMatch(
  order: { totalMinor: number; currency: string },
  event: { amountMinor: number; currency: string },
): boolean {
  return order.totalMinor === event.amountMinor && order.currency.toUpperCase() === event.currency.toUpperCase();
}

export function nextPaymentStatus(current: PaymentStatus, incoming: PaymentStatus, alreadyProcessed: boolean): PaymentDecision {
  if (alreadyProcessed) return { type: "duplicate" };
  if (current === incoming && (current === "paid" || current === "failed" || current === "refunded")) {
    return { type: "ignore", reason: "The payment is already in this status." };
  }
  const allowed: Record<PaymentStatus, PaymentStatus[]> = {
    pending: ["processing", "authorized", "paid", "failed", "cancelled"],
    processing: ["authorized", "paid", "failed", "cancelled"],
    authorized: ["paid", "cancelled", "failed"],
    paid: ["partially_refunded", "refunded"],
    partially_refunded: ["partially_refunded", "refunded"],
    failed: [],
    cancelled: [],
    refunded: [],
  };
  if (!allowed[current].includes(incoming)) {
    return { type: "reject", reason: `Cannot move a payment from ${current} to ${incoming}.` };
  }
  return { type: "apply", status: incoming };
}

export type OrderPaymentStatus =
  | "pending_payment"
  | "paid"
  | "payment_failed"
  | "cancelled"
  | "partially_refunded"
  | "refunded";

export function orderStatusForPayment(status: PaymentStatus): OrderPaymentStatus {
  switch (status) {
    case "paid":
    case "authorized":
      return status === "authorized" ? "pending_payment" : "paid";
    case "failed":
      return "payment_failed";
    case "cancelled":
      return "cancelled";
    case "partially_refunded":
      return "partially_refunded";
    case "refunded":
      return "refunded";
    default:
      return "pending_payment";
  }
}

export type PaymentProviderId = "stripe" | "sslcommerz" | "paypal" | "test";

export function configuredProviders(env: NodeJS.ProcessEnv = process.env): Array<{
  id: PaymentProviderId;
  label: string;
  mode: "test" | "live" | "unconfigured";
}> {
  const mode = env.PAYMENT_MODE === "live" ? "live" : "test";
  const providers: Array<{ id: PaymentProviderId; label: string; mode: "test" | "live" | "unconfigured" }> = [];
  if (env.STRIPE_SECRET_KEY && (env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLISHABLE_KEY)) {
    providers.push({ id: "stripe", label: "Stripe", mode });
  }
  if (env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD) {
    providers.push({ id: "sslcommerz", label: "SSLCommerz", mode });
  }
  if (env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET) {
    providers.push({ id: "paypal", label: "PayPal", mode });
  }
  if (mode === "test" && env.PAYMENT_TEST_WEBHOOK_SECRET) {
    providers.push({ id: "test", label: "Sandbox test checkout", mode: "test" });
  }
  return providers;
}

export type NormalizedPaymentEvent = {
  provider: string;
  event_id: string;
  order_id: string;
  provider_reference: string;
  amount_minor: number;
  currency: string;
  status: PaymentStatus;
  environment: "test" | "live";
};

type NormalizeResult = { ok: true; event: NormalizedPaymentEvent } | { ok: false; reason: string; retry: boolean };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function normalizeStripeEvent(raw: unknown, mode: "test" | "live"): NormalizeResult {
  const event = asRecord(raw);
  const data = asRecord(event?.data);
  const object = asRecord(data?.object);
  if (!event || typeof event.id !== "string" || typeof event.type !== "string" || !object) {
    return { ok: false, reason: "malformed", retry: false };
  }
  const live = Boolean(event.livemode);
  if ((mode === "live") !== live) return { ok: false, reason: "environment_mismatch", retry: false };
  const metadata = asRecord(object.metadata);
  const orderId = String(metadata?.order_id ?? object.client_reference_id ?? "");
  const currency = String(object.currency ?? "").toUpperCase();
  const environment = live ? "live" : "test";
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded" || event.type === "checkout.session.async_payment_failed") {
    const amount = Number(object.amount_total);
    if (!orderId || !Number.isSafeInteger(amount)) return { ok: false, reason: "incomplete", retry: false };
    const failed = event.type === "checkout.session.async_payment_failed";
    const status: PaymentStatus = failed ? "failed" : object.payment_status === "paid" ? "paid" : "processing";
    return {
      ok: true,
      event: {
        provider: "stripe",
        event_id: event.id,
        order_id: orderId,
        provider_reference: String(object.id ?? ""),
        amount_minor: amount,
        currency,
        status,
        environment,
      },
    };
  }
  return { ok: false, reason: "ignored", retry: false };
}

export function normalizePayPalCapture(raw: unknown, mode: "test" | "live"): NormalizeResult {
  const event = asRecord(raw);
  const resource = asRecord(event?.resource);
  if (!event || typeof event.id !== "string" || typeof event.event_type !== "string" || !resource) {
    return { ok: false, reason: "malformed", retry: false };
  }
  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED" && event.event_type !== "PAYMENT.CAPTURE.DENIED") {
    return { ok: false, reason: "ignored", retry: false };
  }
  const amount = asRecord(resource.amount);
  const orderId = String(resource.custom_id ?? resource.invoice_id ?? "");
  const currency = String(amount?.currency_code ?? "").toUpperCase();
  const minor = typeof amount?.value === "string" ? majorToMinor(amount.value, currency) : null;
  if (!orderId || !currency || minor === null) return { ok: false, reason: "incomplete", retry: false };
  return {
    ok: true,
    event: {
      provider: "paypal",
      event_id: event.id,
      order_id: orderId,
      provider_reference: String(resource.id ?? ""),
      amount_minor: minor,
      currency,
      status: event.event_type === "PAYMENT.CAPTURE.DENIED" ? "failed" : "paid",
      environment: mode,
    },
  };
}
