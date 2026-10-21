import { NextResponse } from "next/server";
import { paymentMode } from "@/lib/env";
import { normalizePayPalCapture } from "@/lib/payments";
import { applySignedPayment } from "@/server/payments-apply";

async function paypalVerified(request: Request, body: string): Promise<boolean> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!clientId || !secret || !webhookId) return false;
  const base = paymentMode() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const tokenResponse = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const tokenJson = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenJson.access_token) return false;
  const verify = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenJson.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: request.headers.get("paypal-auth-algo"),
      cert_url: request.headers.get("paypal-cert-url"),
      transmission_id: request.headers.get("paypal-transmission-id"),
      transmission_sig: request.headers.get("paypal-transmission-sig"),
      transmission_time: request.headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  });
  const result = (await verify.json()) as { verification_status?: string };
  return result.verification_status === "SUCCESS";
}

export async function POST(request: Request) {
  if (!process.env.PAYPAL_WEBHOOK_ID) return NextResponse.json({ error: "webhook_unconfigured" }, { status: 503 });
  const body = await request.text();
  const verified = await paypalVerified(request, body);
  if (!verified) return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  const normalized = normalizePayPalCapture(JSON.parse(body), paymentMode());
  if (!normalized.ok) return NextResponse.json({ received: normalized.reason === "ignored" }, { status: normalized.reason === "ignored" ? 200 : 400 });
  const applied = await applySignedPayment(normalized.event);
  if (!applied.ok) return NextResponse.json({ error: "not_applied" }, { status: 400 });
  return NextResponse.json({ received: true, duplicate: applied.duplicate ?? false });
}
