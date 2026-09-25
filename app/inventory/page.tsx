"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Product } from "@/lib/types";
import {
  ArrowLeft,
  Search,
  Plus,
  Package,
  AlertTriangle,
  Edit2,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

export default function InventoryPage() {
  const {
    products = [],
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
  } = useStore();

  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    Promise.resolve().then(() => setHasHydrated(true));
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [barcode, setBarcode] = useState("");

  // Stock Adjustment Quick Modal
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setCostPrice(String(product.costPrice || 0));
      setSalePrice(String(product.salePrice));
      setStockQuantity(String(product.stockQuantity));
      setUnit(product.unit || "pcs");
      setBarcode(product.barcode || "");
    } else {
      setEditingProduct(null);
      setName("");
      setCostPrice("");
      setSalePrice("");
      setStockQuantity("");
      setUnit("pcs");
      setBarcode("");
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !salePrice) return;

    const parsedCost = parseFloat(costPrice) || 0;
    const parsedSale = parseFloat(salePrice) || 0;
    const parsedStock = parseInt(stockQuantity, 10) || 0;
    const trimmedBarcode = barcode.trim() || undefined;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: name.trim(),
        costPrice: parsedCost,
        salePrice: parsedSale,
        stockQuantity: parsedStock,
        unit: unit.trim() || "pcs",
        barcode: trimmedBarcode,
      });
    } else {
      addProduct({
        name: name.trim(),
        costPrice: parsedCost,
        salePrice: parsedSale,
        stockQuantity: parsedStock,
        unit: unit.trim() || "pcs",
        barcode: trimmedBarcode,
      });
    }

    setIsModalOpen(false);
  };

  const handleQuickAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct || !adjustQty) return;
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty <= 0) return;

    const delta = adjustType === "add" ? qty : -qty;
    adjustStock(adjustModalProduct.id, delta);
    setAdjustModalProduct(null);
    setAdjustQty("");
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterLowStock) {
        return matchesSearch && p.stockQuantity <= 5;
      }
      return matchesSearch;
    });
  }, [products, searchQuery, filterLowStock]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= 5).length;
  }, [products]);

  const totalInventoryCost = useMemo(() => {
    return products.reduce(
      (sum, p) => sum + (p.costPrice || 0) * p.stockQuantity,
      0
    );
  }, [products]);

  if (!hasHydrated) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-48 mb-6" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-bold">Inventory</h1>
              <p className="text-xs text-slate-500">
                {products.length} Items &bull; Rs {totalInventoryCost.toLocaleString("en-PK")} Cost Value
              </p>
            </div>
          </div>

          <button
            onClick={() => openProductModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Plus size={16} />
            <span>Add Item</span>
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {lowStockCount > 0 && (
            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition ${
                filterLowStock
                  ? "bg-rose-500 text-white border-rose-600"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900"
              }`}
            >
              <AlertTriangle size={14} />
              <span>Low ({lowStockCount})</span>
            </button>
          )}
        </div>

        {/* Product List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <Package size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">
              {searchQuery ? "No products match your search" : "No items in inventory"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Add products with cost and sale prices to track stock and calculate profits during sales.
            </p>
            <button
              onClick={() => openProductModal()}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Add First Item
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredProducts.map((p) => {
              const isLow = p.stockQuantity <= 5;
              const profitMargin = p.salePrice - (p.costPrice || 0);

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm truncate">{p.name}</h4>
                      {isLow && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                          Low Stock
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Sale: <strong className="text-slate-800 dark:text-slate-200">Rs {p.salePrice}</strong>
                      </span>
                      {p.costPrice > 0 && <span>Cost: Rs {p.costPrice}</span>}
                      {profitMargin > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <TrendingUp size={11} /> +Rs {profitMargin} profit
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Quick Button & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setAdjustModalProduct(p);
                        setAdjustType("add");
                        setAdjustQty("1");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-center border font-bold text-xs ${
                        isLow
                          ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-600"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      }`}
                      title="Adjust stock"
                    >
                      <div className="text-sm font-extrabold">{p.stockQuantity}</div>
                      <div className="text-[9px] text-slate-400 uppercase font-medium">{p.unit || "pcs"}</div>
                    </button>

                    <button
                      onClick={() => openProductModal(p)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Edit Product"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) {
                          deleteProduct(p.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base">
                {editingProduct ? "Edit Product" : "Add New Item"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sugar 1kg, Milk pack, Panadol"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                    Cost Price (Purchase Rs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                    Sale Price (Retail Rs) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="pcs, kg, pack"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  Barcode (optional)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Scan or type barcode / SKU"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Use a laser scanner or type manually — used for quick POS lookup.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {editingProduct ? "Update Item" : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-sm">
                Stock: {adjustModalProduct.name}
              </h3>
              <button
                onClick={() => setAdjustModalProduct(null)}
                className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Current stock: <strong className="text-slate-800 dark:text-slate-200">{adjustModalProduct.stockQuantity} {adjustModalProduct.unit || "pcs"}</strong>
            </div>

            <form onSubmit={handleQuickAdjust} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType("add")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    adjustType === "add"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent"
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("remove")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    adjustType === "remove"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent"
                  }`}
                >
                  - Remove Stock
                </button>
              </div>

              <div>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  placeholder="Quantity"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}