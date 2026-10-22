function present(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function absoluteHttpUrl(value: string | undefined): string | undefined {
  const trimmed = present(value);
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.href.replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

/** Project URL. Hostinger's connect screen sets SUPABASE_URL; the public name still wins when both exist. */
export function supabaseProjectUrl(): string | undefined {
  return absoluteHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || absoluteHttpUrl(process.env.SUPABASE_URL);
}

/**
 * Publishable or anon key.
 * SUPABASE_API_KEY is Hostinger's alias for that public key. A secret key in that slot is ignored.
 */
export function supabasePublicKey(): string | undefined {
  const dedicated =
    present(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (dedicated) return dedicated;
  const alias = present(process.env.SUPABASE_API_KEY);
  if (!alias || alias.startsWith("sb_secret_")) return undefined;
  return alias;
}
