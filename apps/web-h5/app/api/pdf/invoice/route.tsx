import { httpClient } from "@/lib/http";
import { renderToBuffer } from "@react-pdf/renderer";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { InvoicePDF } from "./InvoicePDF";

const PDF_CACHE_TTL_MS = 60 * 1000;
const PDF_CACHE_MAX_ENTRIES = 100;

interface CachedPdf {
  body: Blob;
  fileName: string;
  expiresAt: number;
}

interface GenerateResult {
  pdf: CachedPdf;
  fetchMs: number;
  renderMs: number;
}

const pdfCache = new Map<string, CachedPdf>();
const inFlight = new Map<string, Promise<GenerateResult>>();

const CJK_TEXT_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/;

function normalizeFileName(raw: string) {
  return raw.replace(/[\\/:*?"<>|]/g, "_");
}

function pruneExpiredCache(now: number) {
  for (const [key, value] of pdfCache) {
    if (value.expiresAt <= now) pdfCache.delete(key);
  }
}

function ensureCacheLimit() {
  while (pdfCache.size > PDF_CACHE_MAX_ENTRIES) {
    const oldest = pdfCache.keys().next().value;
    if (!oldest) break;
    pdfCache.delete(oldest);
  }
}

// ─── Logo：模块加载时立即触发，不等请求 ───
const logoDataUriPromise: Promise<string | null> = (async () => {
  const candidates = [
    path.resolve(process.cwd(), "public/images/Gotech_Logo.png"),
    path.resolve(process.cwd(), "apps/web-h5/public/images/Gotech_Logo.png"),
  ];
  for (const candidate of candidates) {
    try {
      const image = await readFile(candidate);
      return `data:image/png;base64,${image.toString("base64")}`;
    } catch {}
  }
  return null;
})();

// ─── Warmup：模块加载时预热字体和渲染引擎 ───
(async () => {
  try {
    await renderToBuffer(
      <InvoicePDF
        status="PAID"
        to=""
        invoiceNumber=""
        issueDate=""
        items={[]}
        subtotal={0}
        total={0}
        amountDue={0}
        useCjkFont={true}
      />
    );
    console.log("[InvoicePDF] warmup done");
  } catch (e) {
    console.warn("[InvoicePDF] warmup failed", e);
  }
})();

// ─── Invoice fetch 抽离 ───
async function fetchInvoice(
  id: string
): Promise<{ invoice: any; fetchMs: number } | null> {
  try {
    const t0 = performance.now();
    const data = await httpClient.get(
      `/go-tech/platform/packageOrder/detail/${id}`
    );
    const fetchMs = performance.now() - t0;
    const invoice = data.data;

    if (invoice?.platformPackageDto?.packageItemList) {
      invoice.platformPackageDto.packageItemList =
        invoice.platformPackageDto.packageItemList.filter(
          (item: any) => item.level <= 1
        );
    }

    return { invoice, fetchMs };
  } catch {
    return null;
  }
}

async function generatePdf(id: string): Promise<GenerateResult | null> {
  // ✅ Logo 加载 + API 请求并行
  const [logoUrl, fetched] = await Promise.all([
    logoDataUriPromise,
    fetchInvoice(id),
  ]);

  if (!fetched) return null;
  const { invoice, fetchMs } = fetched;

  const orderItems = Array.isArray(invoice?.orderItems)
    ? invoice.orderItems
    : [];
  const subtotal = invoice.orderAmount ?? 0;
  const total = invoice.orderAmount ?? 0;
  const due = invoice.finalAmount ?? 0;
  const invoiceNo = invoice?.invoiceNo ?? "-";

  const rawFileName = (invoiceNo && invoiceNo.trim()) || `invoice-${id}`;
  const fileName = normalizeFileName(rawFileName);

  const sourceTexts = [
    invoice.invoiceHeader,
    invoice.businessRegNo,
    invoiceNo,
    invoice.payTime,
    ...orderItems.map((item: any) => item?.itemName),
  ];
  const useCjkFont = sourceTexts.some(
    v => typeof v === "string" && CJK_TEXT_RE.test(v)
  );

  const t0 = performance.now();
  const pdf = await renderToBuffer(
    <InvoicePDF
      status="PAID"
      to={invoice.invoiceHeader}
      businessRegNo={invoice.businessRegNo}
      invoiceNumber={invoiceNo}
      issueDate={invoice.payTime}
      currency="HKD"
      items={orderItems}
      subtotal={subtotal}
      total={total}
      amountDue={due}
      logoUrl={logoUrl ?? undefined}
      useCjkFont={useCjkFont}
    />
  );
  const renderMs = performance.now() - t0;

  return {
    pdf: {
      body: new Blob([Uint8Array.from(pdf)], { type: "application/pdf" }),
      fileName,
      expiresAt: Date.now() + PDF_CACHE_TTL_MS,
    },
    fetchMs,
    renderMs,
  };
}

export async function GET(req: Request) {
  const startedAt = performance.now();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return new Response("Missing id", { status: 400 });

  const now = Date.now();
  pruneExpiredCache(now);

  const cached = pdfCache.get(id);
  if (cached && cached.expiresAt > now) {
    return new Response(cached.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${cached.fileName}.pdf`,
        "Cache-Control": "private, max-age=60",
        "Server-Timing": `cache;desc=hit, total;dur=${(performance.now() - startedAt).toFixed(1)}`,
      },
    });
  }

  let pdfPromise = inFlight.get(id);
  if (!pdfPromise) {
    pdfPromise = generatePdf(id).then(result => {
      if (!result) throw new Error("INVOICE_NOT_FOUND");
      pdfCache.set(id, result.pdf);
      ensureCacheLimit();
      return result;
    });
    inFlight.set(id, pdfPromise);
  }

  try {
    const result = await pdfPromise;
    const totalMs = performance.now() - startedAt;
    return new Response(result.pdf.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${result.pdf.fileName}.pdf`,
        "Cache-Control": "private, max-age=60",
        "Server-Timing": `cache;desc=miss, fetch;dur=${result.fetchMs.toFixed(1)}, render;dur=${result.renderMs.toFixed(1)}, total;dur=${totalMs.toFixed(1)}`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVOICE_NOT_FOUND") {
      return new Response("Invoice not found", { status: 404 });
    }
    return new Response("Failed to generate invoice", { status: 500 });
  } finally {
    inFlight.delete(id);
  }
}
