import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TRACE Field Notebook",
    short_name: "TRACE",
    description: "A careful field notebook for recording observations.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3f2ed",
    theme_color: "#17231f",
    icons: [
      { src: "/icons/trace-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/trace-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
