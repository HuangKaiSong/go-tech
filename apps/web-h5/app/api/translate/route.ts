import { NextRequest, NextResponse } from "next/server";
import { translate } from "../../lib/translation";
import type { Locale } from "@/app/lib/translation/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get("text");
  const locale = searchParams.get("locale") as Locale;

  if (!text || !locale) {
    return NextResponse.json(
      { error: "Missing text or locale parameter" },
      { status: 400 }
    );
  }

  try {
    const translated = await translate(text, locale);
    return NextResponse.json({ result: translated });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
