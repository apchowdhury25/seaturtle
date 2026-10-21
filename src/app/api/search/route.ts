import { NextResponse } from "next/server";
import { clientAddress, rateLimit } from "@/lib/security";
import { searchSuggestions } from "@/server/data";

export async function GET(request: Request) {
  const limit = rateLimit(`search:${clientAddress(request.headers)}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ suggestions: [] }, { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } });
  }
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const suggestions = await searchSuggestions(q);
  return NextResponse.json({ suggestions });
}
