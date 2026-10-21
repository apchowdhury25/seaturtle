import { NextResponse } from "next/server";
import { majorToMinor } from "@/lib/commerce";
import { paymentMode } from "@/lib/env";
import { applySignedPayment } from "@/server/payments-apply";

export async function POST(request: Request) {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePassword) return NextResponse.json({ error: "webhook_unconfigured" }, { status: 503 });
  const form = await request.formData();
  const valId = String(form.get("val_id") ?? "");
  const tranId = String(form.get("tran_id") ?? "");
  if (!valId || !tranId) return NextResponse.json({ error: "incomplete" }, { status: 400 });
  const endpoint = paymentMode() === "live"
    ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
    : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";
  const validationUrl = new URL(endpoint);
  validationUrl.searchParams.set("val_id", valId);
  validationUrl.searchParams.set("store_id", storeId);
  validationUrl.searchParams.set("store_passwd", storePassword);
  validationUrl.searchParams.set("format", "json");
  const validation = await fetch(validationUrl);
  const json = (await validation.json()) as { status?: string; currency?: string; amount?: string; tran_id?: string; bank_tran_id?: string };
  const status = String(json.status ?? "");
  const paid = status === "VALID" || status === "VALIDATED";
  const failed = status === "FAILED";
  if (!paid && !failed) return NextResponse.json({ error: "unconfirmed" }, { status: 400 });
  const currency = String(json.currency ?? form.get("currency") ?? "").toUpperCase();
  const minor = majorToMinor(String(json.amount ?? ""), currency);
  if (minor === null || json.tran_id !== tranId) return NextResponse.json({ error: "amount_unverified" }, { status: 400 });
  const applied = await applySignedPayment({
    provider: "sslcommerz",
    event_id: valId,
    order_id: tranId,
    provider_reference: String(json.bank_tran_id ?? valId),
    amount_minor: minor,
    currency,
    status: paid ? "paid" : "failed",
    environment: paymentMode(),
  });
  if (!applied.ok) return NextResponse.json({ error: "not_applied" }, { status: 400 });
  return NextResponse.json({ received: true, duplicate: applied.duplicate ?? false });
}
