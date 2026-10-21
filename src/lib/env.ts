import "server-only";

export type ServiceStatus = "ready" | "missing" | "partial";

export function publicSupabaseKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function secretSupabaseKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

const PRODUCTION_ORIGIN = "https://seaturtleapparel.com";
let warnedInvalidSiteUrl = false;

function absoluteHttpUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.href.replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

export function siteUrl(): string {
  const configured = absoluteHttpUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const fallback = process.env.NODE_ENV === "production" ? PRODUCTION_ORIGIN : "http://localhost:3000";
  if (configured) return configured;
  if (!warnedInvalidSiteUrl && process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    warnedInvalidSiteUrl = true;
    console.warn(`[seaturtle] NEXT_PUBLIC_SITE_URL must be an absolute http(s) URL. Received "${process.env.NEXT_PUBLIC_SITE_URL}". Using ${fallback}.`);
  }
  return fallback;
}

export function appEnv(): "development" | "staging" | "production" {
  const value = process.env.APP_ENV;
  if (value === "staging" || value === "production") return value;
  return "development";
}

export function allowDemoCatalog(): boolean {
  return process.env.ALLOW_DEMO_CATALOG === "true" && appEnv() !== "production";
}

export function paymentMode(): "test" | "live" {
  return process.env.PAYMENT_MODE === "live" ? "live" : "test";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(absoluteHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) && publicSupabaseKey());
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(absoluteHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) && secretSupabaseKey());
}

export function configurationReport(): Array<{ service: string; status: ServiceStatus; detail: string }> {
  const supabase = isSupabaseConfigured();
  const service = isServiceRoleConfigured();
  return [
    {
      service: "Supabase",
      status: supabase && service ? "ready" : supabase ? "partial" : "missing",
      detail: supabase
        ? service
          ? "Public and server keys are set."
          : "Public key is set. Server secret is missing, so checkout and admin writes are unavailable."
        : "Set NEXT_PUBLIC_SUPABASE_URL and a publishable or anon key.",
    },
    {
      service: "Payments",
      status: process.env.STRIPE_SECRET_KEY || process.env.SSLCOMMERZ_STORE_ID || process.env.PAYPAL_CLIENT_ID || process.env.PAYMENT_TEST_WEBHOOK_SECRET ? "partial" : "missing",
      detail: `Mode is ${paymentMode()}. Live charges stay disabled until merchant credentials and webhook tests are in place.`,
    },
    {
      service: "Email",
      status: process.env.RESEND_API_KEY && process.env.EMAIL_FROM ? "ready" : "missing",
      detail: "Transactional email is skipped until Resend and a verified sender are configured.",
    },
  ];
}

export function logConfigStatus(): void {
  for (const item of configurationReport()) {
    console.info(`[seaturtle] ${item.service}: ${item.status}. ${item.detail}`);
  }
}
