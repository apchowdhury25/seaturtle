import "server-only";

import { connection } from "next/server";
import { allowDemoCatalog } from "@/lib/env";
import { activeUnitPrice, availableToSell } from "@/lib/commerce";
import { createAdminClient, createPublicClient, createSessionClient } from "@/server/supabase";

export type CatalogFilters = {
  q?: string;
  category?: string;
  gender?: string;
  productType?: string;
  size?: string;
  color?: string;
  material?: string;
  min?: number;
  max?: number;
  availability?: "in" | "out";
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "popular";
  page?: number;
  collection?: string;
  featured?: boolean;
};

export type CatalogCard = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  currency: string;
  priceMinor: number;
  compareAtMinor: number | null;
  image: string | null;
  alt: string;
  isDemonstration: boolean;
  categorySlug: string | null;
};

type VariantRow = {
  id: string;
  sku: string;
  color_name: string;
  color_hex: string | null;
  size_label: string;
  regular_price_minor: number;
  sale_price_minor: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  currency: string;
  weight_grams: number;
  status: string;
  measurements: Record<string, string>;
  inventory: { on_hand: number; reserved: number; low_stock_threshold: number } | { on_hand: number; reserved: number; low_stock_threshold: number }[] | null;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description: string;
  gender: string | null;
  product_type: string | null;
  currency: string;
  status: string;
  is_demonstration: boolean;
  is_featured: boolean;
  material_composition: string | null;
  fabric_weight: string | null;
  fabric_origin: string | null;
  manufacturing_country: string | null;
  manufacturing_facility: string | null;
  fit: string | null;
  care_instructions: string | null;
  sustainability_summary: string | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  tax_category: string;
  published_at: string | null;
  categories: { slug: string; name: string } | { slug: string; name: string }[] | null;
  product_images: { storage_path: string; alt_text: string; sort_order: number }[];
  product_variants: VariantRow[];
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("/")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/product-images/${path}`;
}

function inventoryOf(variant: VariantRow) {
  return one(variant.inventory) ?? { on_hand: 0, reserved: 0, low_stock_threshold: 0 };
}

function toCard(row: ProductRow): CatalogCard {
  const variants = row.product_variants.filter((variant) => variant.status === "active");
  const prices = variants.map((variant) =>
    activeUnitPrice({
      regularMinor: Number(variant.regular_price_minor),
      saleMinor: variant.sale_price_minor === null ? null : Number(variant.sale_price_minor),
      saleStartsAt: variant.sale_starts_at,
      saleEndsAt: variant.sale_ends_at,
    }),
  );
  const priceMinor = prices.length ? Math.min(...prices) : 0;
  const regulars = variants.map((variant) => Number(variant.regular_price_minor));
  const compare = regulars.length && Math.min(...regulars) > priceMinor ? Math.min(...regulars) : null;
  const image = [...(row.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    currency: row.currency,
    priceMinor,
    compareAtMinor: compare,
    image: mediaUrl(image?.storage_path),
    alt: image?.alt_text || row.name,
    isDemonstration: row.is_demonstration,
    categorySlug: one(row.categories)?.slug ?? null,
  };
}

const PRODUCT_SELECT = `
  id, name, slug, sku, description, short_description, gender, product_type, currency, status,
  is_demonstration, is_featured, material_composition, fabric_weight, fabric_origin,
  manufacturing_country, manufacturing_facility, fit, care_instructions, sustainability_summary,
  seo_title, seo_description, tags, tax_category, published_at,
  categories (slug, name),
  product_images (storage_path, alt_text, sort_order),
  product_variants (
    id, sku, color_name, color_hex, size_label, regular_price_minor, sale_price_minor,
    sale_starts_at, sale_ends_at, currency, weight_grams, status, measurements,
    inventory (on_hand, reserved, low_stock_threshold)
  )
`;

async function catalogClient() {
  await connection();
  if (allowDemoCatalog()) return createAdminClient();
  return createPublicClient();
}

export async function getCatalog(filters: CatalogFilters): Promise<{ configured: boolean; cards: CatalogCard[]; total: number; page: number }> {
  const client = await catalogClient();
  const page = Math.max(filters.page ?? 1, 1);
  if (!client) return { configured: false, cards: [], total: 0, page };
  const needsVariantJoin = Boolean(filters.size || filters.color);
  let select = PRODUCT_SELECT;
  if (filters.category) select = select.replace("categories (slug, name)", "categories!inner(slug, name)");
  if (needsVariantJoin) select = select.replace("product_variants (", "product_variants!inner(");
  let query = client.from("products").select(select, { count: "exact" }).eq("status", "active");
  if (!allowDemoCatalog()) query = query.eq("is_demonstration", false);
  if (filters.featured) query = query.eq("is_featured", true);
  if (filters.gender) query = query.eq("gender", filters.gender);
  if (filters.productType) query = query.eq("product_type", filters.productType);
  if (filters.category) query = query.eq("categories.slug", filters.category);
  if (filters.size) query = query.eq("product_variants.size_label", filters.size);
  if (filters.color) query = query.ilike("product_variants.color_name", filters.color);
  if (filters.material) {
    const material = filters.material.replace(/[%_,.()]/g, "").slice(0, 40);
    if (material) query = query.ilike("material_composition", `%${material}%`);
  }
  if (filters.q) {
    const safe = filters.q.replace(/[%_,.()]/g, "").slice(0, 60);
    if (safe) query = query.or(`name.ilike.%${safe}%,sku.ilike.%${safe}%`);
  }
  if (filters.sort === "newest") query = query.order("published_at", { ascending: false });
  else if (filters.sort === "featured" || filters.sort === "popular") query = query.order("is_featured", { ascending: false });
  else query = query.order("published_at", { ascending: false });
  const from = (page - 1) * 12;
  const needsMemory = filters.min !== undefined || filters.max !== undefined || Boolean(filters.availability);
  const { data, count, error } = needsMemory ? await query.limit(120) : await query.range(from, from + 11);
  if (error || !data) return { configured: true, cards: [], total: 0, page };
  let cards = (data as unknown as ProductRow[]).map(toCard);
  if (filters.min !== undefined || filters.max !== undefined || filters.availability) {
    cards = (data as unknown as ProductRow[])
      .filter((row) => {
        const variants = row.product_variants.filter((variant) => {
          const stock = availableToSell(inventoryOf(variant).on_hand, inventoryOf(variant).reserved);
          if (filters.availability === "in" && stock < 1) return false;
          if (filters.availability === "out" && stock > 0) return false;
          const price = activeUnitPrice({
            regularMinor: Number(variant.regular_price_minor),
            saleMinor: variant.sale_price_minor === null ? null : Number(variant.sale_price_minor),
            saleStartsAt: variant.sale_starts_at,
            saleEndsAt: variant.sale_ends_at,
          });
          if (filters.min !== undefined && price < filters.min) return false;
          if (filters.max !== undefined && price > filters.max) return false;
          return true;
        });
        if (variants.length === 0) return false;
        return true;
      })
      .map(toCard);
    if (filters.sort === "price-asc") cards.sort((a, b) => a.priceMinor - b.priceMinor);
    if (filters.sort === "price-desc") cards.sort((a, b) => b.priceMinor - a.priceMinor);
    const start = (page - 1) * 12;
    const sliced = cards.slice(start, start + 12);
    return { configured: true, cards: sliced, total: cards.length, page };
  }
  if (filters.sort === "price-asc") cards.sort((a, b) => a.priceMinor - b.priceMinor);
  if (filters.sort === "price-desc") cards.sort((a, b) => b.priceMinor - a.priceMinor);
  return { configured: true, cards, total: count ?? cards.length, page };
}

export async function getProduct(slug: string) {
  const client = await catalogClient();
  if (!client) return { configured: false, product: null };
  let query = client.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("status", "active");
  if (!allowDemoCatalog()) query = query.eq("is_demonstration", false);
  const { data } = await query.maybeSingle();
  if (!data) return { configured: true, product: null };
  const row = data as ProductRow;
  const variants = row.product_variants
    .filter((variant) => variant.status === "active")
    .map((variant) => {
      const stock = inventoryOf(variant);
      const price = activeUnitPrice({
        regularMinor: Number(variant.regular_price_minor),
        saleMinor: variant.sale_price_minor === null ? null : Number(variant.sale_price_minor),
        saleStartsAt: variant.sale_starts_at,
        saleEndsAt: variant.sale_ends_at,
      });
      return {
        id: variant.id,
        sku: variant.sku,
        color: variant.color_name,
        hex: variant.color_hex,
        size: variant.size_label,
        priceMinor: price,
        regularMinor: Number(variant.regular_price_minor),
        currency: variant.currency,
        available: availableToSell(stock.on_hand, stock.reserved),
        measurements: variant.measurements ?? {},
      };
    });
  return {
    configured: true,
    product: {
      ...toCard(row),
      description: row.description,
      material: row.material_composition,
      fabricWeight: row.fabric_weight,
      fabricOrigin: row.fabric_origin,
      manufacturingCountry: row.manufacturing_country,
      manufacturingFacility: row.manufacturing_facility,
      fit: row.fit,
      care: row.care_instructions,
      sustainability: row.sustainability_summary,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      images: [...row.product_images].sort((a, b) => a.sort_order - b.sort_order).map((image) => ({
        src: mediaUrl(image.storage_path),
        alt: image.alt_text,
      })),
      variants,
    },
  };
}

export async function getAnnouncements(): Promise<string[]> {
  await connection();
  const client = createPublicClient();
  if (!client) return [];
  const { data } = await client.from("announcements").select("message").eq("is_active", true).order("sort_order");
  return (data ?? []).map((row) => String(row.message));
}

export async function getPublishedPage(slug: string): Promise<{ title: string; description: string; body: string } | null> {
  await connection();
  const client = createPublicClient();
  if (!client) return null;
  const { data } = await client.from("content_pages").select("title, description, body").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!data) return null;
  return { title: String(data.title), description: String(data.description), body: String(data.body) };
}

export async function getSessionProfile() {
  await connection();
  const supabase = await createSessionClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("id, email, full_name, phone").eq("id", data.user.id).maybeSingle();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: String(profile?.full_name ?? ""),
    phone: profile?.phone ? String(profile.phone) : "",
    roles: (roles ?? []).map((role) => String(role.role)),
  };
}

export async function searchSuggestions(q: string): Promise<Array<{ name: string; slug: string }>> {
  await connection();
  const client = await catalogClient();
  if (!client || q.trim().length < 2) return [];
  const safe = q.replace(/[%_,.()]/g, "").slice(0, 40);
  if (!safe) return [];
  let query = client.from("products").select("name, slug").eq("status", "active").ilike("name", `%${safe}%`).limit(6);
  if (!allowDemoCatalog()) query = query.eq("is_demonstration", false);
  const { data } = await query;
  return (data ?? []).map((row) => ({ name: String(row.name), slug: String(row.slug) }));
}
