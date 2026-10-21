"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { allowDemoCatalog, paymentMode, siteUrl } from "@/lib/env";
import { formatMinor, quantityError, toMajorString } from "@/lib/commerce";
import { absolute, orderEmail, sendEmail } from "@/lib/email";
import { configuredProviders, verifyTestSignature } from "@/lib/payments";
import { applySignedPayment } from "@/server/payments-apply";
import { clientAddress, randomToken, rateLimit, sha256 } from "@/lib/security";
import { addressSchema, checkoutSchema, contactSchema, loginSchema, registerSchema } from "@/lib/schemas";
import { hasPermission } from "@/lib/permissions";
import { getOrCreateCart, quoteCurrentCart, readCartToken } from "@/server/cart";
import { createAdminClient, createSessionClient } from "@/server/supabase";
import { getSessionProfile } from "@/server/data";

export type ActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string> };

function fields(error: { issues: { path: PropertyKey[]; message: string }[] }): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) result[issue.path.join(".")] = issue.message;
  return result;
}

async function recordEvent(name: string, metadata: Record<string, string | number | boolean | null> = {}) {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("analytics_events").insert({ event_name: name, metadata });
}

export async function addToCart(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const qtyMessage = quantityError(quantity);
  if (qtyMessage) return { ok: false, message: qtyMessage };
  const admin = createAdminClient();
  const cart = await getOrCreateCart();
  if (!admin || !cart) return { ok: false, message: "The commerce database is not configured yet." };
  const { data: variant } = await admin
    .from("product_variants")
    .select("id, status, products (status, is_demonstration), inventory (on_hand, reserved)")
    .eq("id", variantId)
    .maybeSingle();
  const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;
  const stock = Array.isArray(variant?.inventory) ? variant.inventory[0] : variant?.inventory;
  if (!variant || variant.status !== "active" || product?.status !== "active") {
    return { ok: false, message: "That option is not available." };
  }
  if (product.is_demonstration && !allowDemoCatalog()) {
    return { ok: false, message: "Demonstration products are hidden on the live store." };
  }
  const available = Number(stock?.on_hand ?? 0) - Number(stock?.reserved ?? 0);
  const { data: existing } = await admin.from("cart_items").select("quantity").eq("cart_id", cart.id).eq("variant_id", variantId).maybeSingle();
  const nextQuantity = Number(existing?.quantity ?? 0) + quantity;
  if (nextQuantity > available) return { ok: false, message: "Not enough stock is available for that quantity." };
  if (nextQuantity > 20) return { ok: false, message: "Quantity cannot exceed 20 per item." };
  const { error } = existing
    ? await admin.from("cart_items").update({ quantity: nextQuantity }).eq("cart_id", cart.id).eq("variant_id", variantId)
    : await admin.from("cart_items").insert({ cart_id: cart.id, variant_id: variantId, quantity });
  if (error) return { ok: false, message: "The item could not be added." };
  await recordEvent("add_to_cart", { variantId, quantity });
  revalidatePath("/cart");
  return { ok: true, message: "Added to your cart." };
}

export async function buyNow(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = await addToCart(_prev, formData);
  if (!result.ok) return result;
  redirect("/checkout");
}

export async function updateCartItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const admin = createAdminClient();
  const cart = await getOrCreateCart();
  if (!admin || !cart) return { ok: false, message: "The commerce database is not configured yet." };
  if (quantity < 1) {
    await admin.from("cart_items").delete().eq("cart_id", cart.id).eq("variant_id", variantId);
    await recordEvent("remove_from_cart", { variantId });
  } else {
    const qtyMessage = quantityError(quantity);
    if (qtyMessage) return { ok: false, message: qtyMessage };
    const { error } = await admin.from("cart_items").update({ quantity }).eq("cart_id", cart.id).eq("variant_id", variantId);
    if (error) return { ok: false, message: "The quantity could not be updated." };
  }
  revalidatePath("/cart");
  return { ok: true, message: "Cart updated." };
}

export async function toggleWishlist(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const productId = String(formData.get("productId") ?? "");
  const supabase = await createSessionClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return { ok: false, message: "Accounts require Supabase to be configured." };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, message: "Sign in to save pieces to your wishlist." };
  const { data: wishlist } = await admin.from("wishlists").upsert({ user_id: data.user.id }, { onConflict: "user_id" }).select("id").single();
  if (!wishlist) return { ok: false, message: "The wishlist could not be opened." };
  const { data: existing } = await admin.from("wishlist_items").select("product_id").eq("wishlist_id", wishlist.id).eq("product_id", productId).maybeSingle();
  if (existing) await admin.from("wishlist_items").delete().eq("wishlist_id", wishlist.id).eq("product_id", productId);
  else await admin.from("wishlist_items").insert({ wishlist_id: wishlist.id, product_id: productId });
  revalidatePath("/account/wishlist");
  return { ok: true, message: existing ? "Removed from your wishlist." : "Saved to your wishlist." };
}

export async function placeOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const headerList = await headers();
  const limit = rateLimit(`checkout:${clientAddress(headerList)}`, 8, 10 * 60 * 1000);
  if (!limit.ok) return { ok: false, message: "Too many checkout attempts. Please wait and try again." };
  const billingSame = formData.get("billingSame") === "on";
  const parsed = checkoutSchema.safeParse({
    email: formData.get("email"),
    shipping: {
      fullName: formData.get("shippingName"),
      line1: formData.get("shippingLine1"),
      line2: formData.get("shippingLine2") || "",
      city: formData.get("shippingCity"),
      region: formData.get("shippingRegion") || "",
      postalCode: formData.get("shippingPostal"),
      countryCode: formData.get("shippingCountry"),
      phone: formData.get("shippingPhone") || "",
    },
    billingSame,
    billing: billingSame
      ? undefined
      : {
          fullName: formData.get("billingName"),
          line1: formData.get("billingLine1"),
          line2: formData.get("billingLine2") || "",
          city: formData.get("billingCity"),
          region: formData.get("billingRegion") || "",
          postalCode: formData.get("billingPostal"),
          countryCode: formData.get("billingCountry"),
          phone: formData.get("billingPhone") || "",
        },
    shippingMethodId: formData.get("shippingMethodId"),
    discountCode: formData.get("discountCode") || "",
    note: formData.get("note") || "",
  });
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: fields(parsed.error) };
  if (!billingSame && !parsed.data.billing) return { ok: false, message: "Add a billing address or use the shipping address." };
  const admin = createAdminClient();
  const cart = await getOrCreateCart();
  const token = await readCartToken();
  if (!admin || !cart || !token) return { ok: false, message: "Checkout needs the Supabase server key." };
  const session = await createSessionClient();
  const userResult = await session?.auth.getUser();
  const userId = userResult?.data.user?.id ?? null;
  const provider = String(formData.get("provider") || configuredProviders()[0]?.id || "test");
  const idempotency = String(formData.get("idempotency") || randomToken(16));
  const address = (input: { fullName: string; line1: string; line2?: string; city: string; region?: string; postalCode: string; countryCode: string; phone?: string }) => ({
    full_name: input.fullName,
    line1: input.line1,
    line2: input.line2 ?? "",
    city: input.city,
    region: input.region ?? "",
    postal_code: input.postalCode,
    country_code: input.countryCode,
    phone: input.phone ?? "",
  });
  const { data, error } = await admin.rpc("checkout_create_order", {
    payload: {
      cart_id: cart.id,
      cart_token: token,
      user_id: userId,
      email: parsed.data.email,
      shipping_address: address(parsed.data.shipping),
      billing_address: address(billingSame ? parsed.data.shipping : parsed.data.billing ?? parsed.data.shipping),
      shipping_method_id: parsed.data.shippingMethodId,
      discount_code: parsed.data.discountCode ?? "",
      customer_note: parsed.data.note ?? "",
      idempotency_key: idempotency,
      allow_demonstration: allowDemoCatalog(),
      provider,
      environment: paymentMode(),
    },
  });
  if (error) return { ok: false, message: "The order could not be created." };
  const result = data as { ok: boolean; error?: string; order_id?: string; order_number?: string; tracking_token?: string; total_minor?: number; currency?: string; replayed?: boolean };
  if (!result.ok || !result.order_id) {
    const messages: Record<string, string> = {
      insufficient_stock: "An item sold out while you were checking out. Your cart was not charged.",
      invalid_discount: "That code cannot be applied.",
      invalid_shipping: "The shipping method is not available for this order.",
      destination_not_served: "We do not ship to that destination yet.",
      empty_cart: "Your cart is empty.",
      cart_unauthorized: "The cart could not be verified. Refresh and try again.",
    };
    return { ok: false, message: messages[result.error ?? ""] ?? "The order could not be placed." };
  }
  await recordEvent("checkout_started", { orderId: result.order_id });
  if (result.tracking_token) {
    const jarToken = result.tracking_token;
    const cookieStore = await import("next/headers").then((mod) => mod.cookies());
    cookieStore.set("sta_last_order", `${result.order_id}.${jarToken}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 30 });
  }
  const pay = await startProviderCheckout({
    provider,
    orderId: result.order_id,
    orderNumber: result.order_number ?? result.order_id,
    amountMinor: Number(result.total_minor ?? 0),
    currency: String(result.currency ?? "USD"),
    email: parsed.data.email,
    customerName: parsed.data.shipping.fullName,
    addressLine: parsed.data.shipping.line1,
    city: parsed.data.shipping.city,
    country: parsed.data.shipping.countryCode,
  });
  if (!pay.ok) return { ok: false, message: pay.message };
  redirect(pay.url);
}

async function startProviderCheckout(input: {
  provider: string;
  orderId: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  email: string;
  customerName: string;
  addressLine: string;
  city: string;
  country: string;
}): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (input.provider === "stripe" && process.env.STRIPE_SECRET_KEY) {
    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("success_url", `${siteUrl()}/orders/return?order=${input.orderId}`);
    body.set("cancel_url", `${siteUrl()}/checkout?status=cancelled`);
    body.set("customer_email", input.email);
    body.set("client_reference_id", input.orderId);
    body.set("metadata[order_id]", input.orderId);
    body.set("line_items[0][quantity]", "1");
    body.set("line_items[0][price_data][currency]", input.currency.toLowerCase());
    body.set("line_items[0][price_data][unit_amount]", String(input.amountMinor));
    body.set("line_items[0][price_data][product_data][name]", `Sea Turtle Apparel ${input.orderNumber}`);
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await response.json()) as { url?: string; id?: string };
    if (!response.ok || !json.url || !json.id) return { ok: false, message: "Stripe did not open a checkout session." };
    const admin = createAdminClient();
    await admin?.from("payments").update({ provider_reference: json.id, provider: "stripe" }).eq("order_id", input.orderId).eq("status", "pending");
    return { ok: true, url: json.url };
  }
  if (input.provider === "sslcommerz" && process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD) {
    const endpoint = paymentMode() === "live" ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php" : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
    const body = new URLSearchParams({
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
      total_amount: toMajorString(input.amountMinor, input.currency),
      currency: input.currency,
      tran_id: input.orderId,
      success_url: `${siteUrl()}/orders/return?order=${input.orderId}`,
      fail_url: `${siteUrl()}/checkout?status=failed`,
      cancel_url: `${siteUrl()}/checkout?status=cancelled`,
      cus_name: input.customerName,
      cus_email: input.email,
      cus_add1: input.addressLine,
      cus_city: input.city,
      cus_country: input.country,
      shipping_method: "YES",
      product_name: input.orderNumber,
      product_category: "apparel",
      product_profile: "general",
    });
    const response = await fetch(endpoint, { method: "POST", body });
    const json = (await response.json()) as { GatewayPageURL?: string };
    if (!json.GatewayPageURL) return { ok: false, message: "SSLCommerz did not return a payment page." };
    return { ok: true, url: json.GatewayPageURL };
  }
  if (input.provider === "paypal" && process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    const base = paymentMode() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
    const tokenResponse = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const tokenJson = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenJson.access_token) return { ok: false, message: "PayPal did not authorize the server." };
    const orderResponse = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenJson.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ reference_id: input.orderId, custom_id: input.orderId, invoice_id: input.orderId, amount: { currency_code: input.currency, value: toMajorString(input.amountMinor, input.currency) } }],
        application_context: { return_url: `${siteUrl()}/orders/return?order=${input.orderId}`, cancel_url: `${siteUrl()}/checkout?status=cancelled` },
      }),
    });
    const orderJson = (await orderResponse.json()) as { id?: string; links?: Array<{ rel: string; href: string }> };
    const approve = orderJson.links?.find((link) => link.rel === "approve")?.href;
    if (!approve || !orderJson.id) return { ok: false, message: "PayPal did not return an approval link." };
    const admin = createAdminClient();
    await admin?.from("payments").update({ provider_reference: orderJson.id, provider: "paypal" }).eq("order_id", input.orderId).eq("status", "pending");
    return { ok: true, url: approve };
  }
  if (paymentMode() === "test" && process.env.PAYMENT_TEST_WEBHOOK_SECRET) {
    return { ok: true, url: `/checkout/test/${input.orderId}` };
  }
  return { ok: false, message: "No payment provider is configured. Add test or live credentials before taking payment." };
}

export async function simulateTestPayment(orderId: string): Promise<void> {
  if (paymentMode() !== "test" || !process.env.PAYMENT_TEST_WEBHOOK_SECRET) {
    redirect(`/checkout?status=failed`);
  }
  const admin = createAdminClient();
  if (!admin) redirect("/checkout?status=failed");
  const { data: order } = await admin.from("orders").select("id, total_minor, currency, order_number, email").eq("id", orderId).maybeSingle();
  if (!order) redirect("/checkout?status=failed");
  const payload = JSON.stringify({
    provider: "test",
    event_id: `test_${orderId}_${randomToken(8)}`,
    order_id: orderId,
    provider_reference: `test_${orderId}`,
    amount_minor: order.total_minor,
    currency: order.currency,
    status: "paid",
    environment: "test",
  });
  const header = (await import("@/lib/security")).hmacSha256(process.env.PAYMENT_TEST_WEBHOOK_SECRET, payload);
  const verified = verifyTestSignature(payload, header, process.env.PAYMENT_TEST_WEBHOOK_SECRET);
  if (!verified.ok) redirect(`/checkout/test/${orderId}`);
  const applied = await applySignedPayment(JSON.parse(payload) as Record<string, unknown>);
  if (!applied.ok) redirect(`/checkout/test/${orderId}`);
  const mail = orderEmail({
    orderNumber: String(order.order_number),
    totalLabel: formatMinor(Number(order.total_minor), String(order.currency)),
    status: "Payment confirmed in the sandbox. This is not a live charge.",
    trackingUrl: absolute(`/track`),
  });
  await sendEmail({ ...mail, to: String(order.email) });
  redirect(`/orders/return?order=${orderId}&sandbox=1`);
}

export async function registerAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({ fullName: formData.get("fullName"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: "Check the account details.", fieldErrors: fields(parsed.error) };
  const supabase = await createSessionClient();
  if (!supabase) return { ok: false, message: "Account registration needs Supabase Auth." };
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName }, emailRedirectTo: `${siteUrl()}/account` },
  });
  if (error) return { ok: false, message: "The account could not be created. If it already exists, sign in or reset the password." };
  return { ok: true, message: "Check your email to confirm the account before signing in." };
}

export async function loginAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: "Enter a valid email and password." };
  const supabase = await createSessionClient();
  if (!supabase) return { ok: false, message: "Sign-in needs Supabase Auth." };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: "Those credentials were not accepted." };
  const guest = await readCartToken();
  const admin = createAdminClient();
  const { data } = await supabase.auth.getUser();
  if (guest && admin && data.user) {
    const { data: guestCart } = await admin.from("carts").select("id").eq("token_hash", sha256(guest)).is("user_id", null).maybeSingle();
    if (guestCart?.id) {
      const { data: userCart } = await admin.from("carts").select("id").eq("user_id", data.user.id).maybeSingle();
      if (!userCart) await admin.from("carts").update({ user_id: data.user.id }).eq("id", guestCart.id);
      else {
        const { data: items } = await admin.from("cart_items").select("variant_id, quantity").eq("cart_id", guestCart.id);
        for (const item of items ?? []) {
          await admin.from("cart_items").upsert({ cart_id: userCart.id, variant_id: item.variant_id, quantity: item.quantity }, { onConflict: "cart_id,variant_id" });
        }
        await admin.from("cart_items").delete().eq("cart_id", guestCart.id);
      }
    }
  }
  redirect("/account");
}

export async function logoutAccount(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const supabase = await createSessionClient();
  if (!supabase) return { ok: false, message: "Password reset needs Supabase Auth." };
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/account/reset` });
  return { ok: true, message: "If an account exists for that email, a reset link will be sent once email delivery is configured in Supabase." };
}

export async function saveProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSessionClient();
  const { data } = await supabase?.auth.getUser() ?? { data: { user: null } };
  if (!supabase || !data.user) return { ok: false, message: "Sign in again to update your profile." };
  const fullName = String(formData.get("fullName") ?? "").slice(0, 120);
  const phone = String(formData.get("phone") ?? "").slice(0, 30);
  const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", data.user.id);
  if (error) return { ok: false, message: "The profile could not be saved." };
  return { ok: true, message: "Profile saved." };
}

export async function saveAddress(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = addressSchema.safeParse({
    fullName: formData.get("fullName"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || "",
    city: formData.get("city"),
    region: formData.get("region") || "",
    postalCode: formData.get("postalCode"),
    countryCode: formData.get("countryCode"),
    phone: formData.get("phone") || "",
  });
  if (!parsed.success) return { ok: false, message: "Check the address.", fieldErrors: fields(parsed.error) };
  const supabase = await createSessionClient();
  const { data } = await supabase?.auth.getUser() ?? { data: { user: null } };
  if (!supabase || !data.user) return { ok: false, message: "Sign in to save an address." };
  const { error } = await supabase.from("customer_addresses").insert({
    user_id: data.user.id,
    full_name: parsed.data.fullName,
    line1: parsed.data.line1,
    line2: parsed.data.line2,
    city: parsed.data.city,
    region: parsed.data.region,
    postal_code: parsed.data.postalCode,
    country_code: parsed.data.countryCode.toUpperCase(),
    phone: parsed.data.phone,
  });
  if (error) return { ok: false, message: "The address could not be saved." };
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved." };
}

export async function subscribeNewsletter(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const consent = formData.get("consent") === "on";
  if (!consent) return { ok: false, message: "Consent is required before we can keep your email." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "The newsletter list is not connected yet." };
  const token = randomToken();
  await admin.from("newsletter_subscriptions").upsert({
    email,
    status: "pending",
    consent_at: new Date().toISOString(),
    token_hash: sha256(token),
  }, { onConflict: "email" });
  await recordEvent("newsletter_subscribe", {});
  const sent = await sendEmail({
    to: email,
    templateKey: "newsletter-verify",
    subject: "Confirm your Sea Turtle Apparel notes",
    html: `<p><a href="${absolute(`/newsletter/confirm/${token}`)}">Confirm subscription</a></p>`,
    text: `Confirm subscription: ${absolute(`/newsletter/confirm/${token}`)}`,
  });
  return {
    ok: true,
    message: sent === "sent" ? "Check your email to confirm." : "Your request is saved as pending. Confirmation email will send once the email provider is configured.",
  };
}

export async function sendContact(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const headerList = await headers();
  const limit = rateLimit(`contact:${clientAddress(headerList)}`, 5, 15 * 60 * 1000);
  if (!limit.ok) return { ok: false, message: "Please wait before sending another message." };
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    orderReference: formData.get("orderReference") || "",
    consent: formData.get("consent") === "on" ? true : false,
  });
  if (!parsed.success) return { ok: false, message: "Check the form and confirm the privacy notice.", fieldErrors: fields(parsed.error) };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "The inbox is not connected yet, so the message was not stored." };
  const { data: contact } = await admin.from("contact_requests").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    order_reference: parsed.data.orderReference || null,
    consent: true,
  }).select("id").single();
  if (contact?.id) {
    await admin.from("support_tickets").insert({
      contact_request_id: contact.id,
      requester_email: parsed.data.email,
      requester_name: parsed.data.name,
      subject: parsed.data.subject,
    });
  }
  await sendEmail({
    to: parsed.data.email,
    templateKey: "contact-ack",
    subject: "We received your message",
    html: "<p>Thank you. A person on the team will reply after the support inbox is staffed. This automatic note is not a promise of a response time.</p>",
    text: "Thank you. We received your message.",
  });
  return { ok: true, message: "Your message is in the support queue." };
}

export async function confirmNewsletter(token: string): Promise<ActionState> {
  const admin = createAdminClient();
  if (!admin || token.length < 20) return { ok: false, message: "This confirmation link is not valid." };
  const { data } = await admin.from("newsletter_subscriptions").update({ status: "subscribed", verified_at: new Date().toISOString() }).eq("token_hash", sha256(token)).eq("status", "pending").select("id");
  if (!data?.length) return { ok: false, message: "This link was already used or does not match a pending subscription." };
  return { ok: true, message: "Your subscription is confirmed." };
}

export async function unsubscribeNewsletter(token: string): Promise<ActionState> {
  const admin = createAdminClient();
  if (!admin || token.length < 20) return { ok: false, message: "This unsubscribe link is not valid." };
  const { data } = await admin.from("newsletter_subscriptions").update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() }).eq("token_hash", sha256(token)).select("id");
  if (!data?.length) return { ok: false, message: "No subscription matched that link." };
  return { ok: true, message: "You are unsubscribed." };
}

export async function requestPrivacy(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSessionClient();
  const user = (await supabase?.auth.getUser())?.data.user;
  if (!supabase || !user?.email) return { ok: false, message: "Sign in to submit a privacy request." };
  const requestType = String(formData.get("requestType") ?? "access");
  if (!["access", "correction", "deletion", "export"].includes(requestType)) return { ok: false, message: "Choose a valid request type." };
  const { error } = await supabase.from("privacy_requests").insert({
    user_id: user.id,
    email: user.email,
    request_type: requestType,
    details: String(formData.get("details") ?? "").slice(0, 2000),
  });
  if (error) return { ok: false, message: "The request could not be stored." };
  return { ok: true, message: "Your request is recorded. It is not completed until a staff member processes it." };
}

export async function requireStaff(permission: Parameters<typeof hasPermission>[1]) {
  const profile = await getSessionProfile();
  if (!profile || !hasPermission(profile.roles, permission)) return null;
  return profile;
}

export async function quotePreview(_prev: ActionState, formData: FormData): Promise<ActionState & { quoteText?: string }> {
  const quoted = await quoteCurrentCart({
    countryCode: String(formData.get("shippingCountry") || ""),
    regionCode: String(formData.get("shippingRegion") || ""),
    methodId: String(formData.get("shippingMethodId") || ""),
    code: String(formData.get("discountCode") || ""),
    requireShipping: true,
  });
  if (!quoted.configured) return { ok: false, message: "Connect Supabase before calculating an order." };
  if (quoted.quote.errors.length) return { ok: false, message: quoted.quote.errors[0] };
  const currency = quoted.quote.currency ?? "USD";
  return {
    ok: true,
    message: `Subtotal ${formatMinor(quoted.quote.subtotalMinor, currency)}, shipping ${formatMinor(quoted.quote.shippingMinor, currency)}, tax ${formatMinor(quoted.quote.taxMinor, currency)}, total ${formatMinor(quoted.quote.totalMinor, currency)}.${quoted.quote.taxConfigured ? "" : " No tax rule is published for this destination."}`,
  };
}

