"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findUnsupportedClaims } from "@/lib/claims";
import { paymentMode } from "@/lib/env";
import { validateProductImport } from "@/lib/csv";
import { productSchema } from "@/lib/schemas";
import { randomToken } from "@/lib/security";
import { isRole } from "@/lib/permissions";
import { requireStaff } from "@/server/actions";
import { applySignedPayment } from "@/server/payments-apply";
import { createAdminClient, createSessionClient } from "@/server/supabase";

async function staffClient(permission: Parameters<typeof requireStaff>[0]) {
  const staff = await requireStaff(permission);
  const supabase = await createSessionClient();
  if (!staff || !supabase) return null;
  return { staff, supabase };
}

async function audit(actorId: string, action: string, entityType: string, entityId?: string) {
  const supabase = await createSessionClient();
  await supabase?.from("audit_logs").insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId ?? null, metadata: {} });
}

function notice(path: string, message: string): never {
  redirect(`${path}?notice=${encodeURIComponent(message)}`);
}

export async function saveProduct(formData: FormData) {
  const gate = await staffClient("catalog.write");
  if (!gate) notice("/admin/products", "You do not have permission to edit the catalog.");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    sku: formData.get("sku"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription") || "",
    categoryId: formData.get("categoryId") || "",
    gender: formData.get("gender") || "",
    productType: formData.get("productType") || "",
    currency: formData.get("currency"),
    status: formData.get("status"),
    priceMinor: Number(formData.get("priceMinor")),
    color: formData.get("color"),
    size: formData.get("size"),
    stock: Number(formData.get("stock")),
    isDemonstration: formData.get("isDemonstration") === "on",
  });
  if (!parsed.success) notice("/admin/products", "The product fields are not valid.");
  const sustainability = String(formData.get("sustainability") ?? "");
  const blocked = findUnsupportedClaims(`${parsed.data.description} ${sustainability}`);
  if (blocked.length) notice("/admin/products", "Remove unsupported environmental claims before saving.");
  const { data: product, error } = await gate.supabase.from("products").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    sku: parsed.data.sku,
    description: parsed.data.description,
    short_description: parsed.data.shortDescription,
    category_id: parsed.data.categoryId || null,
    gender: parsed.data.gender || null,
    product_type: parsed.data.productType || null,
    currency: parsed.data.currency,
    status: parsed.data.status,
    is_demonstration: parsed.data.isDemonstration,
    sustainability_summary: sustainability,
    published_at: parsed.data.status === "active" ? new Date().toISOString() : null,
  }).select("id").single();
  if (error || !product) notice("/admin/products", "The product was not saved. The slug or SKU may already exist.");
  const variantSku = `${parsed.data.sku}-${parsed.data.size}`.slice(0, 64);
  const { data: variant, error: variantError } = await gate.supabase.from("product_variants").insert({
    product_id: product.id,
    sku: variantSku,
    color_name: parsed.data.color,
    size_label: parsed.data.size,
    regular_price_minor: parsed.data.priceMinor,
    currency: parsed.data.currency,
    weight_grams: Number(formData.get("weightGrams") || 0),
  }).select("id").single();
  if (variantError || !variant) notice("/admin/products", "The product was saved but the variant was not.");
  await gate.supabase.from("inventory").insert({ variant_id: variant.id, on_hand: parsed.data.stock, reserved: 0, low_stock_threshold: 2 });
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type) || image.size > 8_000_000) {
      notice("/admin/products", "The product was saved. The image was rejected for type or size.");
    }
    const admin = createAdminClient();
    const path = `${product.id}/${randomToken(8)}`;
    const upload = await admin?.storage.from("product-images").upload(path, new Uint8Array(await image.arrayBuffer()), { contentType: image.type });
    if (!upload?.error) await gate.supabase.from("product_images").insert({ product_id: product.id, storage_path: path, alt_text: String(formData.get("alt") || parsed.data.name) });
  }
  await audit(gate.staff.id, "product.create", "product", product.id);
  revalidatePath("/shop");
  notice("/admin/products", "Product saved.");
}

export async function importProducts(formData: FormData) {
  const gate = await staffClient("catalog.write");
  if (!gate) notice("/admin/products", "You do not have permission to import.");
  const parsed = validateProductImport(String(formData.get("csv") ?? ""));
  if (parsed.errors.length) notice("/admin/products", parsed.errors.slice(0, 3).map((issue) => `Row ${issue.row}: ${issue.message}`).join(" "));
  let saved = 0;
  for (const row of parsed.rows) {
    const blocked = findUnsupportedClaims(row.description);
    if (blocked.length) notice("/admin/products", `Row for ${row.sku} contains an unsupported claim.`);
    const { data: category } = await gate.supabase.from("categories").select("id").eq("slug", row.categorySlug).maybeSingle();
    const { data: product, error } = await gate.supabase.from("products").insert({
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      description: row.description,
      short_description: row.description.slice(0, 180),
      category_id: category?.id ?? null,
      currency: row.currency,
      status: "draft",
      is_demonstration: true,
      sustainability_summary: "No verified sustainability attributes were imported.",
    }).select("id").single();
    if (error || !product) continue;
    const { data: variant } = await gate.supabase.from("product_variants").insert({
      product_id: product.id,
      sku: `${row.sku}-${row.size}`.slice(0, 64),
      color_name: row.color,
      size_label: row.size,
      regular_price_minor: row.priceMinor,
      currency: row.currency,
    }).select("id").single();
    if (variant) await gate.supabase.from("inventory").insert({ variant_id: variant.id, on_hand: row.stock, reserved: 0 });
    saved += 1;
  }
  await audit(gate.staff.id, "product.import", "product");
  notice("/admin/products", `${saved} draft demonstration rows saved. Review them before publication.`);
}

export async function addShipment(formData: FormData) {
  const gate = await staffClient("orders.write");
  if (!gate) notice("/admin/orders", "You do not have permission to ship orders.");
  const orderId = String(formData.get("orderId") ?? "");
  const { error } = await gate.supabase.from("shipments").insert({
    order_id: orderId,
    status: "shipped",
    carrier: String(formData.get("carrier") ?? "").slice(0, 80),
    tracking_number: String(formData.get("trackingNumber") ?? "").slice(0, 80),
    shipped_at: new Date().toISOString(),
  });
  if (error) notice("/admin/orders", "The shipment was not saved.");
  await gate.supabase.from("orders").update({ status: "partially_fulfilled" }).eq("id", orderId).in("status", ["paid", "partially_fulfilled"]);
  await gate.supabase.from("order_status_history").insert({ order_id: orderId, to_status: "partially_fulfilled", note: "Shipment recorded", created_by: gate.staff.id });
  await audit(gate.staff.id, "order.ship", "order", orderId);
  notice("/admin/orders", "Shipment recorded. A tracking number is not a delivery promise.");
}

export async function cancelOrder(formData: FormData) {
  const gate = await staffClient("orders.write");
  if (!gate) notice("/admin/orders", "You do not have permission to cancel orders.");
  const orderId = String(formData.get("orderId") ?? "");
  const { data } = await gate.supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
  if (!data || !["pending_payment", "payment_failed"].includes(String(data.status))) notice("/admin/orders", "Only unpaid orders can be cancelled here.");
  await gate.supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  await gate.supabase.from("order_status_history").insert({ order_id: orderId, from_status: data.status, to_status: "cancelled", note: String(formData.get("note") ?? ""), created_by: gate.staff.id });
  await audit(gate.staff.id, "order.cancel", "order", orderId);
  notice("/admin/orders", "Order cancelled.");
}

export async function recordRefund(formData: FormData) {
  const gate = await staffClient("orders.refund");
  if (!gate) notice("/admin/orders", "You do not have permission to record refunds.");
  if (formData.get("confirmed") !== "on") notice("/admin/orders", "Confirm that the provider refund already happened. This screen does not invent one.");
  const orderId = String(formData.get("orderId") ?? "");
  const amount = Number(formData.get("amountMinor"));
  const reference = String(formData.get("providerReference") ?? "");
  if (!Number.isSafeInteger(amount) || amount <= 0 || reference.length < 4) notice("/admin/orders", "Enter a provider reference and a whole minor-unit amount.");
  const { data: order } = await gate.supabase.from("orders").select("total_minor, currency, status").eq("id", orderId).maybeSingle();
  if (!order) notice("/admin/orders", "Order not found.");
  const full = amount === Number(order.total_minor);
  const { error } = await gate.supabase.from("refunds").insert({
    order_id: orderId,
    amount_minor: amount,
    currency: order.currency,
    status: "succeeded",
    reason: String(formData.get("reason") ?? "").slice(0, 300),
    provider_reference: reference,
    created_by: gate.staff.id,
    restock: formData.get("restock") === "on",
  });
  if (error) notice("/admin/orders", "The refund record was rejected. The provider reference may already exist.");
  const applied = await applySignedPayment({
    provider: String(formData.get("provider") || "manual"),
    event_id: `refund_${reference}`,
    order_id: orderId,
    provider_reference: reference,
    amount_minor: Number(order.total_minor),
    currency: order.currency,
    status: full ? "refunded" : "partially_refunded",
    environment: paymentMode(),
  });
  if (!applied.ok) notice("/admin/orders", applied.message);
  await audit(gate.staff.id, "order.refund", "order", orderId);
  notice("/admin/orders", "Refund recorded from the provider reference. It is not a new charge.");
}

export async function saveDiscount(formData: FormData) {
  const gate = await staffClient("discounts.write");
  if (!gate) notice("/admin/discounts", "You do not have permission to edit discounts.");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "");
  if (!/^[A-Z0-9_-]{3,40}$/.test(code) || !["percentage", "fixed_amount", "free_shipping"].includes(type)) notice("/admin/discounts", "Check the code and type.");
  const { error } = await gate.supabase.from("discounts").insert({
    code,
    description: String(formData.get("description") ?? "").slice(0, 200),
    type,
    percentage_bps: type === "percentage" ? Number(formData.get("percentageBps")) : null,
    amount_minor: type === "fixed_amount" ? Number(formData.get("amountMinor")) : null,
    currency: String(formData.get("currency") || "USD"),
    is_active: formData.get("isActive") === "on",
    is_demonstration: formData.get("isDemonstration") === "on",
    min_subtotal_minor: formData.get("minSubtotal") ? Number(formData.get("minSubtotal")) : null,
  });
  if (error) notice("/admin/discounts", "The discount was not saved.");
  await audit(gate.staff.id, "discount.create", "discount");
  notice("/admin/discounts", "Discount saved. It is enforced again when an order is created.");
}

export async function saveShipping(formData: FormData) {
  const gate = await staffClient("shipping.write");
  if (!gate) notice("/admin/shipping", "You do not have permission to edit shipping.");
  const countries = String(formData.get("countries") ?? "").split(",").map((item) => item.trim().toUpperCase()).filter((item) => /^[A-Z]{2}$/.test(item));
  if (countries.length === 0) notice("/admin/shipping", "Add at least one two-letter country code.");
  const { error } = await gate.supabase.from("shipping_methods").insert({
    name: String(formData.get("name") ?? "").slice(0, 80),
    countries,
    currency: String(formData.get("currency") || "USD"),
    flat_minor: Number(formData.get("flatMinor") || 0),
    free_threshold_minor: formData.get("freeThreshold") ? Number(formData.get("freeThreshold")) : null,
    per_kg_minor: Number(formData.get("perKgMinor") || 0),
    estimate_min_days: formData.get("minDays") ? Number(formData.get("minDays")) : null,
    estimate_max_days: formData.get("maxDays") ? Number(formData.get("maxDays")) : null,
    is_active: formData.get("isActive") === "on",
    is_demonstration: formData.get("isDemonstration") === "on",
  });
  if (error) notice("/admin/shipping", "The shipping method was not saved.");
  await audit(gate.staff.id, "shipping.create", "shipping_method");
  notice("/admin/shipping", "Shipping method saved.");
}

export async function saveTax(formData: FormData) {
  const gate = await staffClient("settings.write");
  if (!gate) notice("/admin/tax", "You do not have permission to edit tax rules.");
  const { error } = await gate.supabase.from("tax_rules").insert({
    country_code: String(formData.get("country") ?? "").toUpperCase(),
    region_code: String(formData.get("region") ?? "") || null,
    rate_bps: Number(formData.get("rateBps")),
    inclusive: formData.get("inclusive") === "on",
    applies_to_shipping: formData.get("shipping") === "on",
    is_active: formData.get("isActive") === "on",
    note: "Administrator-configured rule. This is not a filing position.",
  });
  if (error) notice("/admin/tax", "The tax rule was not saved.");
  await audit(gate.staff.id, "tax.create", "tax_rule");
  notice("/admin/tax", "Tax rule saved. Missing destinations stay at zero and are marked unconfigured at checkout.");
}

export async function saveAnnouncement(formData: FormData) {
  const gate = await staffClient("content.write");
  if (!gate) notice("/admin/content", "You do not have permission to edit content.");
  const message = String(formData.get("message") ?? "").slice(0, 180);
  if (findUnsupportedClaims(message).length) notice("/admin/content", "That announcement makes an unsupported claim.");
  const { error } = await gate.supabase.from("announcements").insert({ message, is_active: formData.get("isActive") === "on", sort_order: 0 });
  if (error) notice("/admin/content", "The announcement was not saved.");
  revalidatePath("/");
  notice("/admin/content", "Announcement saved.");
}

export async function savePage(formData: FormData) {
  const gate = await staffClient("content.write");
  if (!gate) notice("/admin/content", "You do not have permission to edit content.");
  const body = String(formData.get("body") ?? "");
  if (findUnsupportedClaims(body).length) notice("/admin/content", "The page contains an unsupported environmental claim.");
  const { error } = await gate.supabase.from("content_pages").upsert({
    slug: String(formData.get("slug") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    body,
    status: formData.get("status") === "published" ? "published" : "draft",
  }, { onConflict: "slug" });
  if (error) notice("/admin/content", "The page was not saved.");
  notice("/admin/content", "Page saved.");
}

export async function replyTicket(formData: FormData) {
  const gate = await staffClient("support.write");
  if (!gate) notice("/admin/support", "You do not have permission to reply.");
  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "pending");
  await gate.supabase.from("support_ticket_messages").insert({ ticket_id: ticketId, author_id: gate.staff.id, body: String(formData.get("body") ?? "").slice(0, 4000), is_staff: true });
  if (["open", "pending", "resolved", "closed"].includes(status)) {
    await gate.supabase.from("support_tickets").update({ status }).eq("id", ticketId);
  }
  await audit(gate.staff.id, "support.reply", "support_ticket", ticketId);
  notice("/admin/support", "Reply stored.");
}

export async function saveSupplier(formData: FormData) {
  const gate = await staffClient("sustainability.write");
  if (!gate) notice("/admin/suppliers", "You do not have permission to edit suppliers.");
  const status = String(formData.get("status") ?? "pending");
  const wantsPublic = formData.get("isPublic") === "on";
  if (wantsPublic && status !== "approved") notice("/admin/suppliers", "Only an approved supplier can be marked public.");
  const summary = String(formData.get("summary") ?? "");
  if (findUnsupportedClaims(summary).length) notice("/admin/suppliers", "Remove unsupported claims from the summary.");
  const { error } = await gate.supabase.from("suppliers").insert({
    public_name: String(formData.get("name") ?? "").slice(0, 120),
    country_code: String(formData.get("country") ?? "").toUpperCase() || null,
    status,
    summary,
    is_public: wantsPublic,
    disclosure_authorized: wantsPublic,
    is_demonstration: formData.get("isDemonstration") === "on",
  });
  if (error) notice("/admin/suppliers", "The supplier was not saved.");
  await audit(gate.staff.id, "supplier.create", "supplier");
  notice("/admin/suppliers", "Supplier saved.");
}

export async function saveFacility(formData: FormData) {
  const gate = await staffClient("sustainability.write");
  if (!gate) notice("/admin/suppliers", "You do not have permission to edit facilities.");
  const summary = String(formData.get("summary") ?? "");
  if (findUnsupportedClaims(summary).length) notice("/admin/suppliers", "Remove unsupported claims. A planned factory is not a certified factory.");
  const { error } = await gate.supabase.from("manufacturing_facilities").insert({
    name: String(formData.get("name") ?? "").slice(0, 120),
    city: String(formData.get("city") ?? "").slice(0, 80),
    country_code: String(formData.get("country") ?? "").toUpperCase() || null,
    status: String(formData.get("status") || "planned"),
    summary,
    is_public: false,
    is_demonstration: formData.get("isDemonstration") === "on",
  });
  if (error) notice("/admin/suppliers", "The facility was not saved.");
  await audit(gate.staff.id, "facility.create", "facility");
  notice("/admin/suppliers", "Facility saved as not public.");
}

export async function publishTrace(formData: FormData) {
  const gate = await staffClient("sustainability.write");
  if (!gate) notice("/admin/trace", "You do not have permission to publish a trace.");
  const summary = String(formData.get("summary") ?? "");
  if (findUnsupportedClaims(summary).length) notice("/admin/trace", "The summary contains an unsupported claim.");
  let stages: unknown = [];
  try {
    stages = JSON.parse(String(formData.get("stages") || "[]"));
  } catch {
    notice("/admin/trace", "Stages must be JSON.");
  }
  const token = randomToken(18);
  const { error } = await gate.supabase.from("product_traceability_records").insert({
    product_id: String(formData.get("productId") || "") || null,
    public_token: token,
    public_summary: summary,
    stages,
    is_published: formData.get("isPublished") === "on",
    is_demonstration: formData.get("isDemonstration") === "on",
  });
  if (error) notice("/admin/trace", "The trace record was not saved.");
  await audit(gate.staff.id, "trace.publish", "trace");
  notice("/admin/trace", formData.get("isPublished") === "on" ? `Published token ${token}` : `Draft token ${token}`);
}

export async function saveProgram(formData: FormData) {
  const gate = await staffClient("conservation.write");
  if (!gate) notice("/admin/conservation", "You do not have permission to edit contributions.");
  const { error } = await gate.supabase.from("conservation_programs").insert({
    name: String(formData.get("name") ?? "").slice(0, 120),
    model: String(formData.get("model") ?? "manual"),
    rate_bps: formData.get("rateBps") ? Number(formData.get("rateBps")) : null,
    fixed_minor: formData.get("fixedMinor") ? Number(formData.get("fixedMinor")) : null,
    currency: String(formData.get("currency") || "USD"),
    is_active: formData.get("isActive") === "on",
    is_public: false,
    public_explanation: "Accrual is not a payment. This program is not public until a separate review publishes it.",
  });
  if (error) notice("/admin/conservation", "The program was not saved.");
  await audit(gate.staff.id, "conservation.program", "conservation_program");
  notice("/admin/conservation", "Program saved and kept off the public site.");
}

export async function recordContributionPayment(formData: FormData) {
  const gate = await staffClient("conservation.write");
  if (!gate) notice("/admin/conservation", "You do not have permission to record payments.");
  const programId = String(formData.get("programId") ?? "");
  const amount = Number(formData.get("amountMinor"));
  if (!programId || !Number.isSafeInteger(amount) || amount <= 0) notice("/admin/conservation", "Choose a program and a positive amount.");
  const { error } = await gate.supabase.from("conservation_payments").insert({
    program_id: programId,
    amount_minor: amount,
    currency: String(formData.get("currency") || "USD"),
    paid_on: String(formData.get("paidOn") ?? ""),
    note: String(formData.get("note") ?? "").slice(0, 500),
    evidence_path: String(formData.get("evidencePath") ?? "") || null,
    approval_status: "recorded",
    is_public: false,
    created_by: gate.staff.id,
  });
  if (error) notice("/admin/conservation", "The payment was not recorded. Check the date and program.");
  await audit(gate.staff.id, "conservation.payment", "conservation_payment");
  notice("/admin/conservation", "Payment recorded as not public. Approve it before it can be displayed.");
}

export async function assignRole(formData: FormData) {
  const gate = await staffClient("staff.manage");
  if (!gate) notice("/admin/staff", "Only the owner can grant roles.");
  const role = String(formData.get("role") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!isRole(role) || role === "owner") notice("/admin/staff", "Choose a staff role other than owner. The owner role is granted by the bootstrap script.");
  const { error } = await gate.supabase.from("user_roles").insert({ user_id: userId, role, granted_by: gate.staff.id });
  if (error) notice("/admin/staff", "The role was not granted. The person needs a profile, and the role cannot be duplicated.");
  await audit(gate.staff.id, "staff.grant", "user_role", userId);
  notice("/admin/staff", "Role granted.");
}
