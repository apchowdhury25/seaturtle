import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isServiceRoleConfigured, isSupabaseConfigured, publicSupabaseKey, secretSupabaseKey } from "@/lib/env";

export function createAdminClient(): SupabaseClient | null {
  if (!isServiceRoleConfigured()) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, secretSupabaseKey() as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createPublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, publicSupabaseKey() as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createSessionClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, publicSupabaseKey() as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) cookieStore.set(cookie.name, cookie.value, cookie.options);
        } catch {
          // Server Components cannot always write cookies. The proxy refreshes the session.
        }
      },
    },
  });
}
