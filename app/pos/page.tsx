"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Product, LineItem } from "@/lib/types";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  TrendingUp,
  Banknote,
  UserCheck,
  Package,
  X,
  CheckCircle2,
} from "lucide-react";

export default function PosPage() {
  const router = useRouter();
  const {
    products = [],
    customers = [],
    adjustStock,
    addTransaction,
    language = "en",
  } = useStore();

  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    Promise.resolve().then(() => setHasHydrated(true));
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<LineItem[]>([]);

  // Checkout modal states
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"cash" | "udhaar">("cash");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saleSuccess, setSaleSuccess] = useState(false);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        return prevCart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: newQty,
                total: newQty * item.unitPrice,
                profit: (item.unitPrice - item.costPrice) * newQty,
              }
            : item
        );
      } else {
        const lineItem: LineItem = {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          productId: product.id,
          name: product.name,
          quantity: 1,
          costPrice: product.costPrice || 0,
          unitPrice: product.salePrice,
          total: product.salePrice,
          profit: (product.salePrice - (product.costPrice || 0)) * 1,
        };
        return [...prevCart, lineItem];
      }
    });
  };

  const updateQuantity = (productId: string | undefined, delta: number) => {
    if (!productId) return;
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice,
              profit: (item.unitPrice - item.costPrice) * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as LineItem[]
    );
  };

  const removeFromCart = (productId: string | undefined) => {
    if (!productId) return;
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setCart([]);

  // Cart totals
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.total, 0),
    [cart]
  );
  const totalProfit = useMemo(
    () => cart.reduce((sum, item) => sum + item.profit, 0),
    [cart]
  );
  const totalItemsCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Search filter
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch))
    );
  }, [customers, customerSearch]);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (paymentMode === "udhaar" && !selectedCustomerId) {
      alert("Please select a customer for Udhaar credit");
      return;
    }

    const txDate = new Date().toISOString();

    // 1. Add transaction
    const selectedCustomerObj = customers.find((c) => c.id === selectedCustomerId);
    addTransaction({
      customerId: paymentMode === "udhaar" ? selectedCustomerId : "CASH_CUSTOMER",
      customerName:
        paymentMode === "udhaar"
          ? selectedCustomerObj?.name
          : language === "ur"
          ? "نقد گاہک"
          : "Cash Customer",
      type: paymentMode === "udhaar" ? "udhaar" : "sale",
      amount: subtotal,
      items: cart,
      description: description.trim() || (paymentMode === "cash" ? "Cash POS Sale" : "Itemized Udhaar Sale"),
      dueDate: paymentMode === "udhaar" && dueDate ? dueDate : undefined,
      date: txDate,
    });

// 2. Adjust stock

    setSaleSuccess(true);
    setTimeout(() => {
      setSaleSuccess(false);
      setIsCheckoutModalOpen(false);
      clearCart();
      if (paymentMode === "udhaar") {
        router.push(`/customers/details?id=${selectedCustomerId}`);
      }
    }, 1200);
  };

  if (!hasHydrated) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-48 mb-6" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-bold">POS Billing</h1>
              <p className="text-xs text-slate-500">Quick itemized register</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/inventory"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Manage Items
            </Link>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column: Catalog / Product Picker */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search items by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <Package size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {searchQuery ? "No matching products found" : "No products available in inventory"}
              </p>
              <Link
                href="/inventory"
                className="inline-block mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
              >
                Add Items in Inventory
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredProducts.map((p) => {
                const inCart = cart.find((c) => c.productId === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                      inCart
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50"
                        : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm line-clamp-1">{p.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Stock: {p.stockQuantity} {p.unit || "pcs"}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                        Rs {p.salePrice}
                      </span>
                      {inCart && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Cart Breakdown & Checkout */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sticky top-20 flex flex-col h-full space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm">Active Cart ({totalItemsCount})</h3>
              </div>
              {totalProfit > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  <TrendingUp size={12} /> +Rs {totalProfit} profit
                </span>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto max-h-72 space-y-2.5 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Cart is empty. Tap products to add them.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Rs {item.unitPrice} &times; {item.quantity}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* NEW: Customer / Udhaar Selector */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Bill To (Customer / Khaata)
                </span>
                {selectedCustomerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId("");
                      setPaymentMode("cash");
                    }}
                    className="text-[11px] font-semibold text-rose-500 hover:underline"
                  >
                    Switch to Cash
                  </button>
                )}
              </div>

              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  const custId = e.target.value;
                  setSelectedCustomerId(custId);
                  if (custId) {
                    setPaymentMode("udhaar");
                  } else {
                    setPaymentMode("cash");
                  }
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition ${
                  selectedCustomerId
                    ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-400 text-rose-800 dark:text-rose-200"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                <option value="">🛒 Cash Customer (نقد گاہک)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    👤 {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>

              {selectedCustomerId && (
                <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  ✓ This bill will be charged to this customer&apos;s Udhaar Khaata.
                </p>
              )}
            </div>

            {/* Totals & Checkout Button */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-500">Total Bill</span>
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Rs {subtotal.toLocaleString("en-PK")}
                </span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutModalOpen(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                Proceed to Checkout (Rs {subtotal.toLocaleString("en-PK")})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Selection Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            {saleSuccess ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 size={48} className="mx-auto text-emerald-600 animate-bounce" />
                <h3 className="text-lg font-bold">Sale Completed!</h3>
                <p className="text-xs text-slate-400">Inventory updated successfully.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base">Select Payment Mode</h3>
                  <button
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  {/* Payment Mode Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode("cash")}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        paymentMode === "cash"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Banknote size={20} />
                      <span className="text-xs font-bold">Cash Sale (Instant)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode("udhaar")}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        paymentMode === "udhaar"
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <UserCheck size={20} />
                      <span className="text-xs font-bold">Add to Udhaar</span>
                    </button>
                  </div>

                  {/* Udhaar-specific customer selector */}
                  {paymentMode === "udhaar" && (
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Assign to Customer *
                      </label>
                      <input
                        type="text"
                        placeholder="Search customer..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900"
                      />

                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCustomerId(c.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex justify-between items-center ${
                              selectedCustomerId === c.id
                                ? "bg-rose-500 text-white font-bold"
                                : "hover:bg-slate-200 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span>{c.name}</span>
                            <span className="text-[10px] opacity-75">{c.phone || ""}</span>
                          </button>
                        ))}
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Promised Payment Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                      Bill Note / Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Counter sale or custom memo"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="text-sm font-black">
                      Total: Rs {subtotal.toLocaleString("en-PK")}
                    </div>
                    <button
                      type="submit"
                      className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition ${
                        paymentMode === "cash"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      {paymentMode === "cash" ? "Confirm Cash Sale" : "Charge to Udhaar"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}