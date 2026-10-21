import "server-only";

import { cookies } from "next/headers";
import { connection } from "next/server";
import { toPublicTrace } from "@/lib/claims";
import { allowDemoCatalog } from "@/lib/env";
import { sha256 } from "@/lib/security";
import { createAdminClient, createPublicClient, createSessionClient } from "@/server/supabase";

const ORDER_SELECT = `
  id, order_number, email, status, currency, subtotal_minor, discount_minor, shipping_minor, tax_minor, total_minor,
  shipping_method_name, shipping_estimate, created_at,
  order_items (product_name, sku, quantity, unit_price_minor, line_total_minor, color_name, size_label, currency),
  payments (status, environment, provider)
`;

export async function getOrderByToken(token: string, orderNumber?: string) {
  await connection();
  const admin = createAdminClient();
  if (!admin || token.length < 16) return null;
  let query = admin.from("orders").select(ORDER_SELECT).eq("tracking_token_hash", sha256(token));
  if (orderNumber) query = query.eq("order_number", orderNumber);
  const { data } = await query.maybeSingle();
  return data;
}

export async function getRecentOrder() {
  await connection();
  const jar = await cookies();
  const raw = jar.get("sta_last_order")?.value ?? "";
  const split = raw.indexOf(".");
  if (split < 1) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", raw.slice(0, split))
    .eq("tracking_token_hash", sha256(raw.slice(split + 1)))
    .maybeSingle();
  return data;
}

export async function listMyOrders() {
  await connection();
  const supabase = await createSessionClient();
  const user = (await supabase?.auth.getUser())?.data.user;
  if (!supabase || !user) return [];
  const { data } = await supabase.from("orders").select(ORDER_SELECT).eq("user_id", user.id).order("created_at", { ascending: false });
  return data ?? [];
}

export async function listMyAddresses() {
  await connection();
  const supabase = await createSessionClient();
  const user = (await supabase?.auth.getUser())?.data.user;
  if (!supabase || !user) return [];
  const { data } = await supabase.from("customer_addresses").select("id, full_name, line1, line2, city, region, postal_code, country_code, phone").eq("user_id", user.id);
  return data ?? [];
}

export async function listWishlist() {
  await connection();
  const supabase = await createSessionClient();
  const user = (await supabase?.auth.getUser())?.data.user;
  if (!supabase || !user) return [];
  const { data: wishlist } = await supabase.from("wishlists").select("id").eq("user_id", user.id).maybeSingle();
  if (!wishlist) return [];
  const { data } = await supabase.from("wishlist_items").select("product_id, products (name, slug, status)").eq("wishlist_id", wishlist.id);
  return data ?? [];
}

export async function getPublicTrace(token: string) {
  await connection();
  const client = allowDemoCatalog() ? createAdminClient() : createPublicClient();
  if (!client) return null;
  let query = client.from("product_traceability_records").select("public_summary, stages, is_published, is_demonstration, products (name, slug)").eq("public_token", token);
  if (!allowDemoCatalog()) query = query.eq("is_published", true).eq("is_demonstration", false);
  const { data } = await query.maybeSingle();
  if (!data || (!allowDemoCatalog() && (data.is_demonstration || !data.is_published))) return null;
  const product = Array.isArray(data.products) ? data.products[0] : data.products;
  return {
    summary: String(data.public_summary ?? ""),
    stages: toPublicTrace(data.stages),
    productName: product?.name ? String(product.name) : null,
    productSlug: product?.slug ? String(product.slug) : null,
    demonstration: Boolean(data.is_demonstration),
  };
}

export async function listArticles() {
  await connection();
  const client = createPublicClient();
  if (!client) return [];
  const { data } = await client.from("editorial_articles").select("slug, title, excerpt, published_at, author_name, category").eq("status", "published").order("published_at", { ascending: false });
  return data ?? [];
}

export async function getArticle(slug: string) {
  await connection();
  const client = createPublicClient();
  if (!client) return null;
  const { data } = await client.from("editorial_articles").select("title, excerpt, body, published_at, author_name, category, seo_description").eq("slug", slug).eq("status", "published").maybeSingle();
  return data;
}

export async function listPublicConservation() {
  await connection();
  const client = createPublicClient();
  if (!client) return { programs: [], payments: [] };
  const [{ data: programs }, { data: payments }] = await Promise.all([
    client.from("conservation_programs").select("name, model, public_explanation, currency").eq("is_public", true).eq("is_demonstration", false),
    client.from("conservation_payments").select("amount_minor, currency, paid_on, note").eq("is_public", true).eq("approval_status", "approved"),
  ]);
  return { programs: programs ?? [], payments: payments ?? [] };
}
