'use client'

import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input, Label } from "@go-tech-frontend/ui";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const fmt = (n: number) =>
  n.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toSafeFileName = (value: string) => value.replace(/[^\w.-]+/g, "_");

const escapeCsvValue = (value: string | number) => {
  const normalized = String(value).replace(/"/g, '""');
  return `"${normalized}"`;
};

const Index = ({
  invoice = {
    invoiceNo: "INV-2025-0418",
    finalAmount: 2880,
    orderAmount: 2880,
    client: "ABC 科技有限公司",
    businessRegNo: "",
    payTime: "2025-04-22",
    orderItems: [
      { itemName: "企業雲端方案 (Pro Plan) - 生效日期 2025-05-01", amount: 2400 },
      { itemName: "網域註冊續期 (.com.hk) - 1 年", amount: 480 },
    ],
    invoiceHeader: '',
    id: 0
  }
}) => {
  const { token } = useAuth();
  const orderItems = Array.isArray(invoice?.orderItems) ? invoice.orderItems : [];
  const subtotal = invoice.orderAmount;
  const total = invoice.orderAmount;
  const due = invoice.finalAmount;
  const invoiceNo = invoice?.invoiceNo ?? "invoice";
  const fileBaseName = toSafeFileName(`Invoice-${invoiceNo}`);

  const [pendingAction, setPendingAction] = useState<"print" | "pdf" | "csv" | null>(null);

  // 商业登记号
  const [brInput, setBrInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const requestAction = (action: "print" | "pdf" | "csv") => {
    if (invoice.businessRegNo) {
      if (action === "print") handlePrint();
      if (action === "pdf") handleExportPdf();
      if (action === "csv") handleExportCsv();
    } else {
      setPendingAction(action);
      setBrInput("");
      setDialogOpen(true);
    }
  };

  const confirmBr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brInput.trim()) return;

    const requestHeaders = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Type': 'platform_customer'
    })

    await fetch('/go-tech/platform/packageOrder/setBusinessRegNo', {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({
        id: invoice.id,
        businessRegNo: brInput.trim(),
      }),
    }).then(res => res.json())
    invoice.businessRegNo = brInput.trim();
    setDialogOpen(false);
    requestAnimationFrame(() => {
      if (pendingAction === "print") handlePrint();
      if (pendingAction === "pdf") handleExportPdf();
      if (pendingAction === "csv") handleExportCsv();
      setPendingAction(null);
    })
  };

  const handlePrint = () => {
    const invoiceElement = document.getElementById("invoice");
    if (!invoiceElement) return;

    const originalTitle = document.title;
    const host = invoiceElement.cloneNode(true) as HTMLElement;
    host.id = "invoice-print-host";
    host.style.display = "none";
    document.body.appendChild(host);
    document.body.classList.add("invoice-printing");
    document.title = invoiceNo;

    const cleanup = () => {
      document.title = originalTitle;
      document.body.classList.remove("invoice-printing");
      host.remove();
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, 1500);
  };

  const handleExportPdf = () => {
    const url = `/api/pdf/invoice?id=${invoice.id}&code=${invoiceNo}`;
    window.open(url, "_blank");
  };

  const handleExportCsv = () => {
    const rows = [
      ["To", invoice?.invoiceHeader ?? ""],
      ["Invoice Number", invoiceNo],
      ["Issue Date", invoice?.payTime ?? ""],
      ["Business Reg No.", invoice?.businessRegNo ?? ""],
      [],
      ["Description", "Amount (HKD)"],
      ...orderItems.map((item) => [item?.itemName ?? "", fmt(item?.amount ?? 0)]),
      [],
      ["Subtotal", fmt(subtotal)],
      ["Total", fmt(total)],
      ["Amount Due", fmt(due)],
    ];

    const csv = rows
      .map((row) => row.map((cell) => escapeCsvValue(cell ?? "")).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBaseName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <> 
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>輸入 Business Reg No.</DialogTitle>
            <DialogDescription>
              請輸入商業登記號碼，輸入後將會顯示於發票上。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmBr} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="br-no">Business Reg No.</Label>
              <Input
                id="br-no"
                value={brInput}
                onChange={(e) => setBrInput(e.target.value)}
                placeholder="例如：12345678-001"
                autoFocus
              />
            </div>
            <DialogFooter>
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-5 py-2 rounded font-semibold hover:opacity-90 transition"
              >
                確認
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <main className="min-h-screen bg-muted/30 py-8 px-4  min-w-191.5">
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 6mm;
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }

            body.invoice-printing > *:not(#invoice-print-host) {
              display: none !important;
            }

            #invoice-print-host {
              display: block !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              border: 0 !important;
              box-shadow: none !important;
              background: #fff !important;
            }

            #invoice-print-host #invoice-print-actions {
              display: none !important;
            }
            #invoice-print-host #invoice-print-header {
              display: none !important;
            }
          }
        `}</style>
        <h1 className="sr-only">發票預覽 - Go Techs Limited</h1>

        <article id="invoice" className="mx-auto max-w-3xl bg-background shadow-sm border border-border">
          {/* PAID banner */}
          <div className="bg-primary text-primary-foreground text-center py-3 font-semibold tracking-wide" id="invoice-print-header">
            ✓ PAID
          </div>

          {/* Header */}
          <header className="px-8 pt-6 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold mb-3">INVOICE</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold">{fmt(invoice.orderAmount)}</span>
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
                <span>{invoice.invoiceNo}</span>
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
            {orderItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-2">
                <span>{item.itemName}</span>
                <span>{fmt(item.amount)}</span>
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

          {/* Print & Export */}
          <section id="invoice-print-actions" className="px-8 py-6 flex justify-end text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="bg-primary text-primary-foreground px-5 py-2 rounded font-semibold flex items-center gap-2 hover:opacity-90 transition"
                >
                  Print &amp; Export <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => requestAction("print")}>Print</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => requestAction("pdf")}>Invoice {invoiceNo}.pdf</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => requestAction("csv")}>Invoice {invoiceNo}.csv</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </section>
        </article>
      </main>
    </>
  );
};

export default Index;
