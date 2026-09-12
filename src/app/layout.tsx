import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Furniture ERP & Ledger System",
  description: "Production-ready Furniture ERP, Billing, Inventory, Vendor Ledger & Customer Ledger Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className={`${inter.className} h-full antialiased text-slate-900 bg-slate-50 selection:bg-amber-100 selection:text-amber-900`}>
        {children}
      </body>
    </html>
  );
}