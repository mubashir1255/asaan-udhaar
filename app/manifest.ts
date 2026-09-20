import type { MetadataRoute } from "next";

// Required for Next.js static export (output: "export")
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Asaan Udhaar - آسان ادھار",
    short_name: "Asaan Udhaar",
    description: "Digital Khata & Credit Ledger for Retailers",
    start_url: "/",
    display: "standalone",
    background_color: "#022c22",
    theme_color: "#1f4e2c",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}