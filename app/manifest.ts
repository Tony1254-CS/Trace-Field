import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TRACE Field Notebook",
    short_name: "TRACE",
    description: "NASA Space Apps 2026 Ground Evidence companion for satellite SAR radar changes. Capture photos, GPS, and notes offline with zero data loss.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    categories: ["science", "education", "productivity"],
    background_color: "#f3f2ed",
    theme_color: "#17231f",
    icons: [
      { src: "/icons/trace-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/trace-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop-radar.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "TRACE Field Notebook Dashboard & SAR Satellite Radar",
      },
      {
        src: "/screenshots/mobile-capture.png",
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow",
        label: "Field Evidence Capture with Offline Storage & Bangla Audio",
      },
    ],
  };
}
