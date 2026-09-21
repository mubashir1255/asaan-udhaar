import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export type Language = "en" | "ur";
export type Theme = "light" | "dark";

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  openingBalance?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: "udhaar" | "payment";
  amount: number;
  description?: string;
  dueDate?: string; // Promised payment date (YYYY-MM-DD)
  date: string;
  createdAt: string;
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

// Check if a customer has an overdue balance
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

// Export single customer ledger to CSV (Mobile Native + Web/Desktop compatible)
export async function exportCustomerLedgerCSV(
  customerName: string,
  transactions: Transaction[]
) {
  const headers = ["Date", "Type", "Description", "Promised Due Date", "Amount (PKR)"];
  const rows = (transactions || []).map((t) => [
    t.date ? t.date.split("T")[0] : "",
    t.type === "udhaar" ? "Udhaar (Credit)" : "Payment Received",
    `"${(t.description || "").replace(/"/g, '""')}"`,
    t.dueDate || "-",
    t.type === "udhaar" ? `+${t.amount}` : `-${t.amount}`,
  ]);

  const csvRaw = [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
  const sanitizedName = customerName.replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, "_");
  const fileName = `${sanitizedName}_Khaata_Statement_${new Date().toISOString().slice(0, 10)}.csv`;

  // 1. Android APK / Native Device Handling
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

  // 2. Web Browser & Electron Desktop Fallback
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