"use client";

import { useSyncExternalStore, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  MessageCircle,
  Phone,
  Trash2,
  ReceiptText,
  Languages,
  Moon,
  Sun,
  Printer,
  X,
  Share2,
  Download,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import {
  formatCurrency,
  formatDate,
  getCustomerBalance,
  getTotalReceived,
  getTotalUdhaar,
  exportCustomerLedgerCSV,
  isCustomerOverdue,
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

const EMPTY_LIST: Transaction[] = [];

export default function CustomerDetailsClient({ customerId }: { customerId: string }) {
  const router = useRouter();
  const hasHydrated = useHydrated();

  const language = useStore((state) => state.language);
  const toggleLanguage = useStore((state) => state.toggleLanguage);
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const businessProfile = useStore((state) => state.businessProfile);
  const customers = useStore((state) => state.customers);
  const transactionsMap = useStore((state) => state.transactions);
  const deleteCustomer = useStore((state) => state.deleteCustomer);

  // Modal states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [slipLang, setSlipLang] = useState<"en" | "ur">("ur");

  const customer = useMemo(() => {
    if (!hasHydrated) return undefined;
    return customers.find((c) => c.id === customerId);
  }, [customers, customerId, hasHydrated]);

  const transactions = useMemo(() => {
    if (!hasHydrated || !customerId) return EMPTY_LIST;
    return Array.isArray(transactionsMap)
      ? transactionsMap.filter((t) => t.customerId === customerId)
      : EMPTY_LIST;
  }, [transactionsMap, customerId, hasHydrated]);

  const t = translations[hasHydrated ? language : "ur"];
  const isRTL = hasHydrated ? language === "ur" : true;

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-48 mb-6" />
        <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <p className="text-slate-600 dark:text-slate-300 font-semibold mb-4">
          {language === "ur" ? "گاہک نہیں ملا" : "Customer not found"}
        </p>
        <Link
          href="/customers"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-xl"
        >
          {t.viewAll}
        </Link>
      </div>
    );
  }

  const { totalUdhaar, totalReceived, balance: outstanding } =
    getCustomerBalance(customer, transactions);
  const isOverdue = isCustomerOverdue(transactions, outstanding);

  const sendWhatsAppReminder = () => {
    let cleanPhone = (customer.phone || "").replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "92" + cleanPhone.slice(1);
    }

    const template =
      language === "en"
        ? businessProfile?.customMessageEn ||
          "Dear {customer}, your outstanding balance at {store} is Rs. {amount}. Please clear your dues at your convenience. Thank you!"
        : businessProfile?.customMessageUr ||
          "محترم {customer} صاحب، آپ کے کھاتے کا بقایا ادھار Rs. {amount} ہے۔ برائے مہربانی سہولت کے مطابق ادائیگی فرما دیں۔ شکریہ! — {store}";

    const message = template
      .replace(/\{customer\}/g, customer.name)
      .replace(/\{amount\}/g, outstanding.toLocaleString("en-PK"))
      .replace(
        /\{store\}/g,
        businessProfile?.storeName || (language === "en" ? "Our Store" : "ہماری دکان")
      );

    const encoded = encodeURIComponent(message);
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
    }
  };

  const sendTransactionSlip = (tx: Transaction, lang: "en" | "ur") => {
    let cleanPhone = (customer.phone || "").replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "92" + cleanPhone.slice(1);
    }

    const store = businessProfile?.storeName || "Asaan Udhaar";
    const amountStr = `Rs. ${tx.amount.toLocaleString("en-PK")}`;
    const balanceStr = `Rs. ${outstanding.toLocaleString("en-PK")}`;
    const dateStr = formatDate(tx.date);

    let message = "";
    if (lang === "en") {
      let itemsList = "";
      if (tx.items && tx.items.length > 0) {
        itemsList =
          `\n📦 *Purchased Items:*\n` +
          tx.items
            .map(
              (item, i) =>
                `${i + 1}. ${item.name} (${item.quantity}x @ Rs ${item.unitPrice}) = Rs ${item.total}`
            )
            .join("\n") +
          `\n`;
      }

      message =
        `🧾 *TRANSACTION RECEIPT*\n` +
        `🏪 *Store:* ${store}\n` +
        `👤 *Customer:* ${customer.name}\n` +
        `📅 *Date:* ${dateStr}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `📌 *Type:* ${
          tx.type === "udhaar"
            ? "Credit (Udhaar Given)"
            : tx.type === "sale"
            ? "Cash Sale (POS)"
            : "Payment Received"
        }\n` +
        itemsList +
        `💵 *Amount:* ${amountStr}\n` +
        (tx.description ? `📝 *Note:* ${tx.description}\n` : "") +
        (tx.dueDate ? `⏰ *Promised Date:* ${tx.dueDate}\n` : "") +
        `━━━━━━━━━━━━━━━\n` +
        `*Net Outstanding Balance:* ${balanceStr}\n\n` +
        `Thank you for doing business with us!`;
    } else {
      let itemsList = "";
      if (tx.items && tx.items.length > 0) {
        itemsList =
          `\n📦 *اشیاء کی تفصیل:*\n` +
          tx.items
            .map(
              (item, i) =>
                `${i + 1}۔ ${item.name} (${item.quantity}x فی ریٹ Rs ${item.unitPrice}) = Rs ${item.total}`
            )
            .join("\n") +
          `\n`;
      }

      message =
        `🧾 *کھاتہ رسید*\n` +
        `🏪 *دکان:* ${store}\n` +
        `👤 *گاہک:* ${customer.name}\n` +
        `📅 *تاریخ:* ${dateStr}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `📌 *تفصیل:* ${
          tx.type === "udhaar"
            ? "ادھار دیا گیا (+)"
            : tx.type === "sale"
            ? "کیش سیل (+)"
            : "رقم وصول ہوئی (–)"
        }\n` +
        itemsList +
        `💵 *رقم:* ${amountStr}\n` +
        (tx.description ? `📝 *نوٹ:* ${tx.description}\n` : "") +
        (tx.dueDate ? `⏰ *وعدہ تاریخ:* ${tx.dueDate}\n` : "") +
        `━━━━━━━━━━━━━━━\n` +
        `*کل واجب الادا بقایا ادھار:* ${balanceStr}\n\n` +
        `ہم سے خریداری کرنے کا شکریہ!`;
    }

    const encoded = encodeURIComponent(message);
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
    }
    setShowSlipModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = () => {
    if (window.confirm(t.deleteConfirm(customer.name))) {
      deleteCustomer(customer.id);
      router.push("/customers");
    }
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 font-sans transition-colors"
    >
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3 transition-colors">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/customers"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Back"
            >
              <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {customer.name}
                </h1>
                {isOverdue && (
                  <span className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                    <AlertCircle size={10} />
                    <span>{language === "ur" ? "وعدہ ختم" : "Overdue"}</span>
                  </span>
                )}
              </div>
              {customer.phone && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone size={10} />
                  {customer.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => exportCustomerLedgerCSV(customer.name, transactions)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
              title={language === "ur" ? "اسٹیٹمنٹ ڈاؤن لوڈ کریں" : "Export CSV Statement"}
            >
              <Download size={16} />
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
              title="Print Thermal Receipt"
            >
              <Printer size={16} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
            >
              {hasHydrated && theme === "dark" ? (
                <Sun size={15} className="text-amber-400" />
              ) : (
                <Moon size={15} className="text-slate-600 dark:text-slate-300" />
              )}
            </button>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
            >
              <Languages size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>{hasHydrated && language === "en" ? "اردو" : "EN"}</span>
            </button>

            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition"
              aria-label="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4">
        <div className="bg-emerald-800 text-white rounded-2xl p-5 shadow-xs">
          <p className="text-emerald-200 text-xs font-medium uppercase tracking-wider">
            {t.outstanding}
          </p>
          <h2 className="text-3xl font-black mt-1">
            Rs. {outstanding.toLocaleString("en-PK")}
          </h2>

          <div className="mt-4 pt-3 border-t border-emerald-700/60 flex justify-between text-xs text-emerald-100">
            <span>{t.creditSales}: Rs. {totalUdhaar.toLocaleString("en-PK")}</span>
            <span>{t.paymentsReceived}: Rs. {totalReceived.toLocaleString("en-PK")}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/customers/udhaar?id=${customerId}`}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition text-sm"
          >
            <ArrowUpRight size={18} />
            <span>{t.giveUdhaar}</span>
          </Link>

          <Link
            href={`/customers/payment?id=${customerId}`}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition text-sm"
          >
            <ArrowDownLeft size={18} />
            <span>{t.recordPayment}</span>
          </Link>
        </div>

        <div className="flex gap-2">
          {outstanding > 0 && (
            <button
              onClick={sendWhatsAppReminder}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold py-2.5 px-3 rounded-xl shadow-2xs transition text-xs"
            >
              <MessageCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t.whatsappReminder}</span>
            </button>
          )}

          <button
            onClick={() => exportCustomerLedgerCSV(customer.name, transactions)}
            className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold py-2.5 px-3 rounded-xl shadow-2xs transition text-xs"
          >
            <Download size={15} className="text-blue-600" />
            <span>{language === "ur" ? "اسٹیٹمنٹ" : "Statement"}</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold py-2.5 px-3.5 rounded-xl shadow-2xs transition text-xs"
          >
            <Printer size={15} />
            <span>{language === "ur" ? "رسید" : "Receipt"}</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {t.recentActivity}
            </h3>
            <span className="text-xs text-slate-400">
              {transactions.length} {language === "ur" ? "اندراج" : "records"}
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-10 text-center px-4">
              <ReceiptText size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 dark:text-slate-500">{t.noActivity}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((tx: Transaction) => {
                const isUdhaar = tx.type === "udhaar" || tx.type === "sale";
                const hasItems = tx.items && tx.items.length > 0;

                return (
                  <div
                    key={tx.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isUdhaar
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isUdhaar ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {tx.description ||
                                (tx.type === "sale"
                                  ? "کیش بل (POS Sale)"
                                  : isUdhaar
                                  ? t.udhaarGiven
                                  : t.paymentReceived)}
                            </p>
                            {hasItems && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                                <ShoppingBag size={10} />
                                <span>{tx.items?.length} items</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                            <span>{formatDate(tx.date)}</span>
                            {tx.dueDate && (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                • {language === "ur" ? "وعدہ:" : "Due:"} {tx.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <p
                          className={`text-sm font-bold ${
                            isUdhaar
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isUdhaar ? "+" : "−"} {formatCurrency(tx.amount)}
                        </p>

                        <button
                          onClick={() => {
                            setSelectedTx(tx);
                            setShowSlipModal(true);
                          }}
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                          title="Send WhatsApp Slip"
                        >
                          <Share2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Itemized Line Items Preview */}
                    {hasItems && (
                      <div className="ml-12 pl-2 border-l-2 border-slate-100 dark:border-slate-800 space-y-1 pt-1">
                        {tx.items?.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400"
                          >
                            <span>
                              {item.name} &times; <strong>{item.quantity}</strong>
                            </span>
                            <span className="font-mono">Rs {item.total.toLocaleString("en-PK")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Slip Modal */}
      {showSlipModal && selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {language === "ur" ? "واٹس ایپ رسید بھیجیں" : "Send WhatsApp Slip"}
              </h3>
              <button onClick={() => setShowSlipModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSlipLang("ur")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  slipLang === "ur" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                اردو رسید (Urdu)
              </button>
              <button
                type="button"
                onClick={() => setSlipLang("en")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  slipLang === "en" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                English Slip
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 max-h-56 overflow-y-auto">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{slipLang === "ur" ? "گاہک:" : "Customer:"}</span>
                <span className="font-semibold">{customer.name}</span>
              </div>

              {selectedTx.items && selectedTx.items.length > 0 && (
                <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
                  <div className="font-semibold mb-1 text-[11px] text-slate-500">
                    {slipLang === "ur" ? "اشیاء کی فہرست:" : "Items Breakdown:"}
                  </div>
                  {selectedTx.items.map((item, i) => (
                    <div key={item.id || i} className="flex justify-between text-[11px]">
                      <span>{item.name} ({item.quantity}x)</span>
                      <span>Rs {item.total}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">{slipLang === "ur" ? "رقم:" : "Bill Amount:"}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Rs. {selectedTx.amount.toLocaleString("en-PK")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{slipLang === "ur" ? "کل بقایا:" : "Net Balance:"}</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  Rs. {outstanding.toLocaleString("en-PK")}
                </span>
              </div>
            </div>

            <button
              onClick={() => sendTransactionSlip(selectedTx, slipLang)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition"
            >
              <MessageCircle size={16} />
              <span>{slipLang === "ur" ? "واٹس ایپ پر بھیجیں" : "Open WhatsApp"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Thermal Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Printer size={16} className="text-emerald-600" />
                <span>{language === "ur" ? "تھرمل رسید پرنٹ" : "Thermal Receipt Print"}</span>
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div
              id="thermal-receipt"
              className="border border-dashed border-slate-300 dark:border-slate-700 p-4 bg-white text-black font-mono text-[11px] leading-tight rounded-lg shadow-inner mx-auto w-full max-w-[260px]"
            >
              <div className="text-center space-y-1 mb-2">
                {businessProfile?.logoBase64 && (
                  <img
                    src={businessProfile.logoBase64}
                    alt="Logo"
                    className="h-9 w-9 mx-auto object-cover rounded-md mb-1"
                  />
                )}
                <p className="font-bold text-sm tracking-tight">
                  {businessProfile?.storeName || "ASAAN UDHAAR"}
                </p>
                {businessProfile?.ownerName && <p className="text-[10px]">Prop: {businessProfile.ownerName}</p>}
                {businessProfile?.phone && <p className="text-[10px]">Tel: {businessProfile.phone}</p>}
                {businessProfile?.address && <p className="text-[10px]">{businessProfile.address}</p>}
              </div>

              <div className="border-t border-b border-dashed border-black py-1.5 my-2 space-y-0.5">
                <p><strong>Date:</strong> {new Date().toLocaleDateString("en-PK")}</p>
                <p><strong>Customer:</strong> {customer.name}</p>
                {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
              </div>

              <div className="space-y-1 my-2">
                <div className="flex justify-between font-bold border-b border-black pb-1">
                  <span>Item / Type</span>
                  <span>Total</span>
                </div>
                {transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="text-[10px] py-0.5 border-b border-slate-100">
                    <div className="flex justify-between font-semibold">
                      <span className="truncate max-w-[150px]">
                        {tx.type === "udhaar" ? "+ Udhaar" : tx.type === "sale" ? "+ Sale" : "- Paid"} ({formatDate(tx.date)})
                      </span>
                      <span>Rs {tx.amount.toLocaleString("en-PK")}</span>
                    </div>
                    {tx.items && tx.items.length > 0 && (
                      <div className="pl-1 text-[9px] text-slate-600">
                        {tx.items.map((it, i) => (
                          <div key={i} className="flex justify-between">
                            <span>- {it.name} x{it.quantity}</span>
                            <span>{it.total}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-black pt-2 my-2 space-y-1 font-bold text-xs">
                <div className="flex justify-between">
                  <span>Total Udhaar:</span>
                  <span>Rs {totalUdhaar.toLocaleString("en-PK")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid:</span>
                  <span>Rs {totalReceived.toLocaleString("en-PK")}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-black pt-1">
                  <span>BALANCE DUE:</span>
                  <span>Rs {outstanding.toLocaleString("en-PK")}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px] border-t border-dashed border-black">
                <p>شکریہ! برائے مہربانی رسید سنبھال کر رکھیں</p>
                <p>Powered by Asaan Udhaar</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition shadow-xs"
              >
                <Printer size={15} />
                <span>{language === "ur" ? "پرنٹر پر بھیجیں" : "Print Receipt"}</span>
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {language === "ur" ? "بند کریں" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}