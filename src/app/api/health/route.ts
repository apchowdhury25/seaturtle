import { NextResponse } from "next/server";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "seaturtle-apparel",
    supabase: isSupabaseConfigured(),
    serverKey: isServiceRoleConfigured(),
  });
}
