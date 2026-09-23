import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Customer, Transaction, BusinessProfile, Product } from "./types";
import type { BackupData } from "./backup";
export interface AppState {
  customers: Customer[];
  transactions: Transaction[];
  products: Product[];
  businessProfile: BusinessProfile;
  language: "en" | "ur";
  theme: "light" | "dark";
  appPin: string | null;
  isLocked: boolean;

  // Language & Theme
  setLanguage: (lang: "en" | "ur") => void;
  toggleLanguage: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;

  // PIN Lock
  setAppPin: (pin: string | null) => void;
  lockApp: () => void;
  unlockApp: (pin: string) => boolean;

  // Business Profile
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;

  // Customers
  addCustomer: (
    customer: (Omit<Customer, "id" | "createdAt"> & { id?: string; createdAt?: string }) | Customer,
    initialTx?: { amount: number; type: "udhaar" | "payment"; description?: string }
  ) => string;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Transactions
  addTransaction: (
    customerIdOrTx: string | Omit<Transaction, "id" | "createdAt">,
    txData?: Omit<Transaction, "id" | "customerId" | "createdAt">
  ) => void;
  deleteTransaction: (id: string) => void;

  // Inventory & Products
  addProduct: (product: Omit<Product, "id" | "createdAt">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, quantityChange: number) => void;

  // System
  clearAllData: () => void;
  restoreFromBackup: (backup: BackupData) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      customers: [],
      transactions: [],
      products: [],
      businessProfile: {
        storeName: "My Store",
        ownerName: "",
        phone: "",
        address: "",
        customMessageEn: "Thank you for your business!",
        customMessageUr: "آپ کے تعاون کا شکریہ!",
      },
      language: "en",
      theme: "light",
      appPin: null,
      isLocked: false,

      setLanguage: (language) => set({ language }),
      toggleLanguage: () =>
        set((state) => ({ language: state.language === "en" ? "ur" : "en" })),

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),

      setAppPin: (appPin) => set({ appPin, isLocked: false }),
      lockApp: () => set({ isLocked: true }),
      unlockApp: (pin) => {
        if (get().appPin === pin) {
          set({ isLocked: false });
          return true;
        }
        return false;
      },

      updateBusinessProfile: (updates) =>
        set((state) => ({
          businessProfile: { ...state.businessProfile, ...updates },
        })),

      addCustomer: (custData, initialTx) => {
        const id = custData.id && custData.id.trim() ? custData.id.trim() : crypto.randomUUID();
        const openingBal = Number(custData.openingBalance || 0);

        const newCustomer: Customer = {
          ...custData,
          id,
          name: custData.name.trim(),
          openingBalance: openingBal > 0 ? openingBal : 0,
          currentBalance:
            typeof custData.currentBalance === "number"
              ? custData.currentBalance
              : (openingBal > 0 ? openingBal : 0),
          totalUdhaar:
            typeof custData.totalUdhaar === "number"
              ? custData.totalUdhaar
              : (openingBal > 0 ? openingBal : 0),
          createdAt: custData.createdAt || new Date().toISOString(),
        };

        const newTxList = [...get().transactions];
        const txAmount = initialTx ? Number(initialTx.amount) : openingBal;
        const shouldCreateInitialTx = initialTx
          ? Number(initialTx.amount) > 0
          : openingBal > 0;

        if (shouldCreateInitialTx) {
          newTxList.unshift({
            id: crypto.randomUUID(),
            customerId: id,
            customerName: newCustomer.name,
            type: initialTx?.type || "udhaar",
            amount: txAmount,
            description:
              initialTx?.description ||
              (get().language === "ur" ? "سابقہ بقایا رقم" : "Opening Balance"),
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            isOpeningBalance: true,
          });
        }

        set((state) => ({
          customers: [newCustomer, ...state.customers],
          transactions: newTxList,
        }));
        return id;
      },

      updateCustomer: (id, updates) =>
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
          transactions: state.transactions.filter((t) => t.customerId !== id),
        })),

      addTransaction: (customerIdOrTx, txData) => {
        let rawTx: Partial<Transaction>;

        if (typeof customerIdOrTx === "string") {
          rawTx = {
            ...txData,
            customerId: customerIdOrTx,
          };
        } else {
          rawTx = { ...customerIdOrTx };
        }

        const trimmedCustomerId = rawTx.customerId?.trim();
        // Prevent creation of transactions with missing or empty customerId
        if (!trimmedCustomerId) {
          console.error("Failed to add transaction: customerId is required and cannot be empty.");
          return;
        }

        // Gracefully resolve customer name from store if not provided
        const matchedCustomer = get().customers.find((c) => c.id === trimmedCustomerId);
        const resolvedCustomerName =
          rawTx.customerName?.trim() ||
          matchedCustomer?.name ||
          (trimmedCustomerId === "CASH_CUSTOMER"
            ? get().language === "ur"
              ? "نقد گاہک"
              : "Cash Customer"
            : get().language === "ur"
            ? "نامعلوم گاہک"
            : "Unknown Customer");

        const newTx: Transaction = {
          id: rawTx.id || crypto.randomUUID(),
          customerId: trimmedCustomerId,
          customerName: resolvedCustomerName,
          type: rawTx.type || "udhaar",
          amount: Number(rawTx.amount || 0),
          items: rawTx.items,
          description: rawTx.description,
          dueDate: rawTx.dueDate,
          date: rawTx.date || new Date().toISOString(),
          createdAt: rawTx.createdAt || new Date().toISOString(),
          isOpeningBalance: rawTx.isOpeningBalance,
        };

        // Deduct inventory stock if line items exist
        let currentProducts = get().products;
        if (newTx.items && newTx.items.length > 0) {
          currentProducts = [...get().products];
          newTx.items.forEach((item) => {
            if (item.productId) {
              const idx = currentProducts.findIndex((p) => p.id === item.productId);
              if (idx !== -1) {
                currentProducts[idx] = {
                  ...currentProducts[idx],
                  stockQuantity: Math.max(0, currentProducts[idx].stockQuantity - item.quantity),
                };
              }
            }
          });
        }

        // Keep customer's currentBalance and totalUdhaar in sync
        const updatedCustomers = get().customers.map((c) => {
          if (c.id !== trimmedCustomerId) return c;
          const currentBal = Number(c.currentBalance ?? c.openingBalance ?? 0);
          const currentTotalUdhaar = Number(c.totalUdhaar ?? c.openingBalance ?? 0);
          const delta = newTx.amount;

          if (newTx.type === "udhaar") {
            return {
              ...c,
              currentBalance: currentBal + delta,
              totalUdhaar: currentTotalUdhaar + delta,
            };
          } else if (newTx.type === "payment") {
            return {
              ...c,
              currentBalance: currentBal - delta,
            };
          }
          return c;
        });

        set((state) => ({
          products: currentProducts,
          customers: updatedCustomers,
          transactions: [newTx, ...state.transactions],
        }));
      },

      deleteTransaction: (id) => {
        const txToDelete = get().transactions.find((t) => t.id === id);
        if (!txToDelete) return;

        const updatedCustomers = get().customers.map((c) => {
          if (c.id !== txToDelete.customerId) return c;
          const currentBal = Number(c.currentBalance ?? c.openingBalance ?? 0);
          const currentTotalUdhaar = Number(c.totalUdhaar ?? c.openingBalance ?? 0);
          const delta = txToDelete.amount;

          if (txToDelete.type === "udhaar") {
            return {
              ...c,
              currentBalance: currentBal - delta,
              totalUdhaar: Math.max(0, currentTotalUdhaar - delta),
            };
          } else if (txToDelete.type === "payment") {
            return {
              ...c,
              currentBalance: currentBal + delta,
            };
          }
          return c;
        });

        set((state) => ({
          customers: updatedCustomers,
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      addProduct: (prodData) => {
        const newProd: Product = {
          ...prodData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ products: [newProd, ...state.products] }));
      },

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      adjustStock: (productId, quantityChange) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + quantityChange) }
              : p
          ),
        })),

      clearAllData: () =>
        set({
          customers: [],
          transactions: [],
          products: [],
          appPin: null,
          isLocked: false,
          language: "en",
          theme: "light",
        }),

      restoreFromBackup: (backup: BackupData) => {
        if (!backup) return;
        set({
          customers: Array.isArray(backup.customers) ? backup.customers : [],
          transactions: Array.isArray(backup.transactions) ? backup.transactions : [],
          products: Array.isArray(backup.products) ? backup.products : [],
          businessProfile: backup.businessProfile || get().businessProfile,
          appPin: backup.appPin ?? null,
        });
      },
    }),
    {
      name: "asaan-udhaar-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useAppStore = useStore;