import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Asaan Udhaar - آسان ادھار",
    short_name: "Asaan Udhaar",
    description: "Khaata & Credit Ledger for Small Businesses",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#1f4e2c", // Updated to logo green
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}