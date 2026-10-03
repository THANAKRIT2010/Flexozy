import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Flexozy — Roblox ID & Vault", template: "%s · Flexozy" },
  description: "คลัง Roblox Sound ID และ Vault ฝากสคริปต์เป็นลิงก์ loadstring",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#071225", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
