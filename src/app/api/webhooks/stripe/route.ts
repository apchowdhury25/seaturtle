import { NextResponse } from "next/server";
import { paymentMode } from "@/lib/env";
import { normalizeStripeEvent, verifyStripeSignature } from "@/lib/payments";
import { applySignedPayment } from "@/server/payments-apply";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook_unconfigured" }, { status: 503 });
  const payload = await request.text();
  const verified = verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret);
  if (!verified.ok) return NextResponse.json({ error: verified.reason }, { status: 400 });
  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }
  const normalized = normalizeStripeEvent(raw, paymentMode());
  if (!normalized.ok) {
    return NextResponse.json({ received: normalized.reason === "ignored" }, { status: normalized.reason === "ignored" ? 200 : 400 });
  }
  const applied = await applySignedPayment(normalized.event);
  if (!applied.ok) return NextResponse.json({ error: "not_applied" }, { status: 400 });
  return NextResponse.json({ received: true, duplicate: applied.duplicate ?? false });
}
