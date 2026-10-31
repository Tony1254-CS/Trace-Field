import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "TRACE · Field notebook",
  description: "Record field observations with care. Keep each note tied to its mission and evidence.",
  applicationName: "TRACE Field Notebook",
  icons: { icon: "/favicon.svg", apple: "/icons/trace-192.png" },
};

export const viewport: Viewport = { themeColor: "#17231f", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
