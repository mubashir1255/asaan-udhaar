# آسان ادھار — Asaan Udhaar

> A fast, offline-first, mobile-friendly credit ledger (کھاتہ) designed specifically for Pakistani retail shopkeepers and small businesses.

---

## 🌟 Key Features

- 📱 **Installable PWA**: Works as a standalone app on Android, iOS, and PC (Chrome/Edge/Brave) with complete offline persistence (`localStorage`).
- 🌐 **Full Bilingual Support**: Instant switching between Urdu (RTL) and English (LTR) with clear local shopkeeper terminology.
- 💬 **WhatsApp Transaction Slips**: Automatically generate and share bilingual credit (`Udhaar`) and payment (`Wusooli`) confirmation slips directly via WhatsApp.
- ⏰ **Promised Due Dates & Overdue Filter**: Set expected repayment dates and filter customers with overdue balances.
- 📊 **CSV Ledger Statement Export**: Download full customer transaction history with a single tap for record-keeping.
- 🖨️ **58mm Thermal Print View**: Formatted counter receipts ready for thermal paper printers.
- 🔒 **PIN Lock Security**: Built-in 4-digit PIN code guard to protect customer financial data on shared shop devices.
- 💾 **Offline Backup & Restore**: Download full ledger data as a `.json` backup file and restore anytime without internet dependency.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (Custom Forest Green Palette)
- **State Management:** Zustand with local storage persistence
- **Icons:** Lucide React

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and `pnpm` installed:
```bash
corepack enable
pnpm -v
