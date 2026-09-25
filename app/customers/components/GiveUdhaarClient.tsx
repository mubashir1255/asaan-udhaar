"use client";

import { useState, useSyncExternalStore, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  MessageCircle,
  CheckCircle2,
  Calendar,
  FileText,
  Clock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { shareViaWhatsApp } from "@/lib/whatsapp";
import {
  formatCurrency,
  formatDate,
  getCustomerBalance,
  getTotalReceived,
  getTotalUdhaar,
  type Transaction,
} from "@/lib/types";

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function GiveUdhaarClient({ customerId }: { customerId: string }) {
  const router = useRouter();
  const hasHydrated = useHydrated();

  const language = useStore((state) => state.language);
  const businessProfile = useStore((state) => state.businessProfile);
  const customers = useStore((state) => state.customers);
  const transactionsMap = useStore((state) => state.transactions);
  const addTransaction = useStore((state) => state.addTransaction);

  const customer = useMemo(() => {
    if (!hasHydrated) return undefined;
    return customers.find((c) => c.id === customerId);
  }, [customers, customerId, hasHydrated]);

  const customerTxs = useMemo(() => {
    if (!hasHydrated || !customerId) return [];
    return Array.isArray(transactionsMap) ? transactionsMap.filter(t => t.customerId === customerId) : [];
  }, [transactionsMap, customerId, hasHydrated]);

  const t = translations[hasHydrated ? language : "ur"];
  const isRTL = hasHydrated ? language === "ur" : true;

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");

  const [savedTx, setSavedTx] = useState<Transaction | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [modalBalance, setModalBalance] = useState(0);
  const [slipLang, setSlipLang] = useState<"en" | "ur">(language);

  if (!hasHydrated || !customer) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 flex items-center justify-center">
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  const { balance: currentOutstanding } = getCustomerBalance(customer, customerTxs);
  const enteredAmount = parseFloat(amount) || 0;
  const projectedNewBalance = currentOutstanding + enteredAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredAmount || enteredAmount <= 0) return;

    const finalBalance = currentOutstanding + enteredAmount;
    setModalBalance(finalBalance);

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      customerId: customer.id,
      customerName: customer.name,
      type: "udhaar",
      amount: enteredAmount,
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      date: new Date(date).toISOString(),
      createdAt: new Date().toISOString(),
    };

    addTransaction(customer.id, newTx);
    setSavedTx(newTx);
    setShowSlipModal(true);
  };

  const sendWhatsAppSlip = (lang: "en" | "ur") => {
    if (!savedTx) {
      router.push(`/customers/details?id=${customer.id}`);
      return;
    }

    const store = businessProfile?.storeName || "Asaan Udhaar";
    const amountStr = `Rs. ${savedTx.amount.toLocaleString("en-PK")}`;
    const balanceStr = `Rs. ${modalBalance.toLocaleString("en-PK")}`;
    const dateStr = formatDate(savedTx.date);

    let message = "";
    if (lang === "en") {
      message =
        `🧾 *CREDIT ENTRY CONFIRMATION*\n` +
        `🏪 *Store:* ${store}\n` +
        `👤 *Customer:* ${customer.name}\n` +
        `📅 *Date:* ${dateStr}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `➕ *Udhaar Added:* ${amountStr}\n` +
        (savedTx.description ? `📝 *Items/Note:* ${savedTx.description}\n` : "") +
        (savedTx.dueDate ? `⏰ *Promised Date:* ${savedTx.dueDate}\n` : "") +
        `━━━━━━━━━━━━━━━\n` +
        `*Total Outstanding Balance:* ${balanceStr}\n\n` +
        `Thank you for your trust!`;
    } else {
      message =
        `🧾 *ادھار کھاتہ رسید*\n` +
        `🏪 *دکان:* ${store}\n` +
        `👤 *گاہک:* ${customer.name}\n` +
        `📅 *تاریخ:* ${dateStr}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `➕ *نیا ادھار درج:* ${amountStr}\n` +
        (savedTx.description ? `📝 *تفصیل/سامان:* ${savedTx.description}\n` : "") +
        (savedTx.dueDate ? `⏰ *وعدہ تاریخ:* ${savedTx.dueDate}\n` : "") +
        `━━━━━━━━━━━━━━━\n` +
        `*کل واجب الادا بقایا:* ${balanceStr}\n\n` +
        `خریداری کا بہت شکریہ!`;
    }

    shareViaWhatsApp(customer.phone, message);

    router.push(`/customers/details?id=${customer.id}`);
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors p-4"
    >
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/customers/details?id=${customer.id}`}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {language === "ur" ? "ادھار کا اندراج" : "Give Credit (Udhaar)"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {customer.name}
              </p>
            </div>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <ArrowUpRight size={20} />
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              {language === "ur" ? "ادھار کی رقم (روپے) *" : "Udhaar Amount (PKR) *"}
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                step="any"
                autoFocus
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-2xl font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <span className="absolute right-4 top-4 text-xs font-bold text-slate-400">
                PKR
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <FileText size={13} />
              <span>{language === "ur" ? "تفصیل / سامان کا نام" : "Description / Items"}</span>
            </label>
            <input
              type="text"
              placeholder={
                language === "ur" ? "مثلاً 5 بوری سیمنٹ، چینی، وغیرہ" : "e.g. 5 cement bags, sugar, etc."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar size={13} />
              <span>{language === "ur" ? "تاریخ" : "Transaction Date"}</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Clock size={13} className="text-amber-600 dark:text-amber-400" />
              <span>
                {language === "ur"
                  ? "ادائیگی کا وعدہ / آخری تاریخ (اختیاری)"
                  : "Promised Due Date (Optional)"}
              </span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>{language === "ur" ? "موجودہ بقایا:" : "Current Outstanding:"}</span>
              <span>{formatCurrency(currentOutstanding)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 pt-1.5">
              <span>{language === "ur" ? "نیا متوقع بقایا:" : "Projected New Balance:"}</span>
              <span className="text-rose-600 dark:text-rose-400">
                {formatCurrency(projectedNewBalance)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2"
          >
            <ArrowUpRight size={18} />
            <span>{language === "ur" ? "محفوظ کریں (ادھار درج کریں)" : "Save Credit Entry"}</span>
          </button>
        </form>
      </div>

      {showSlipModal && savedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-1">
              <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === "ur" ? "ادھار کامیابی سے درج ہو گیا!" : "Credit Entry Saved!"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {customer.phone
                  ? language === "ur"
                    ? "کیا آپ گاہک کو واٹس ایپ رسید بھیجنا چاہتے ہیں؟"
                    : "Send WhatsApp confirmation slip to customer?"
                  : language === "ur"
                  ? "گاہک کا فون نمبر درج نہیں ہے (واٹس ایپ پر رابطہ منتخب کریں)"
                  : "No phone on file (Pick contact in WhatsApp)"}
              </p>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSlipLang("ur")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  slipLang === "ur" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                اردو رسید (Urdu)
              </button>
              <button
                type="button"
                onClick={() => setSlipLang("en")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  slipLang === "en" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                English Slip
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === "ur" ? "اندراج شدہ رقم:" : "Recorded Amount:"}</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  Rs. {savedTx.amount.toLocaleString("en-PK")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === "ur" ? "کل بقایا رقم:" : "Total Balance Due:"}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Rs. {modalBalance.toLocaleString("en-PK")}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => sendWhatsAppSlip(slipLang)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-xs transition shadow-xs"
              >
                <MessageCircle size={17} />
                <span>{slipLang === "ur" ? "واٹس ایپ پر رسید بھیجیں" : "Send WhatsApp Receipt"}</span>
              </button>

              <button
                onClick={() => router.push(`/customers/details?id=${customer.id}`)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
              >
                {language === "ur" ? "کھاتے پر واپس جائیں" : "Skip / Back to Khaata"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}