import { NextRequest, NextResponse } from "next/server";
import { translateBatch } from "../../../lib/translation";
import type { Locale } from "@/app/lib/translation/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locale, texts } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: "Invalid texts" }, { status: 400 });
    }

    if (!locale || typeof locale !== "string") {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const translations = await translateBatch(texts, locale as Locale);
    return NextResponse.json({ translations });
  } catch (error) {
    console.error("Batch translation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
