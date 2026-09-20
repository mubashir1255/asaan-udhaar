"use client";

import { useSyncExternalStore, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Languages,
  Moon,
  PieChart,
  Sun,
  Users,
  Wallet,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import {
  formatCurrency,
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

export default function ReportsPage() {
  const hasHydrated = useHydrated();
  const language = useStore((state) => state.language);
  const toggleLanguage = useStore((state) => state.toggleLanguage);
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const customers = useStore((state) => state.customers);
  const transactions = useStore((state) => state.transactions);

  const t = translations[hasHydrated ? language : "ur"];
  const isRTL = hasHydrated ? language === "ur" : true;

  // Flatten and calculate aggregates
  const {
    totalUdhaar,
    totalReceived,
    netOutstanding,
    topDefaulters,
    todayStats,
  } = useMemo(() => {
    if (!hasHydrated) {
      return {
        totalUdhaar: 0,
        totalReceived: 0,
        netOutstanding: 0,
        topDefaulters: [],
        todayStats: { udhaar: 0, received: 0 },
      };
    }

    const allTx: Transaction[] = Object.values(transactions || {}).flat();
    const udhaar = getTotalUdhaar(allTx);
    const received = getTotalReceived(allTx);

    // Today's Date Filter (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTx = allTx.filter((tx) => tx.date.startsWith(todayStr));
    const todayUdhaar = getTotalUdhaar(todayTx);
    const todayReceived = getTotalReceived(todayTx);

    // Calculate balances per customer and pick top 5 who owe the most
    const customerBalances = customers
      .map((c) => {
        const cTx = transactions[c.id] || [];
        const balance = getTotalUdhaar(cTx) - getTotalReceived(cTx);
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          balance,
        };
      })
      .filter((c) => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);

    return {
      totalUdhaar: udhaar,
      totalReceived: received,
      netOutstanding: udhaar - received,
      topDefaulters: customerBalances,
      todayStats: { udhaar: todayUdhaar, received: todayReceived },
    };
  }, [customers, transactions, hasHydrated]);

  // Quick export feature: download CSV summary
  const handleExportCSV = () => {
    if (!customers.length) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Customer Name,Phone,Outstanding Balance (PKR)\n";

    customers.forEach((c) => {
      const cTx = transactions[c.id] || [];
      const balance = getTotalUdhaar(cTx) - getTotalReceived(cTx);
      csvContent += `"${c.name}","${c.phone || ""}","${balance}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Asaan_Udhaar_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 font-sans transition-colors"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-4 transition-colors">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Back"
            >
              <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {language === "ur" ? "کاروباری رپورٹ" : "Business Report"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {language === "ur"
                  ? "کھاتہ کا مجموعی جائزہ اور تفصیلات"
                  : "Overview of your ledger summary"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
              aria-label="Toggle dark mode"
            >
              {hasHydrated && theme === "dark" ? (
                <Sun size={15} className="text-amber-400" />
              ) : (
                <Moon size={15} className="text-slate-600 dark:text-slate-300" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
            >
              <Languages size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>{hasHydrated && language === "en" ? "اردو" : "EN"}</span>
            </button>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition"
            >
              <Download size={15} />
              <span>{language === "ur" ? "ایکسل فائل" : "Export CSV"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Main Financial Health Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs transition-colors">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold mb-4 text-sm">
            <Wallet size={18} />
            <span>
              {language === "ur" ? "مجموعی مالیاتی پوزیشن" : "Overall Financial Position"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.outstanding}</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {hasHydrated ? formatCurrency(netOutstanding) : "Rs 0"}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.creditSales}</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                {hasHydrated ? formatCurrency(totalUdhaar) : "Rs 0"}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.paymentsReceived}</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {hasHydrated ? formatCurrency(totalReceived) : "Rs 0"}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs transition-colors">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <PieChart size={17} className="text-emerald-600 dark:text-emerald-400" />
            <span>{language === "ur" ? "آج کی کارکردگی" : "Today's Activity"}</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/30 p-3.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-1">
                <ArrowUpRight size={16} />
                <span>{language === "ur" ? "آج کا ادھار دیا" : "Udhaar Given Today"}</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(todayStats.udhaar)}
              </p>
            </div>

            <div className="border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
                <ArrowDownLeft size={16} />
                <span>{language === "ur" ? "آج کی وصولی" : "Collected Today"}</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(todayStats.received)}
              </p>
            </div>
          </div>
        </div>

        {/* Top 5 Defaulters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs transition-colors">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Users size={17} className="text-emerald-600 dark:text-emerald-400" />
            <span>
              {language === "ur"
                ? "سب سے زیادہ واجب الادا رقم والے گاہک"
                : "Top 5 Highest Outstanding Balances"}
            </span>
          </h3>

          {topDefaulters.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
              {language === "ur"
                ? "کسی گاہک کی طرف ادھار باقی نہیں ہے"
                : "No outstanding balances currently."}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topDefaulters.map((c, index) => (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-4">
                      {index + 1}.
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.name}</p>
                      {c.phone && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">{c.phone}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(c.balance)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}