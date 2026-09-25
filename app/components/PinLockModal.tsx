"use client";

import { useState, useSyncExternalStore } from "react";
import { Lock, Unlock, Delete } from "lucide-react";
import { useStore } from "@/lib/store";

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function PinLockModal() {
  const hasHydrated = useHydrated();
  const appPin = useStore((state) => state.appPin);
  const isLocked = useStore((state) => state.isLocked);
  const unlockApp = useStore((state) => state.unlockApp);
  const language = useStore((state) => state.language);

  const [enteredPin, setEnteredPin] = useState("");
  const [errorShake, setErrorShake] = useState(false);

  if (!hasHydrated || !appPin) {
    return null;
  }

  // Locked whenever PIN is set and unlock flag is false (isLocked === true)
  if (!isLocked) {
    return null;
  }

  const handleKeyPress = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const newPin = enteredPin + digit;
    setEnteredPin(newPin);

    if (newPin.length === 4) {
      const success = unlockApp(newPin);
      if (!success) {
        setErrorShake(true);
        setTimeout(() => {
          setEnteredPin("");
          setErrorShake(false);
        }, 500);
      } else {
        setEnteredPin("");
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          <Lock size={28} />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {language === "ur" ? "ایپ لاک ہے" : "App is Locked"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === "ur"
              ? "کھاتہ کھولنے کے لیے 4 ہندسوں کا پن کوڈ درج کریں"
              : "Enter your 4-digit PIN to access Khaata"}
          </p>
        </div>

        {/* 4-digit indicator dots */}
        <div
          className={`flex justify-center gap-3.5 py-2 ${
            errorShake ? "animate-bounce text-rose-500" : ""
          }`}
        >
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                enteredPin.length > idx
                  ? "bg-emerald-600 border-emerald-600 scale-110"
                  : "border-slate-300 dark:border-slate-700 bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Numeric PIN Pad */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-lg font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition shadow-2xs"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress("0")}
            className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-lg font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition shadow-2xs"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition shadow-2xs"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}