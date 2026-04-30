import {
  Document,
  Font,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  itemName: string;
  amount: number;
}

export interface InvoiceData {
  status?: "PAID" | "UNPAID" | "PENDING";
  to: string;
  businessRegNo?: string;
  invoiceNumber: string;
  issueDate: string;
  from?: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  amountDue: number;
  currency?: string;
  logoUrl?: string;
  terms?: string;
  useCjkFont?: boolean;
}

// ─── Font ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const invoiceFontPath = path.resolve(
  __dirname,
  "../../../../public/fonts/Noto_Sans_TC/static/NotoSansTC-Regular.ttf"
);

const invoiceFontBoldPath = path.resolve(
  __dirname,
  "../../../../public/fonts/Noto_Sans_TC/static/NotoSansTC-Medium.ttf"
);

let cjkFontRegistered = false;

function ensureCjkFontRegistered() {
  if (cjkFontRegistered) {
    return;
  }

  Font.register({
    family: "NotoSansTC",
    fonts: [
      {
        src: invoiceFontPath,
        fontWeight: "normal",
      },
      {
        src: invoiceFontBoldPath,
        fontWeight: 700,
      },
    ],
  });

  cjkFontRegistered = true;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const colors = {
  primary: "#f97015",
  foreground: "#000000",
  muted: "#94a3b8",
  border: "#e2e8f0",
  paidBg: "#f97015",
  paidText: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansTC",
    fontSize: 12,
    color: colors.foreground,
    backgroundColor: "#ffffff",
    minWidth: 574.5,
  },

  // ── Paid Banner ──
  banner: {
    backgroundColor: colors.paidBg,
    color: colors.paidText,
    textAlign: "center",
    paddingVertical: 9,
    fontWeight: 700,
    letterSpacing: 0.4,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  bannerCheck: {
    width: 12,
    height: 12,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "column",
  },
  invoiceTitle: {
    fontSize: 13.5,
    marginBottom: 9,
    fontWeight: 700,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  amountValue: {
    fontSize: 18,
  },
  amountCurrency: {
    fontSize: 15,
    marginLeft: 4,
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: "contain",
  },

  // ── Dividers ──
  dividerFull: {
    borderTopWidth: 1,
    borderTopColor: colors.foreground,
    borderTopStyle: "solid",
    marginHorizontal: 0,
  },
  dividerInset: {
    borderTopWidth: 1,
    borderTopColor: colors.foreground,
    borderTopStyle: "solid",
    marginHorizontal: 24,
  },
  dividerLight: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopStyle: "solid",
  },

  // ── Meta Section ──
  metaSection: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 10.5,
    gap: 18,
    fontSize: 10.5,
  },
  metaCol: {
    flex: 1,
    flexDirection: "column",
    gap: 3.75,
  },
  metaRow: {
    flexDirection: "row",
    gap: 9,
  },
  metaLabel: {
    width: 97.5,
    fontWeight: 700,
    flexShrink: 0,
  },
  metaValue: {
    flex: 1,
    color: colors.foreground,
  },

  // ── Items Section ──
  itemsSection: {
    paddingHorizontal: 24,
    paddingVertical: 10.5,
    fontSize: 10.5,
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 6,
    marginBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: "solid",
    fontWeight: 700,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  itemDesc: {
    flex: 1,
  },
  itemAmount: {
    textAlign: "right",
  },

  // ── Totals Section ──
  totalsSection: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    alignItems: "flex-end",
    fontSize: 10.5,
  },
  totalsBox: {
    width: 336,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopStyle: "solid",
  },
  totalRowBold: {
    fontWeight: 700,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopStyle: "solid",
  },
  totalLabelBold: {},
  totalValueBold: {
    fontSize: 12,
  },

  // ── Terms Section ──
  termsSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  termsTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    marginBottom: 6,
  },
  termsText: {
    fontSize: 10.5,
    color: colors.muted,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoicePDF({
  status = "PAID",
  to,
  businessRegNo,
  invoiceNumber,
  issueDate,
  from = "GO TECHS LIMITED",
  items,
  subtotal,
  total,
  amountDue,
  currency = "HKD",
  logoUrl,
  terms = "The amount due will be debited from the payment details you have provided to us on or after the due date stated above",
  useCjkFont = false,
}: InvoiceData) {
  if (useCjkFont) {
    ensureCjkFontRegistered();
  }

  const fontFamily = useCjkFont ? "NotoSansTC" : "Helvetica";

  const fmt = (n: number) =>
    n.toLocaleString("zh-Hant-HK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Document
      creator="GO TECHS"
      author="GO TECHS"
      language="zh-Hant-HK"
      subject={`Invoice-${invoiceNumber}`}
    >
      <Page
        size="A4"
        style={{
          ...styles.page,
          fontFamily,
          paddingTop: 28, // 10mm ≈ 28pt
          paddingBottom: 28,
          paddingLeft: 28,
          paddingRight: 28,
        }}
      >
        {/* ── Paid Banner ── */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Svg viewBox="0 0 12 12" style={styles.bannerCheck}>
              <Path
                d="M2 6.5L4.7 9L10 3"
                stroke={colors.paidText}
                strokeWidth={1.8}
                fill="none"
              />
            </Svg>
            <Text>{status}</Text>
          </View>
        </View>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.amountRow}>
              <Text style={styles.amountValue}>{fmt(total)}</Text>
              <Text style={styles.amountCurrency}>{currency}</Text>
            </View>
          </View>
          {logoUrl && <Image src={logoUrl} style={styles.logo} />}
        </View>

        {/* ── Full Divider ── */}
        <View style={styles.dividerFull} />

        {/* ── Meta: To / From ── */}
        <View style={styles.metaSection}>
          <View style={styles.metaCol}>
            <View style={{ ...styles.metaRow, marginBottom: 6 }}>
              <Text style={styles.metaLabel}>TO</Text>
              <Text style={styles.metaValue}>{to}</Text>
            </View>
            {businessRegNo !== undefined && (
              <View style={{ ...styles.metaRow, marginBottom: 6 }}>
                <Text style={styles.metaLabel}>Business Reg No.</Text>
                <Text style={styles.metaValue}>{businessRegNo}</Text>
              </View>
            )}
            <View style={{ ...styles.metaRow, marginBottom: 6 }}>
              <Text style={styles.metaLabel}>Invoice Number</Text>
              <Text style={styles.metaValue}>{invoiceNumber}</Text>
            </View>
            <View style={{ ...styles.metaRow }}>
              <Text style={styles.metaLabel}>Issue Date</Text>
              <Text style={styles.metaValue}>{issueDate}</Text>
            </View>
          </View>

          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>FROM</Text>
              <Text style={styles.metaValue}>{from}</Text>
            </View>
          </View>
        </View>

        {/* ── Inset Divider ── */}
        <View style={styles.dividerInset} />

        {/* ── Line Items ── */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <Text>Description</Text>
            <Text>Amount</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemDesc}>{item.itemName}</Text>
              <Text style={styles.itemAmount}>{fmt(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>{fmt(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Total</Text>
              <Text>
                {currency} {fmt(total)}
              </Text>
            </View>
            <View style={styles.totalRowBold}>
              <Text style={styles.totalLabelBold}>Amount Due</Text>
              <Text style={styles.totalValueBold}>
                {currency} {fmt(amountDue)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Inset Divider ── */}
        <View style={styles.dividerInset} />

        {/* ── Terms ── */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms</Text>
          <Text style={styles.termsText}>{terms}</Text>
        </View>

        {/* ── Bottom Inset Divider ── */}
        <View style={styles.dividerInset} />
      </Page>
    </Document>
  );
}
