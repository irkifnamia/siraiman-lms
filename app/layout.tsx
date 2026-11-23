import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SIR AIMAN LMS",
  description: "Learning management for Sir Aiman's mathematics classes – Kedah Matriculation College",
  
  appleWebApp: { capable: true, title: "SIR AIMAN LMS", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0f6661", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
