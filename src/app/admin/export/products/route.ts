import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import { requireStaff } from "@/server/actions";
import { createSessionClient } from "@/server/supabase";

export async function GET() {
  const staff = await requireStaff("catalog.read");
  const supabase = await createSessionClient();
  if (!staff || !supabase) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await supabase.from("products").select("name, slug, sku, description, currency, status, is_demonstration").limit(1000);
  const rows = [
    ["name", "slug", "sku", "description", "currency", "status", "is_demonstration"],
    ...(data ?? []).map((row) => [String(row.name), String(row.slug), String(row.sku), String(row.description), String(row.currency), String(row.status), String(row.is_demonstration)]),
  ];
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=products.csv",
    },
  });
}
