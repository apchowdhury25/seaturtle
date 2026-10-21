import { NextResponse } from "next/server";
import { createAdminClient } from "@/server/supabase";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "database_unconfigured" }, { status: 503 });
  const { data, error } = await admin.rpc("release_expired_reservations");
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true, released: data ?? 0 });
}
