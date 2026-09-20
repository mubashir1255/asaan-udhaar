"use client";

import { useState, useSyncExternalStore, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  CirclePlus,
  Phone,
  Search,
  Users,
  AlertCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import {
  formatCurrency,
  getTotalReceived,
  getTotalUdhaar,
  isCustomerOverdue,
} from "@/lib/types";

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function CustomersPage() {
  const hasHydrated = useHydrated();
  const language = useStore((state) => state.language);
  const customers = useStore((state) => state.customers);
  const transactionsMap = useStore((state) => state.transactions);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "balance" | "overdue">("all");

  const t = translations[hasHydrated ? language : "ur"];
  const isRTL = hasHydrated ? language === "ur" : true;

  const enrichedCustomers = useMemo(() => {
    if (!hasHydrated) return [];

    return customers.map((customer) => {
      const txs = transactionsMap[customer.id] || [];
      const totalUdhaar = getTotalUdhaar(txs);
      const totalReceived = getTotalReceived(txs);
      const outstanding = totalUdhaar - totalReceived;
      const isOverdue = isCustomerOverdue(txs, outstanding);

      return {
        ...customer,
        outstanding,
        isOverdue,
      };
    });
  }, [customers, transactionsMap, hasHydrated]);

  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search));

      if (!matchesSearch) return false;

      if (filter === "balance") return c.outstanding > 0;
      if (filter === "overdue") return c.isOverdue;
      return true;
    });
  }, [enrichedCustomers, search, filter]);

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 font-sans transition-colors"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3.5 transition-colors">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
            </Link>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.nav.customers} ({hasHydrated ? customers.length : 0})
            </h1>
          </div>

          <Link
            href="/customers/new"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition"
          >
            <CirclePlus size={16} />
            <span>{t.addCustomer}</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4 space-y-3.5">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder={
              language === "ur" ? "نام یا فون نمبر تلاش کریں..." : "Search customer name or phone..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 pl-10 rtl:pl-4 rtl:pr-10 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
          <Search
            size={17}
            className={`absolute top-3 text-slate-400 ${
              isRTL ? "right-3.5" : "left-3.5"
            }`}
          />
        </div>

        {/* Filter Pills (Feature #3) */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              filter === "all"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            {language === "ur" ? "تمام گاہک" : "All"} ({customers.length})
          </button>
          <button
            onClick={() => setFilter("balance")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              filter === "balance"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            {language === "ur" ? "بقایا ادھار والے" : "With Balance"}
          </button>
          <button
            onClick={() => setFilter("overdue")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1 ${
              filter === "overdue"
                ? "bg-rose-600 text-white shadow-2xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400"
            }`}
          >
            <AlertCircle size={13} />
            <span>{language === "ur" ? "وعدہ ختم" : "Overdue"}</span>
          </button>
        </div>

        {/* Customer List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden transition-colors">
          {!hasHydrated ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center px-4">
              <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "ur" ? "کوئی گاہک نہیں ملا" : "No customers found"}
              </p>
            </div>
          ) : (
            filteredCustomers.map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {c.name}
                    </h3>
                    {c.isOverdue && (
                      <span className="inline-flex items-center gap-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                        <AlertCircle size={10} />
                        <span>{language === "ur" ? "وعدہ ختم" : "Overdue"}</span>
                      </span>
                    )}
                  </div>
                  {c.phone && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone size={11} />
                      {c.phone}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        c.outstanding > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {formatCurrency(c.outstanding)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {c.outstanding > 0
                        ? language === "ur"
                          ? "لینا ہے"
                          : "To Receive"
                        : language === "ur"
                        ? "صاف"
                        : "Settled"}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-slate-400 ${isRTL ? "rotate-180" : ""}`}
                  />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}