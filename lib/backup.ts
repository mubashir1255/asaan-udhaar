import { Customer, Transaction, BusinessProfile, Product } from "./types";

export interface BackupData {
  version: string | number;
  exportedAt: string;
  customers: Customer[];
  transactions: Transaction[] | Record<string, Transaction[]>;
  products?: Product[];
  businessProfile?: BusinessProfile;
  appPin?: string | null;
  language?: string;
  theme?: string;
}

export function exportBackupJSON(data: Omit<BackupData, "version" | "exportedAt">) {
  const fullBackup: BackupData = {
    version: "1",
    exportedAt: new Date().toISOString(),
    ...data,
  };

  const jsonStr = JSON.stringify(fullBackup, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const now = new Date().toISOString().split("T")[0];
  const link = document.createElement("a");
  link.href = url;
  link.download = `Asaan_Udhaar_Backup_${now}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importBackupJSON(
  file: File,
  onSuccess: (data: BackupData) => void,
  onError?: (err: string) => void
) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const parsed = JSON.parse(text) as BackupData;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid backup file format");
      }
      onSuccess(parsed);
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err.message : "Failed to parse file");
      } else {
        alert("Invalid backup file! Please select a valid JSON backup.");
      }
    }
  };
  reader.readAsText(file);
}