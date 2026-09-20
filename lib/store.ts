import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Customer, Transaction, BusinessProfile, Language, Theme } from "./types";

interface StoreState {
  language: Language;
  theme: Theme;
  businessProfile: BusinessProfile | null;
  customers: Customer[];
  transactions: Record<string, Transaction[]>; // customerId -> Transaction[]
  
  // Security PIN Lock
  appPin: string | null;
  isLocked: boolean;

  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  addTransaction: (customerId: string, transaction: Transaction) => void;
  deleteTransaction: (customerId: string, transactionId: string) => void;
  
  setAppPin: (pin: string | null) => void;
  unlockApp: (enteredPin: string) => boolean;
  lockApp: () => void;
  
  restoreFromBackup: (backupState: {
    language?: Language;
    theme?: Theme;
    businessProfile?: BusinessProfile | null;
    customers?: Customer[];
    transactions?: Record<string, Transaction[]>;
    appPin?: string | null;
  }) => void;
  clearAllData: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      language: "ur",
      theme: "light",
      businessProfile: {
        storeName: "Asaan Udhaar",
        ownerName: "",
        phone: "",
        address: "",
        logoBase64: "",
      },
      customers: [],
      transactions: {},
      appPin: null,
      isLocked: false,

      toggleLanguage: () =>
        set((state) => ({ language: state.language === "en" ? "ur" : "en" })),

      setLanguage: (language) => set({ language }),

      toggleTheme: () =>
        set((state) => {
          const nextTheme = state.theme === "light" ? "dark" : "light";
          if (typeof document !== "undefined") {
            if (nextTheme === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
          return { theme: nextTheme };
        }),

      setTheme: (theme) => {
        if (typeof document !== "undefined") {
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
        set({ theme });
      },

      updateBusinessProfile: (profile) =>
        set((state) => ({
          businessProfile: state.businessProfile
            ? { ...state.businessProfile, ...profile }
            : {
                storeName: "Asaan Udhaar",
                ...profile,
              },
        })),

      addCustomer: (customer) =>
        set((state) => ({
          customers: [customer, ...state.customers],
        })),

      updateCustomer: (id, updates) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCustomer: (id) =>
        set((state) => {
          const updatedTransactions = { ...state.transactions };
          delete updatedTransactions[id];
          return {
            customers: state.customers.filter((c) => c.id !== id),
            transactions: updatedTransactions,
          };
        }),

      addTransaction: (customerId, transaction) =>
        set((state) => {
          const currentList = state.transactions[customerId] || [];
          return {
            transactions: {
              ...state.transactions,
              [customerId]: [transaction, ...currentList],
            },
          };
        }),

      deleteTransaction: (customerId, transactionId) =>
        set((state) => {
          const currentList = state.transactions[customerId] || [];
          return {
            transactions: {
              ...state.transactions,
              [customerId]: currentList.filter((t) => t.id !== transactionId),
            },
          };
        }),

      setAppPin: (pin) => set({ appPin: pin, isLocked: false }),

      unlockApp: (enteredPin) => {
        const { appPin } = get();
        if (!appPin || appPin === enteredPin) {
          set({ isLocked: false });
          return true;
        }
        return false;
      },

      lockApp: () => {
        const { appPin } = get();
        if (appPin) {
          set({ isLocked: true });
        }
      },

      restoreFromBackup: (backupState) =>
        set({
          language: backupState.language || "ur",
          theme: backupState.theme || "light",
          businessProfile: backupState.businessProfile || null,
          customers: backupState.customers || [],
          transactions: backupState.transactions || {},
          appPin: backupState.appPin || null,
          isLocked: false,
        }),

      clearAllData: () =>
        set({
          customers: [],
          transactions: {},
          appPin: null,
          isLocked: false,
        }),
    }),
    {
      name: "asaan-udhaar-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);