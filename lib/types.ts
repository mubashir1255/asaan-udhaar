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

// Export single customer ledger to CSV
export function exportCustomerLedgerCSV(
  customerName: string,
  transactions: Transaction[]
) {
  const headers = ["Date", "Type", "Description", "Promised Due Date", "Amount (PKR)"];
  const rows = (transactions || []).map((t) => [
    t.date.split("T")[0],
    t.type === "udhaar" ? "Udhaar (Credit)" : "Payment Received",
    `"${(t.description || "").replace(/"/g, '""')}"`,
    t.dueDate || "-",
    t.type === "udhaar" ? `+${t.amount}` : `-${t.amount}`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `${customerName.replace(/\s+/g, "_")}_Khaata_Statement.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}