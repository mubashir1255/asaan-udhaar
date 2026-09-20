"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Phone,
  MapPin,
  Save,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import type { Customer, Transaction } from "@/lib/types";

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function NewCustomerPage() {
  const router = useRouter();
  const hasHydrated = useHydrated();

  const language = useStore((state) => state.language);
  const addCustomer = useStore((state) => state.addCustomer);
  const addTransaction = useStore((state) => state.addTransaction);

  const t = translations[hasHydrated ? language : "ur"];
  const isRTL = hasHydrated ? language === "ur" : true;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCustomerId = crypto.randomUUID();
    const balanceNum = parseFloat(openingBalance) || 0;

    const newCustomer: Customer = {
      id: newCustomerId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      openingBalance: balanceNum > 0 ? balanceNum : undefined,
      createdAt: new Date().toISOString(),
    };

    addCustomer(newCustomer);

    // If opening balance exists, record it as the initial Udhaar transaction
    if (balanceNum > 0) {
      const initialTx: Transaction = {
        id: crypto.randomUUID(),
        customerId: newCustomerId,
        type: "udhaar",
        amount: balanceNum,
        description:
          language === "ur" ? "سابقہ بقایا رقم" : "Opening Balance",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      addTransaction(newCustomerId, initialTx);
    }

    router.push(`/customers/${newCustomerId}`);
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors p-4"
    >
      <div className="mx-auto max-w-lg">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/customers"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t.addCustomer}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.createKhaata}
              </p>
            </div>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <UserPlus size={20} />
          </span>
        </div>

        {/* Customer Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4"
        >
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              {language === "ur" ? "گاہک کا نام *" : "Customer Name *"}
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={
                language === "ur" ? "مثلاً محمد علی" : "e.g. Muhammad Ali"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Phone size={13} />
              <span>
                {language === "ur"
                  ? "فون نمبر / واٹس ایپ (اختیاری)"
                  : "Phone / WhatsApp (Optional)"}
              </span>
            </label>
            <input
              type="tel"
              placeholder="03001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <MapPin size={13} />
              <span>
                {language === "ur" ? "پتہ / علاقہ (اختیاری)" : "Address / Area (Optional)"}
              </span>
            </label>
            <input
              type="text"
              placeholder={
                language === "ur" ? "مثلاً مین بازار، دکان نمبر 4" : "e.g. Main Bazar, Shop 4"
              }
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Opening Balance */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              {language === "ur"
                ? "سابقہ بقایا رقم / ادھار (اگر کوئی ہو)"
                : "Previous / Opening Balance (Optional)"}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                PKR
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2 pt-2.5"
          >
            <Save size={18} />
            <span>
              {language === "ur" ? "کھاتہ کھولیں (محفوظ کریں)" : "Create Khaata Account"}
            </span>
          </button>
        </form>
      </div>
    </main>
  );
}