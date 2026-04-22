import { httpClient } from "@/lib/http";
import Image from "next/image";

const fmt = (n: number) =>
  n.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;
  let invoice: any = null;
    
  try {
    const data = await httpClient.get(`/go-tech/platform/packageOrder/detail/${id}`)
    invoice = data.data
    if (invoice.platformPackageDto?.packageItemList) {
    invoice.platformPackageDto.packageItemList = invoice.platformPackageDto.packageItemList.filter((item: any) => {
      return item.level <= 1;
    })
  }
  } catch (error) {
    invoice = null
  }

  if (!invoice) {
    return (
      <main className="min-h-screen bg-muted/30 py-8 px-4 min-w-191.5">
        <article className="mx-auto max-w-3xl bg-background shadow-sm border border-border p-8">
          <h1 className="text-lg font-bold mb-2">INVOICE</h1>
          <p className="text-sm text-foreground/80">Invoice data is unavailable.</p>
        </article>
      </main>
    );
  }

  const orderItems = Array.isArray(invoice?.orderItems) ? invoice.orderItems : [] as any[];
  const subtotal = invoice.orderAmount ?? 0;
  const total = invoice.orderAmount ?? 0;
  const due = invoice.finalAmount ?? 0;
  const invoiceNo = invoice?.invoiceNo ?? "-";

  return (
    <main className="min-h-screen bg-muted/30 min-w-191.5">
      <article id="invoice" className="mx-auto max-w-3xl">
        {/* PAID banner */}
        <div className="bg-primary text-primary-foreground text-center py-3 font-semibold tracking-wide" id="invoice-print-header">
          ✓ PAID
        </div>

        {/* Header */}
        <header className="px-8 pt-6 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold mb-3">INVOICE</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{fmt(subtotal)}</span>
              <span className="text-xl font-medium ml-1">HKD</span>
            </div>
          </div>
          <Image src="/images/Gotech_Logo.webp" alt="Go Techs Limited logo" width={96} height={96} className="w-24 h-24 object-contain" loading="lazy" />
        </header>

        <div className="border-t border-foreground" />

        {/* TO / FROM */}
        <section className="px-8 py-4 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="flex gap-3 mb-2">
              <span className="font-bold w-32">TO</span>
              <span>{invoice.invoiceHeader}</span>
            </div>
            <div className="flex gap-3 mb-2">
              <span className="font-bold w-32">Business Reg No.</span>
              <span>{invoice.businessRegNo}</span>
            </div>
            <div className="flex gap-3 mb-2">
              <span className="font-bold w-32">Invoice Number</span>
              <span>{invoiceNo}</span>
            </div>
            <div className="flex gap-3 mt-4">
              <span className="font-bold w-32">Issue Date</span>
              <span>{invoice.payTime}</span>
            </div>
          </div>
          <div>
            <div className="flex gap-3">
              <span className="font-bold">FROM</span>
              <span>GO TECHS LIMITED</span>
            </div>
          </div>
        </section>

        <div className="border-t border-foreground mx-8" />

        {/* Description / Amount */}
        <section className="px-8 py-4">
          <div className="flex justify-between font-bold text-sm mb-3 border-b border-border pb-2">
            <span>Description</span>
            <span>Amount</span>
          </div>
          {orderItems.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-sm py-2">
              <span>{item.itemName}</span>
              <span>{fmt(item?.amount ?? 0)}</span>
            </div>
          ))}
        </section>

        {/* Totals */}
        <section className="px-8 pb-4 ml-auto">
          <div className="ml-auto w-full max-w-md space-y-0 text-sm">
            <div className="flex justify-between border-t border-border py-2">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between border-t border-border py-2">
              <span>Total</span>
              <span>HKD {fmt(total)}</span>
            </div>
            <div className="flex justify-between border-t border-border py-3 font-bold">
              <span>Amount Due</span>
              <span className="text-base">HKD {fmt(due)}</span>
            </div>
          </div>
        </section>

        <div className="border-t border-foreground mx-8" />

        {/* Terms */}
        <section className="px-8 py-4 text-sm">
          <h3 className="font-bold mb-2">Terms</h3>
          <p className="text-foreground/80">
            The amount due will be debited from the payment details you have provided to us on or after the due date stated above
          </p>
        </section>

        <div className="border-t border-foreground mx-8" />
      </article>
    </main>
  )
}
