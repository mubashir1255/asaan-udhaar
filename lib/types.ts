import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export type Language = "en" | "ur";
export type Theme = "light" | "dark";

export interface Product {
  id: string;
  name: string;
  costPrice: number; // What shopkeeper bought it for
  salePrice: number; // What customer buys it for
  stockQuantity: number; // Remaining stock on shelf
  unit?: string; // kg, pack, piece, etc.
  barcode?: string; // Optional barcode / SKU for laser & camera scanning
  createdAt: string;
}

export interface LineItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  costPrice: number;
  unitPrice: number;
  total: number;
  profit: number; // (unitPrice - costPrice) * quantity
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  openingBalance?: number;
  currentBalance?: number;
  totalUdhaar?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName?: string;
  type: "udhaar" | "payment" | "sale";
  amount: number;
  items?: LineItem[];
  description?: string;
  dueDate?: string;
  date: string;
  createdAt: string;
  isOpeningBalance?: boolean;
}

export interface BusinessProfile {
  storeName: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  logoBase64?: string;
  customMessageEn?: string;
  customMessageUr?: string;
}

// --------------------------------------------------
// Calculation Helpers
// --------------------------------------------------

export function getTotalUdhaar(transactions: Transaction[]): number {
  return (transactions || [])
    .filter((t) => t.type === "udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

export function getTotalReceived(transactions: Transaction[]): number {
  return (transactions || [])
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

export function getCustomerBalance(
  customer: Customer,
  transactions: Transaction[]
): {
  totalUdhaar: number;
  totalReceived: number;
  balance: number;
} {
  const customerTxs = (transactions || []).filter(
    (t) => t.customerId === customer.id
  );

  const hasOpeningTx = customerTxs.some(
    (t) =>
      t.isOpeningBalance ||
      t.description === "Opening Balance" ||
      t.description === "سابقہ بقایا رقم"
  );

  const opening = Number(customer.openingBalance || 0);
  const txUdhaar = getTotalUdhaar(customerTxs);
  const totalReceived = getTotalReceived(customerTxs);

  // If opening balance transaction is already recorded in transactions,
  // getTotalUdhaar already includes it. Otherwise, add opening balance.
  const totalUdhaar = hasOpeningTx
    ? txUdhaar
    : txUdhaar + (opening > 0 ? opening : 0);

  const balance = totalUdhaar - totalReceived;

  return { totalUdhaar, totalReceived, balance };
}

export function getCashSales(transactions: Transaction[]): number {
  return (transactions || [])
    .filter((t) => t.type === "sale")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

export function getTotalSales(transactions: Transaction[]): number {
  return (transactions || [])
    .filter((t) => t.type === "sale" || t.type === "udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

export function getCashInHand(transactions: Transaction[]): number {
  return (transactions || [])
    .filter((t) => t.type === "sale" || t.type === "payment")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

// Total profit made across all itemized transactions
export function getTotalProfit(transactions: Transaction[]): number {
  return (transactions || []).reduce((acc, tx) => {
    if (!tx.items || tx.items.length === 0) return acc;
    const txProfit = tx.items.reduce((pSum, item) => pSum + (item.profit || 0), 0);
    return acc + txProfit;
  }, 0);
}

export function formatCurrency(amount: number): string {
  return `Rs. ${(amount || 0).toLocaleString("en-PK")}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function isCustomerOverdue(
  transactions: Transaction[],
  outstandingBalance: number
): boolean {
  if (outstandingBalance <= 0) return false;
  const today = new Date().toISOString().split("T")[0];
  return (transactions || []).some(
    (tx) => tx.type === "udhaar" && tx.dueDate && tx.dueDate < today
  );
}

export function formatItemsSummary(items?: LineItem[]): string {
  if (!items || items.length === 0) return "";
  return items
    .map((item) => `${item.name} (${item.quantity}x @ ${item.unitPrice})`)
    .join(", ");
}

export async function exportCustomerLedgerCSV(
  customerName: string,
  transactions: Transaction[]
) {
  const headers = [
    "Date",
    "Type",
    "Items",
    "Description",
    "Promised Due Date",
    "Amount (PKR)",
  ];

  const rows = (transactions || []).map((t) => {
    let typeLabel = "Payment Received";
    if (t.type === "udhaar") typeLabel = "Udhaar (Credit)";
    if (t.type === "sale") typeLabel = "Cash Sale (POS)";

    const itemsText = formatItemsSummary(t.items);
    const amountSign =
      t.type === "udhaar" || t.type === "sale" ? `+${t.amount}` : `-${t.amount}`;

    return [
      t.date ? t.date.split("T")[0] : "",
      typeLabel,
      `"${itemsText.replace(/"/g, '""')}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.dueDate || "-",
      amountSign,
    ];
  });

  const csvRaw = [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
  const sanitizedName = customerName.replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, "_");
  const fileName = `${sanitizedName}_Khaata_Statement_${new Date().toISOString().slice(0, 10)}.csv`;

  if (Capacitor.isNativePlatform()) {
    try {
      const writtenFile = await Filesystem.writeFile({
        path: fileName,
        data: csvRaw,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: `${customerName} Khaata Statement`,
        text: `Khaata Statement for ${customerName}`,
        url: writtenFile.uri,
        dialogTitle: "Export Khaata CSV",
      });
      return;
    } catch (error) {
      console.error("Native CSV share failed:", error);
    }
  }

  const blob = new Blob([csvRaw], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}