import { clearCache } from "@/app/lib/translation/cache";
import { NextResponse } from "next/server";

export async function POST() {
  clearCache()
  return NextResponse.json({ ok: true });
}
