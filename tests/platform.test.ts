import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePayPalCapture, normalizeStripeEvent, verifyStripeSignature } from "@/lib/payments";
import { hmacSha256 } from "@/lib/security";

describe("payment normalization", () => {
  it("accepts a signed Stripe checkout session only in the matching environment", () => {
    const payload = JSON.stringify({
      id: "evt_1",
      type: "checkout.session.completed",
      livemode: false,
      data: { object: { id: "cs_1", amount_total: 11400, currency: "usd", payment_status: "paid", metadata: { order_id: "order-1" } } },
    });
    const now = Math.floor(Date.now() / 1000);
    const header = `t=${now},v1=${hmacSha256("whsec", `${now}.${payload}`)}`;
    expect(verifyStripeSignature(payload, header, "whsec").ok).toBe(true);
    const normalized = normalizeStripeEvent(JSON.parse(payload), "test");
    expect(normalized.ok && normalized.event.status).toBe("paid");
    expect(normalizeStripeEvent(JSON.parse(payload), "live").ok).toBe(false);
  });

  it("converts a PayPal capture using currency precision", () => {
    const normalized = normalizePayPalCapture({
      id: "WH-1",
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: { id: "cap-1", custom_id: "order-1", amount: { currency_code: "USD", value: "114.00" } },
    }, "test");
    expect(normalized.ok && normalized.event.amount_minor).toBe(11400);
  });
});

describe("database security files", () => {
  it("forces row level security on every public table", () => {
    const sql = readFileSync("supabase/migrations/202610200003_rls.sql", "utf8");
    expect(sql).toContain("force row level security");
    expect(sql).toContain("grant select on all tables in schema public to anon");
  });
});
