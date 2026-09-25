"use client";

import { useSyncExternalStore, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CirclePlus,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
  Sun,
  Moon,
  Languages,
  Smile,
  ShoppingCart,
  Package,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTodayQuote } from "@/lib/quotes";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import {
  formatCurrency,
  formatDate,
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

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Home() {
  const pathname = usePathname() || "/";
  const hasHydrated = useHydrated();
  const language = useStore((state) => state.language);
  const toggleLanguage = useStore((state) => state.toggleLanguage);
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const customers = useStore((state) => state.customers);
  const transactions = useStore((state) => state.transactions);
  const products = useStore((state) => state.products || []);

  const todayQuote = useMemo(() => getTodayQuote(), []);

  const t = translations[hasHydrated ? language : "ur"];
  const isRTL = hasHydrated ? language === "ur" : true;

  const allTransactions: Transaction[] = hasHydrated
    ? Array.isArray(transactions)
      ? (transactions as Transaction[])
      : (Object.values(transactions || {}).flat() as Transaction[])
    : [];

  const extraOpeningUdhaar = hasHydrated
    ? (customers || [])
        .filter(
          (c) =>
            Number(c.openingBalance || 0) > 0 &&
            !allTransactions.some(
              (t) =>
                t.customerId === c.id &&
                (t.isOpeningBalance ||
                  t.description === "Opening Balance" ||
                  t.description === "سابقہ بقایا رقم")
            )
        )
        .reduce((sum, c) => sum + Number(c.openingBalance || 0), 0)
    : 0;

  const totalUdhaar = getTotalUdhaar(allTransactions) + extraOpeningUdhaar;
  
  // Includes both customer debt payments and direct cash POS sales:
  const totalReceived = allTransactions
    .filter((t) => t.type === "payment" || t.type === "sale")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Outstanding only tracks unpaid customer udhaar:
  const customerPayments = getTotalReceived(allTransactions);
  const outstanding = Math.max(0, totalUdhaar - customerPayments);

  const customerCount = hasHydrated ? (customers?.length || 0) : 0;

  // Low stock calculation
  const lowStockProducts = useMemo(() => {
    if (!hasHydrated) return [];
    return products.filter((p) => p.stockQuantity <= 5);
  }, [products, hasHydrated]);

  const recentActivity = hasHydrated
    ? allTransactions
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
          };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
    : [];

  const navigation = [
    { label: t.nav.dashboard, icon: LayoutDashboard, href: "/" },
    { label: t.nav.customers, icon: Users, href: "/customers" },
    { label: "POS Billing", icon: ShoppingCart, href: "/pos" },
    { label: "Inventory", icon: Package, href: "/inventory" },
    { label: t.nav.transactions, icon: ReceiptText, href: "/transactions" },
    { label: t.nav.reports, icon: WalletCards, href: "/reports" },
    { label: t.nav.settings, icon: Settings, href: "/settings" },
  ];

  // Compact mobile tabs — Reports/Transactions share one entry to fit 6 slots
  const mobileNavigation = [
    { label: t.nav.dashboard, icon: LayoutDashboard, href: "/" },
    { label: t.nav.customers, icon: Users, href: "/customers" },
    { label: "POS", icon: ShoppingCart, href: "/pos" },
    { label: "Inventory", icon: Package, href: "/inventory" },
    { label: language === "en" ? "Reports" : t.nav.transactions, icon: ReceiptText, href: "/transactions" },
    { label: t.nav.settings, icon: Settings, href: "/settings" },
  ];

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors"
    >
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 hidden w-64 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:flex lg:flex-col transition-colors ${
          isRTL ? "right-0 border-l" : "left-0 border-r"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-6">
          <img
            src="/logo.png"
            alt="Asaan Udhaar"
            className="h-10 w-10 rounded-xl object-cover shadow-xs"
          />
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-800 dark:text-slate-100">
              {t.appName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.appTagline}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Shop Account</p>
            <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">My Business</p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Asaan Udhaar</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={isRTL ? "lg:pr-64" : "lg:pl-64"}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur transition-colors">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="lg:hidden flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Asaan Udhaar"
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.appName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.appTagline}</p>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
                aria-label="Toggle dark mode"
              >
                {hasHydrated && theme === "dark" ? (
                  <Sun size={16} className="text-amber-400" />
                ) : (
                  <Moon size={16} className="text-slate-600 dark:text-slate-300" />
                )}
              </button>

              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
              >
                <Languages size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>{hasHydrated && language === "en" ? "اردو" : "English"}</span>
              </button>

              <img
                src="/logo.png"
                alt="Profile"
                className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <section className="px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            {/* Welcoming Banner with Smiley & Daily Quranic Reminder */}
            <div className="mb-6 rounded-2xl border border-emerald-100 dark:border-emerald-950/80 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-2xs transition-all">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <Smile size={26} className="stroke-[2.2]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {hasHydrated && language === "en"
                        ? "Welcome! Have a Blessed Day"
                        : "خوش آمدید! آپ کا دن مبارک ہو"}
                    </h2>
                    <span className="text-base">😊</span>
                  </div>

                  {/* Arabic Ayah */}
                  <p className="mt-1.5 font-serif text-sm font-semibold text-emerald-800 dark:text-emerald-400 tracking-wide">
                    &quot;{todayQuote.ar}&quot;
                  </p>

                  {/* Bilingual Translation & Reference */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-600 dark:text-slate-300">
                    <span>
                      {hasHydrated && language === "en" ? todayQuote.en : todayQuote.ur}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      ({todayQuote.reference})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Warning Banner */}
            {lowStockProducts.length > 0 && (
              <div className="mb-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 p-4 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-200 truncate">
                        {language === "en"
                          ? `Low Stock Warning (${lowStockProducts.length} items)`
                          : `کم اسٹاک کی اطلاع (${lowStockProducts.length} اشیاء)`}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                        {language === "en"
                          ? `${lowStockProducts.map((p) => p.name).slice(0, 3).join(", ")}${lowStockProducts.length > 3 ? "..." : ""} running out of stock.`
                          : `${lowStockProducts.map((p) => p.name).slice(0, 3).join("، ")}${lowStockProducts.length > 3 ? "..." : ""} کی مقدار 5 یا اس سے کم ہے۔`}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/inventory"
                    className="shrink-0 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    {language === "en" ? "Restock" : "اسٹاک بڑھائیں"}
                  </Link>
                </div>
              </div>
            )}

            {/* Quick POS & Inventory Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Link
                href="/pos"
                className="flex items-center gap-3 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-sm transition"
              >
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <ShoppingCart size={22} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">POS Billing</div>
                  <div className="text-[11px] text-emerald-100">Quick counter sales</div>
                </div>
              </Link>

              <Link
                href="/inventory"
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition"
              >
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl">
                  <Package size={22} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">Inventory</div>
                  <div className="text-[11px] text-slate-400">Stock & pricing</div>
                </div>
              </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title={t.outstanding}
                value={hasHydrated ? formatCurrency(outstanding) : "Rs 0"}
                description={t.outstandingDesc}
                icon={<ArrowUpRight size={20} />}
                color={outstanding > 0 ? "emerald" : "slate"}
                isLoading={!hasHydrated}
              />
              <SummaryCard
                title={t.creditSales}
                value={hasHydrated ? formatCurrency(totalUdhaar) : "Rs 0"}
                description={t.creditSalesDesc}
                icon={<WalletCards size={20} />}
                color="blue"
                isLoading={!hasHydrated}
              />
              <SummaryCard
                title={t.paymentsReceived}
                value={hasHydrated ? formatCurrency(totalReceived) : "Rs 0"}
                description={t.paymentsReceivedDesc}
                icon={<ArrowDownLeft size={20} />}
                color="emerald"
                isLoading={!hasHydrated}
              />
              <SummaryCard
                title={t.customers}
                value={hasHydrated ? customerCount.toString() : "0"}
                description={t.customersDesc}
                icon={<Users size={20} />}
                color="purple"
                isLoading={!hasHydrated}
              />
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <div className="mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t.quickActions}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.quickActionsDesc}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/customers/new"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-left shadow-2xs transition hover:border-emerald-300 dark:hover:border-emerald-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <CirclePlus size={22} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{t.addCustomer}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.createKhaata}</p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={`text-slate-400 ${isRTL ? "rotate-180" : ""}`}
                  />
                </Link>

                <Link
                  href="/customers"
                  className="flex items-center justify-between rounded-2xl bg-emerald-600 hover:bg-emerald-700 p-4 text-left text-white shadow-2xs transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                      <CirclePlus size={22} />
                    </div>
                    <div>
                      <p className="font-semibold">{t.addUdhaar}</p>
                      <p className="text-xs text-emerald-100">
                        {t.selectCustomerFirst}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={`text-emerald-100 ${isRTL ? "rotate-180" : ""}`}
                  />
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t.recentActivity}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {t.recentActivitySubtitle}
                  </p>
                </div>
                <Link
                  href="/customers"
                  className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t.viewAll}
                </Link>
              </div>

              {!hasHydrated ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="flex items-center justify-between p-4 animate-pulse"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                          <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800/60" />
                        </div>
                      </div>
                      <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-5 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <ReceiptText size={22} />
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t.noActivity}</h4>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {t.noActivityDesc}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentActivity.map((activity) => {
                    const isUdhaar = activity.type === "udhaar";

                    return (
                      <Link
                        key={activity.id}
                        href={
                          activity.customerId === "CASH_CUSTOMER"
                            ? "/transactions"
                            : `/customers/details?id=${activity.customerId}`
                        }
                        className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${
                              isUdhaar
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {isUdhaar ? (
                              <ArrowUpRight size={20} />
                            ) : (
                              <ArrowDownLeft size={20} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {activity.customerName}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  isUdhaar
                                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
                                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
                                }`}
                              >
                                {isUdhaar ? t.udhaarGiven : t.paymentReceived}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                              {activity.description ||
                                (isUdhaar ? t.udhaarGiven : t.paymentReceived)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                              {formatDate(activity.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p
                            className={`font-semibold text-base sm:text-lg ${
                              isUdhaar ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {isUdhaar ? "+" : "−"}
                            {formatCurrency(activity.amount)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur lg:hidden safe-area-pb">
          <div className="grid grid-cols-6">
            {mobileNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = isNavActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 px-0.5 py-2.5 min-w-0 text-[9px] sm:text-[10px] font-medium transition ${
                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="truncate max-w-full leading-tight text-center">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  color,
  isLoading = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "purple" | "slate";
  isLoading?: boolean;
}) {
  const colorClasses = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400",
    slate: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : (
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}