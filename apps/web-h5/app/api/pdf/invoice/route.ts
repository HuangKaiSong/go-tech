import puppeteer, { type Browser } from "puppeteer";

declare global {
  var __invoicePdfBrowserPromise: Promise<Browser> | undefined;
}

async function getBrowser(): Promise<Browser> {
  if (!globalThis.__invoicePdfBrowserPromise) {
    globalThis.__invoicePdfBrowserPromise = puppeteer.launch({
      args: ["--no-sandbox"],
    });
  }

  return globalThis.__invoicePdfBrowserPromise;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const code = searchParams.get("code");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const fileName = (code && code.trim()) || `invoice-${id}`;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const cookie = req.headers.get("cookie");
    if (cookie) {
      await page.setExtraHTTPHeaders({ cookie });
    }

    await page.setJavaScriptEnabled(false);

    const targetUrl = new URL(`/invoice/pdf/${id}`, req.url).toString();
    const pageResponse = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    if (!pageResponse || !pageResponse.ok()) {
      return new Response("Failed to load invoice page", { status: 502 });
    }

    await page.waitForSelector("#invoice", { timeout: 15000 });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

    const pdfBody = new Uint8Array(pdf).buffer;

    return new Response(pdfBody, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${fileName}.pdf`,
      },
    });
  } finally {
    await page.close();
  }
}
