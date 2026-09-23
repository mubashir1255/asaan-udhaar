"use client";

import { useSyncExternalStore, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Languages,
  Moon,
  Sun,
  ReceiptText,
  Search,
  Calendar,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { formatCurrency, formatDate, type Transaction } from "@/lib/types";

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

type TypeFilter = "ALL" | "udhaar" | "payment";
type DateFilter = "ALL" | "TODAY" | "WEEK" | "MONTH";

export default function TransactionsPage() {
  const hasHydrated = useHydrated();
  const language = useStore((state) => state.language);
  const toggleLanguage = useStore((state) => state.toggleLanguage);
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const customers = useStore((state) => state.customers);
  const transactions = useStore((state) => state.transactions);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const t = translations[hasHydrated ? language : "ur"];
  const isRTL = hasHydrated ? language === "ur" : true;

  // Flatten transactions and attach customer name
  const allEnrichedTransactions = useMemo(() => {
    if (!hasHydrated) return [];

    const rawTxList: Transaction[] = Array.isArray(transactions)
      ? transactions
      : (Object.values(transactions || {}).flat() as unknown as Transaction[]);

    return rawTxList
      .filter((tx) => Boolean(tx.customerId && tx.customerId.trim()))
      .map((tx) => {
        const customer = customers.find((c) => c.id === tx.customerId);
        const resolvedName =
          customer?.name ||
          tx.customerName ||
          (tx.customerId === "CASH_CUSTOMER"
            ? language === "ur"
              ? "نقد گاہک"
              : "Cash Customer"
            : language === "ur"
            ? "نامعلوم گاہک"
            : "Unknown Customer");
        return {
          ...tx,
          customerName: resolvedName,
          customerPhone: customer?.phone || "",
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customers, transactions, hasHydrated, language]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    return allEnrichedTransactions.filter((tx) => {
      // 1. Type Filter
      if (typeFilter !== "ALL" && tx.type !== typeFilter) {
        return false;
      }

      // 2. Date Filter
      if (dateFilter === "TODAY") {
        if (!tx.date.startsWith(todayStr)) return false;
      } else if (dateFilter === "WEEK") {
        const txDate = new Date(tx.date);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        if (txDate < oneWeekAgo) return false;
      } else if (dateFilter === "MONTH") {
        const txDate = new Date(tx.date);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        if (txDate < oneMonthAgo) return false;
      }

      // 3. Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesName = tx.customerName.toLowerCase().includes(query);
        const matchesPhone = tx.customerPhone.includes(query);
        const matchesDesc = (tx.description || "").toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [allEnrichedTransactions, typeFilter, dateFilter, searchQuery]);

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 font-sans transition-colors"
    >
      {/* Top Header */}
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
                {language === "ur" ? "تمام لین دین (Transactions)" : "All Transactions"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {hasHydrated
                  ? `${filteredTransactions.length} ${
                      language === "ur" ? "ریکارڈز ملے" : "entries found"
                    }`
                  : "..."}
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
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className={`absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 ${
              isRTL ? "right-3.5" : "left-3.5"
            }`}
          />
          <input
            type="text"
            placeholder={
              language === "ur"
                ? "گاہک کے نام، فون یا تفصیل سے تلاش کریں..."
                : "Search by name, phone or items..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition-colors ${
              isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
            }`}
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Type Segment Control */}
          <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl flex-1 transition-colors">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                typeFilter === "ALL"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {language === "ur" ? "سب" : "All"}
            </button>
            <button
              onClick={() => setTypeFilter("udhaar")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                typeFilter === "udhaar"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {language === "ur" ? "+ ادھار دیا" : "+ Udhaar"}
            </button>
            <button
              onClick={() => setTypeFilter("payment")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                typeFilter === "payment"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {language === "ur" ? "− وصولی" : "− Payment"}
            </button>
          </div>

          {/* Date Segment Control */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "ALL", label: language === "ur" ? "ہر وقت" : "All Time" },
              { id: "TODAY", label: language === "ur" ? "آج" : "Today" },
              { id: "WEEK", label: language === "ur" ? "7 دن" : "7 Days" },
              { id: "MONTH", label: language === "ur" ? "30 دن" : "30 Days" },
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setDateFilter(period.id as DateFilter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition flex-shrink-0 ${
                  dateFilter === period.id
                    ? "bg-slate-900 dark:bg-emerald-600 border-slate-900 dark:border-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          {!hasHydrated ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800/60 rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <ReceiptText size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {language === "ur" ? "کوئی لین دین نہیں ملا" : "No transactions found"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === "ur"
                  ? "فلٹر تبدیل کریں یا نیا اندراج ریکارڈ کریں"
                  : "Try clearing filters or search terms"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((tx) => {
                const isUdhaar = tx.type === "udhaar";

                return (
                  <Link
                    key={tx.id}
                    href={
                      tx.customerId === "CASH_CUSTOMER"
                        ? "/transactions"
                        : `/customers/details?id=${tx.customerId}`
                    }
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isUdhaar
                            ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                            : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isUdhaar ? (
                          <ArrowUpRight size={19} />
                        ) : (
                          <ArrowDownLeft size={19} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {tx.customerName}
                          </p>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              isUdhaar
                                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
                                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
                            }`}
                          >
                            {isUdhaar ? t.udhaarGiven : t.paymentReceived}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {tx.description ||
                            (isUdhaar ? t.udhaarGiven : t.paymentReceived)}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(tx.date)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right ml-4 flex-shrink-0">
                      <p
                        className={`text-base font-bold ${
                          isUdhaar
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isUdhaar ? "+" : "−"} {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}