"use client";

import { useState } from "react";
import { X, UserPlus, Phone, MapPin, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import type { Customer } from "@/lib/types";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated?: (customerId: string) => void;
}

export default function AddCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
}: AddCustomerModalProps) {
  const language = useStore((state) => state.language);
  const addCustomer = useStore((state) => state.addCustomer);

  const t = translations[language];
  const isRTL = language === "ur";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // 1. Generate a single UUID upfront
    const customerId = crypto.randomUUID();
    const balanceNum = parseFloat(openingBalance) || 0;

    // 2. Initialize customer with upfront ID and opening balance
    const newCustomer: Customer = {
      id: customerId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      openingBalance: balanceNum > 0 ? balanceNum : 0,
      currentBalance: balanceNum > 0 ? balanceNum : 0,
      totalUdhaar: balanceNum > 0 ? balanceNum : 0,
      createdAt: new Date().toISOString(),
    };

    // 3. Create customer and initial transaction linking exact customerId and customerName
    if (balanceNum > 0) {
      addCustomer(newCustomer, {
        amount: balanceNum,
        type: "udhaar",
        description: language === "ur" ? "سابقہ بقایا رقم" : "Opening Balance",
      });
    } else {
      addCustomer(newCustomer);
    }

    setName("");
    setPhone("");
    setAddress("");
    setOpeningBalance("");

    if (onCustomerCreated) {
      onCustomerCreated(customerId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl transition-all"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <UserPlus size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {t.addCustomer}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.createKhaata}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                language === "ur"
                  ? "مثلاً مین بازار، دکان نمبر 4"
                  : "e.g. Main Bazar, Shop 4"
              }
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

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

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition"
            >
              {language === "ur" ? "منسوخ کریں" : "Cancel"}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Save size={16} />
              <span>
                {language === "ur" ? "محفوظ کریں" : "Save"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
