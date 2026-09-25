"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

const SCANNER_ELEMENT_ID = "asaan-barcode-scanner-region";

export default function BarcodeScannerModal({
  open,
  onClose,
  onScan,
}: BarcodeScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  useEffect(() => {
    if (!open) return;

    handledRef.current = false;
    setError(null);

    let cancelled = false;
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
    });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decodedText) => {
          if (handledRef.current || cancelled) return;
          handledRef.current = true;
          onScanRef.current(decodedText.trim());
          onCloseRef.current();
        },
        () => {
          /* ignore frame-level decode misses */
        }
      )
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Unable to access the camera";
        setError(message);
      });

    return () => {
      cancelled = true;
      const active = scannerRef.current;
      scannerRef.current = null;
      if (active) {
        if (active.isScanning) {
          active
            .stop()
            .then(() => active.clear())
            .catch(() => {
              try {
                active.clear();
              } catch {
                /* ignore cleanup errors */
              }
            });
        } else {
          try {
            active.clear();
          } catch {
            /* ignore */
          }
        }
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Scan Barcode
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Point the rear camera at the barcode
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close scanner"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div
            id={SCANNER_ELEMENT_ID}
            className="w-full min-h-[240px] overflow-hidden rounded-xl bg-slate-950"
          />

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 text-center">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
