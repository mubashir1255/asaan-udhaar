import type { Metadata, Viewport } from "next";
import Script from "next/script";
import PinLockModal from "./components/PinLockModal";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1f4e2c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Asaan Udhaar - آسان ادھار",
  description: "Simple responsive credit ledger for businesses",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Asaan Udhaar",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <Script
          id="theme-and-storage-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('asaan-udhaar-store');
                if (stored) {
                  var parsed = JSON.parse(stored);
                  if (parsed.state && parsed.state.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }
              } catch (e) {}

              if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
                navigator.storage.persist();
              }
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors">
        <PinLockModal />
        {children}
      </body>
    </html>
  );
}