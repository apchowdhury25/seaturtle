import "server-only";

import { cookies } from "next/headers";
import { activeUnitPrice, availableToSell, quoteCart, type DiscountRule, type QuoteLine, type ShippingMethodQuote, type TaxRule } from "@/lib/commerce";
import { allowDemoCatalog } from "@/lib/env";
import { randomToken, sha256 } from "@/lib/security";
import { mediaUrl } from "@/server/data";
import { createAdminClient, createSessionClient } from "@/server/supabase";

export const CART_COOKIE = "sta_cart";

export async function readCartToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CART_COOKIE)?.value ?? null;
}

export async function writeCartToken(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function currentUserId(): Promise<string | null> {
  const supabase = await createSessionClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function findCartId(): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const token = await readCartToken();
  const userId = await currentUserId();
  if (userId) {
    const { data } = await admin.from("carts").select("id").eq("user_id", userId).maybeSingle();
    if (data?.id) return String(data.id);
  }
  if (!token) return null;
  const { data } = await admin.from("carts").select("id, user_id").eq("token_hash", sha256(token)).maybeSingle();
  if (data?.id && (!data.user_id || data.user_id === userId)) return String(data.id);
  return null;
}

export async function readCartCount(): Promise<number> {
  const admin = createAdminClient();
  const cartId = await findCartId();
  if (!admin || !cartId) return 0;
  const { data } = await admin.from("cart_items").select("quantity").eq("cart_id", cartId);
  return (data ?? []).reduce((sum, row) => sum + Number(row.quantity), 0);
}

export async function getOrCreateCart(): Promise<{ id: string; token: string } | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const userId = await currentUserId();
  const token = (await readCartToken()) ?? randomToken();
  if (userId) {
    const { data: existing } = await admin.from("carts").select("id").eq("user_id", userId).maybeSingle();
    if (existing?.id) {
      await writeCartToken(token);
      await admin.from("carts").update({ token_hash: sha256(token) }).eq("id", existing.id);
      return { id: String(existing.id), token };
    }
  }
  const hash = sha256(token);
  const { data: byToken } = await admin.from("carts").select("id, user_id").eq("token_hash", hash).maybeSingle();
  if (byToken?.id && (!byToken.user_id || byToken.user_id === userId)) {
    await writeCartToken(token);
    return { id: String(byToken.id), token };
  }
  const { data: created, error } = await admin.from("carts").insert({ user_id: userId, token_hash: hash }).select("id").single();
  if (error || !created) return null;
  await writeCartToken(token);
  return { id: String(created.id), token };
}

type CartItemRow = {
  quantity: number;
  product_variants: {
    id: string;
    sku: string;
    color_name: string;
    size_label: string;
    regular_price_minor: number;
    sale_price_minor: number | null;
    sale_starts_at: string | null;
    sale_ends_at: string | null;
    currency: string;
    weight_grams: number;
    status: string;
    products: {
      id: string;
      name: string;
      slug: string;
      category_id: string | null;
      tax_category: string;
      status: string;
      is_demonstration: boolean;
      product_images: { storage_path: string; alt_text: string; sort_order: number }[];
    } | {
      id: string;
      name: string;
      slug: string;
      category_id: string | null;
      tax_category: string;
      status: string;
      is_demonstration: boolean;
      product_images: { storage_path: string; alt_text: string; sort_order: number }[];
    }[] | null;
    inventory: { on_hand: number; reserved: number } | { on_hand: number; reserved: number }[] | null;
  } | null;
};

export async function loadCartLines(): Promise<{ configured: boolean; cartId: string | null; lines: QuoteLine[]; display: Array<QuoteLine & { image: string | null; slug: string; available: number; color: string; size: string }> }> {
  const admin = createAdminClient();
  const cartId = await findCartId();
  if (!admin) return { configured: false, cartId: null, lines: [], display: [] };
  if (!cartId) return { configured: true, cartId: null, lines: [], display: [] };
  const { data } = await admin
    .from("cart_items")
    .select(`quantity, product_variants (id, sku, color_name, size_label, regular_price_minor, sale_price_minor, sale_starts_at, sale_ends_at, currency, weight_grams, status, products (id, name, slug, category_id, tax_category, status, is_demonstration, product_images (storage_path, alt_text, sort_order)), inventory (on_hand, reserved))`)
    .eq("cart_id", cartId);
  const display = [];
  const lines: QuoteLine[] = [];
  for (const row of (data ?? []) as unknown as CartItemRow[]) {
    const variant = row.product_variants;
    const product = Array.isArray(variant?.products) ? variant?.products[0] : variant?.products;
    if (!variant || !product || product.status !== "active" || variant.status !== "active") continue;
    if (product.is_demonstration && !allowDemoCatalog()) continue;
    const stock = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
    const available = availableToSell(stock?.on_hand ?? 0, stock?.reserved ?? 0);
    const unit = activeUnitPrice({
      regularMinor: Number(variant.regular_price_minor),
      saleMinor: variant.sale_price_minor === null ? null : Number(variant.sale_price_minor),
      saleStartsAt: variant.sale_starts_at,
      saleEndsAt: variant.sale_ends_at,
    });
    const line: QuoteLine = {
      variantId: variant.id,
      productId: product.id,
      categoryId: product.category_id,
      quantity: row.quantity,
      unitPriceMinor: unit,
      currency: variant.currency,
      weightGrams: variant.weight_grams,
      taxCategory: product.tax_category,
      name: product.name,
      sku: variant.sku,
    };
    lines.push(line);
    const image = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
    display.push({
      ...line,
      image: mediaUrl(image?.storage_path),
      slug: product.slug,
      available,
      color: variant.color_name,
      size: variant.size_label,
    });
  }
  return { configured: true, cartId, lines, display };
}

export async function loadShippingAndTax(): Promise<{ methods: ShippingMethodQuote[]; rules: TaxRule[] }> {
  const admin = createAdminClient();
  if (!admin) return { methods: [], rules: [] };
  const [{ data: methods }, { data: rules }] = await Promise.all([
    admin.from("shipping_methods").select("*").eq("is_active", true),
    admin.from("tax_rules").select("*").eq("is_active", true),
  ]);
  return {
    methods: (methods ?? [])
      .filter((method) => allowDemoCatalog() || method.is_demonstration === false)
      .map((method) => ({
        id: String(method.id),
        name: String(method.name),
        currency: String(method.currency),
        countries: (method.countries as string[]) ?? [],
        active: true,
        isDemonstration: Boolean(method.is_demonstration),
        flatMinor: Number(method.flat_minor),
        freeThresholdMinor: method.free_threshold_minor === null ? null : Number(method.free_threshold_minor),
        minWeightGrams: method.min_weight_grams === null ? null : Number(method.min_weight_grams),
        maxWeightGrams: method.max_weight_grams === null ? null : Number(method.max_weight_grams),
        perKgMinor: Number(method.per_kg_minor),
        estimateMinDays: method.estimate_min_days === null ? null : Number(method.estimate_min_days),
        estimateMaxDays: method.estimate_max_days === null ? null : Number(method.estimate_max_days),
      })),
    rules: (rules ?? []).map((rule) => ({
      id: String(rule.id),
      countryCode: String(rule.country_code),
      regionCode: rule.region_code ? String(rule.region_code) : null,
      productTaxCategory: rule.product_tax_category ? String(rule.product_tax_category) : null,
      rateBps: Number(rule.rate_bps),
      inclusive: Boolean(rule.inclusive),
      appliesToShipping: Boolean(rule.applies_to_shipping),
      priority: Number(rule.priority),
      active: true,
    })),
  };
}

export async function loadDiscount(code: string | undefined): Promise<DiscountRule | null> {
  if (!code) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("discounts").select("*").ilike("code", code).maybeSingle();
  if (!data) return null;
  if (data.is_demonstration && !allowDemoCatalog()) return null;
  return {
    id: String(data.id),
    code: String(data.code),
    type: data.type,
    percentageBps: data.percentage_bps === null ? null : Number(data.percentage_bps),
    amountMinor: data.amount_minor === null ? null : Number(data.amount_minor),
    currency: data.currency ? String(data.currency) : null,
    minSubtotalMinor: data.min_subtotal_minor === null ? null : Number(data.min_subtotal_minor),
    startsAt: data.starts_at ? String(data.starts_at) : null,
    endsAt: data.ends_at ? String(data.ends_at) : null,
    usageLimit: data.usage_limit === null ? null : Number(data.usage_limit),
    usageCount: Number(data.usage_count ?? 0),
    perCustomerLimit: data.per_customer_limit === null ? null : Number(data.per_customer_limit),
    customerRedemptions: 0,
    isActive: Boolean(data.is_active),
    productIds: (data.product_ids as string[] | null) ?? null,
    categoryIds: (data.category_ids as string[] | null) ?? null,
    firstOrderOnly: Boolean(data.first_order_only),
  };
}

export async function quoteCurrentCart(input: { countryCode?: string; regionCode?: string; methodId?: string; code?: string; requireShipping?: boolean }) {
  const { lines, configured, display, cartId } = await loadCartLines();
  const { methods, rules } = await loadShippingAndTax();
  const discount = await loadDiscount(input.code);
  const method = methods.find((item) => item.id === input.methodId) ?? null;
  const quote = quoteCart({
    lines,
    discount,
    shippingMethod: method,
    destination: input.countryCode ? { countryCode: input.countryCode, regionCode: input.regionCode } : null,
    taxRules: rules,
    requireShipping: input.requireShipping,
    allowDemonstrationShipping: allowDemoCatalog(),
  });
  return { configured, display, cartId, quote, methods };
}
