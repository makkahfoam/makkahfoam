"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  Users,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileNav } from "./mobile-nav-context";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleNav, isOpen } = useMobileNav();

  const isHome = pathname === "/";
  const isBills = pathname.startsWith("/billing") && pathname !== "/billing/new";
  const isNewBill = pathname === "/billing/new";
  const isCustomers = pathname.startsWith("/customers");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-2px_10px_rgba(0,0,0,0.06)] select-none print:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Dashboard */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center min-w-[56px] py-1 text-[10px] font-medium transition-colors",
            isHome ? "text-amber-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <LayoutDashboard className={cn("h-5 w-5 mb-0.5", isHome && "stroke-[2.5px]")} />
          <span>Home</span>
        </Link>

        {/* 2. Invoices & Bills */}
        <Link
          href="/billing"
          className={cn(
            "flex flex-col items-center justify-center min-w-[56px] py-1 text-[10px] font-medium transition-colors",
            isBills ? "text-amber-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <ReceiptText className={cn("h-5 w-5 mb-0.5", isBills && "stroke-[2.5px]")} />
          <span>Invoices</span>
        </Link>

        {/* 3. Center Highlight: New Bill (POS) */}
        <Link
          href="/billing/new"
          className="flex flex-col items-center justify-center -mt-5 group"
          title="Create New POS Bill"
        >
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center shadow-lg border-[3px] border-white transition-transform active:scale-95",
            isNewBill
              ? "bg-amber-700 text-white shadow-amber-600/40"
              : "bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-amber-500/30 hover:shadow-amber-500/50"
          )}>
            <Plus className="h-6 w-6 stroke-[2.75px]" />
          </div>
          <span className={cn(
            "text-[10px] font-bold mt-0.5",
            isNewBill ? "text-amber-700" : "text-slate-700"
          )}>
            New Bill
          </span>
        </Link>

        {/* 4. Customer Khata */}
        <Link
          href="/customers"
          className={cn(
            "flex flex-col items-center justify-center min-w-[56px] py-1 text-[10px] font-medium transition-colors",
            isCustomers ? "text-amber-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Users className={cn("h-5 w-5 mb-0.5", isCustomers && "stroke-[2.5px]")} />
          <span>Khata</span>
        </Link>

        {/* 5. More Menu Toggle */}
        <button
          type="button"
          onClick={toggleNav}
          className={cn(
            "flex flex-col items-center justify-center min-w-[56px] py-1 text-[10px] font-medium transition-colors",
            isOpen ? "text-amber-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Menu className={cn("h-5 w-5 mb-0.5", isOpen && "stroke-[2.5px]")} />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
