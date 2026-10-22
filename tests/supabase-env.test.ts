import { afterEach, describe, expect, it } from "vitest";
import { supabaseProjectUrl, supabasePublicKey } from "@/lib/supabase-env";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_API_KEY",
  "SUPABASE_SECRET_KEY",
];

afterEach(() => {
  for (const key of KEYS) delete process.env[key];
});

describe("Hostinger Supabase names", () => {
  it("uses SUPABASE_URL when the public URL is unset", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co/";
    expect(supabaseProjectUrl()).toBe("https://example.supabase.co");
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    expect(supabaseProjectUrl()).toBe("https://public.supabase.co");
  });

  it("rejects a project URL that is not an absolute http address", () => {
    process.env.SUPABASE_URL = "test";
    expect(supabaseProjectUrl()).toBeUndefined();
  });

  it("treats Hostinger's SUPABASE_ANON_KEY as the public key and ignores a secret placed there", () => {
    process.env.SUPABASE_ANON_KEY = "anon-key";
    expect(supabasePublicKey()).toBe("anon-key");
    delete process.env.SUPABASE_ANON_KEY;
    process.env.SUPABASE_API_KEY = "legacy-anon-key";
    expect(supabasePublicKey()).toBe("legacy-anon-key");
    delete process.env.SUPABASE_API_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    expect(supabasePublicKey()).toBe("publishable-key");
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.SUPABASE_API_KEY = "sb_secret_not_public";
    process.env.SUPABASE_SECRET_KEY = "service-key";
    expect(supabasePublicKey()).toBeUndefined();
  });
});
