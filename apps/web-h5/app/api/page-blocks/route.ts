import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

type Payload = {
  page: string;
  blocks: unknown[];
};

export const POST = async (request: Request) => {
  const origin = request.headers.get("origin");
  try {
    const body = (await request.json()) as Payload;
    if (!body?.page || !Array.isArray(body.blocks)) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 },
      );
    }

    const dir = path.join(process.cwd(), "public", "page-blocks");
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${body.page}.json`);
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      pages: {
        [body.page]: body.blocks,
      },
    };
    await writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");

    return NextResponse.json(
      { ok: true, path: `/page-blocks/${body.page}.json` },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to save file" },
      { status: 500 },
    );
  }
};
