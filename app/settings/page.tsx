"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { exportBackupJSON, importBackupJSON, type BackupData } from "@/lib/backup";

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function SettingsPage() {
  const hasHydrated = useHydrated();
  const language = useStore((state) => state.language);
  const businessProfile = useStore((state) => state.businessProfile);
  const updateBusinessProfile = useStore((state) => state.updateBusinessProfile);
  const appPin = useStore((state) => state.appPin);
  const setAppPin = useStore((state) => state.setAppPin);
  const lockApp = useStore((state) => state.lockApp);
  const restoreFromBackup = useStore((state) => state.restoreFromBackup);
  const clearAllData = useStore((state) => state.clearAllData);

  const t = translations[hasHydrated ? language : "ur"];
  const isRTL = hasHydrated ? language === "ur" : true;

  // Profile Form States
  const [storeName, setStoreName] = useState(businessProfile?.storeName || "");
  const [ownerName, setOwnerName] = useState(businessProfile?.ownerName || "");
  const [phone, setPhone] = useState(businessProfile?.phone || "");
  const [address, setAddress] = useState(businessProfile?.address || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // PIN Form States
  const [newPin, setNewPin] = useState("");
  const [pinNotice, setPinNotice] = useState("");

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile({
      storeName: storeName.trim() || "Asaan Udhaar",
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinNotice(
        language === "ur"
          ? "برائے مہربانی درست 4 ہندسے درج کریں"
          : "Please enter exactly 4 digits"
      );
      return;
    }
    setAppPin(newPin);
    setNewPin("");
    setPinNotice(
      language === "ur" ? "نیا پن کوڈ محفوظ ہو گیا!" : "PIN Code successfully set!"
    );
    setTimeout(() => setPinNotice(""), 2500);
  };

  const handleRemovePin = () => {
    if (
      window.confirm(
        language === "ur"
          ? "کیا آپ پن کوڈ سیکیورٹی ختم کرنا چاہتے ہیں؟"
          : "Are you sure you want to remove PIN security?"
      )
    ) {
      setAppPin(null);
      setPinNotice(
        language === "ur" ? "پن کوڈ ختم کر دیا گیا" : "PIN security removed"
      );
      setTimeout(() => setPinNotice(""), 2500);
    }
  };

  const handleBackupDownload = () => {
    const state = useStore.getState();
    exportBackupJSON({
      language: state.language,
      theme: state.theme,
      businessProfile: state.businessProfile,
      customers: state.customers,
      transactions: state.transactions,
      appPin: state.appPin,
    });
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importBackupJSON(file, (data: BackupData) => {
      restoreFromBackup(data);
      alert(
        language === "ur"
          ? "بیک اپ کامیابی سے بحال کر دیا گیا!"
          : "Backup restored successfully!"
      );
    });
  };

  const handleClearData = () => {
    if (
      window.confirm(
        language === "ur"
          ? "کیا آپ واقعی تمام کھاتہ اور گاہک ڈیلیٹ کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا!"
          : "Are you sure you want to delete all customer and transaction data? This cannot be undone!"
      )
    ) {
      clearAllData();
      alert(
        language === "ur" ? "تمام ڈیٹا صاف ہو گیا" : "All data has been cleared"
      );
    }
  };

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
              {t.nav.settings}
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4 space-y-5">
        {/* Security & App Lock PIN (Feature #5) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {language === "ur" ? "پن کوڈ سیکیورٹی (App Lock)" : "PIN Code Security (App Lock)"}
                </h3>
                <p className="text-xs text-slate-400">
                  {appPin
                    ? language === "ur"
                      ? "پن کوڈ لاگو ہے"
                      : "PIN protection active"
                    : language === "ur"
                    ? "پن کوڈ فعال نہیں ہے"
                    : "No PIN set"}
                </p>
              </div>
            </div>

            {appPin && (
              <button
                onClick={lockApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Lock size={14} />
                <span>{language === "ur" ? "ابھی لاک کریں" : "Lock App"}</span>
              </button>
            )}
          </div>

          {pinNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
              {pinNotice}
            </div>
          )}

          <form onSubmit={handleSetPin} className="space-y-3 pt-1">
            <div className="flex gap-2">
              <input
                type="password"
                maxLength={4}
                pattern="\d{4}"
                placeholder="4-digit PIN (e.g. 1234)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition shadow-xs"
              >
                {appPin
                  ? language === "ur"
                    ? "پن تبدیل کریں"
                    : "Change PIN"
                  : language === "ur"
                  ? "پن لگائیں"
                  : "Set PIN"}
              </button>
            </div>

            {appPin && (
              <button
                type="button"
                onClick={handleRemovePin}
                className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
              >
                {language === "ur" ? "پن کوڈ ختم کریں" : "Remove PIN Protection"}
              </button>
            )}
          </form>
        </div>

        {/* Business Store Profile Form */}
        <form
          onSubmit={handleProfileSave}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {language === "ur" ? "دکان / کاروبار کی معلومات" : "Store & Business Profile"}
              </h3>
              <p className="text-xs text-slate-400">
                {language === "ur" ? "رسیدوں اور بلوں پر ظاہر ہوگا" : "Appears on thermal receipts & slips"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              {language === "ur" ? "دکان کا نام *" : "Store Name *"}
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              {language === "ur" ? "مالک کا نام" : "Owner Name"}
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Phone size={13} />
              <span>{language === "ur" ? "دکان کا فون نمبر" : "Store Phone"}</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <MapPin size={13} />
              <span>{language === "ur" ? "پتہ / شہر" : "Address / Location"}</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
          >
            {savedSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
            <span>
              {savedSuccess
                ? language === "ur"
                  ? "محفوظ ہو گیا!"
                  : "Saved Successfully!"
                : language === "ur"
                ? "معلومات محفوظ کریں"
                : "Save Profile"}
            </span>
          </button>
        </form>

        {/* Offline Backup & Reset Options */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {language === "ur" ? "بیک اپ اور بحالی" : "Backup & Restore"}
          </h3>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleBackupDownload}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition text-center"
            >
              {language === "ur" ? "بیک اپ ڈاؤن لوڈ کریں" : "Download Backup"}
            </button>

            <label className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition text-center cursor-pointer">
              <span>{language === "ur" ? "بیک اپ بحال کریں" : "Restore Backup"}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleBackupUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleClearData}
              className="w-full py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            >
              {language === "ur" ? "تمام ڈیٹا صاف کریں (Clear All)" : "Clear All App Data"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}