"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  User as UserIcon,
  Shield,
  Search,
  Bell,
  CheckCircle2,
  ExternalLink,
  Lock,
  Menu,
} from "lucide-react";
import { useLockScreen } from "./lock-screen-provider";
import { useMobileNav } from "./mobile-nav-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ShopSwitcher } from "./shop-switcher";
import { SessionUser } from "@/lib/types";

interface HeaderProps {
  user: SessionUser;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { lockScreen } = useLockScreen();
  const { toggleNav } = useMobileNav();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      window.location.href = "/login";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 md:px-6 flex items-center justify-between shadow-2xs shrink-0 select-none print:hidden">
      {/* Left side: Mobile Menu Button, Shop Switcher & Status */}
      <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
        {/* Mobile Hamburger Drawer Trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleNav}
          className="md:hidden h-9 w-9 p-0 text-slate-700 hover:text-slate-950 hover:bg-slate-100 shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <ShopSwitcher currentShopId={user.shopId} isAdmin={user.role === "admin"} />
        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span>Currency: <strong className="text-slate-800">{user.currency}</strong></span>
        </div>
      </div>

      {/* Right side: Global Search quick launcher, Lock Button, User Menu */}
      <div className="flex items-center space-x-2.5">
        {/* Quick Nav Search launcher */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const el = document.getElementById("global-search-input");
            if (el) el.focus();
          }}
          className="hidden sm:flex items-center space-x-2 h-9 px-3 text-slate-400 border-slate-200 text-xs hover:text-slate-700 bg-slate-50"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Quick search...</span>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500">
            Ctrl+K
          </kbd>
        </Button>

        {/* Workstation Lock Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={lockScreen}
          className="flex items-center space-x-1.5 h-9 px-2.5 text-slate-700 hover:text-amber-700 hover:bg-amber-50/70 border-slate-200 text-xs font-medium"
          title="Lock Workstation & Admin Panel (Ctrl+L)"
        >
          <Lock className="h-3.5 w-3.5 text-amber-600" />
          <span className="hidden md:inline">Lock Screen</span>
        </Button>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 h-9 px-2 hover:bg-slate-100 rounded-md"
            >
              <div className="h-7 w-7 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shadow-xs">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-500 capitalize leading-tight">
                  {user.role}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
                <p className="text-[11px] text-slate-500 leading-none truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="text-xs cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5 mr-2 text-slate-500" />
              Shop Settings
            </DropdownMenuItem>
            {user.role === "admin" && (
              <DropdownMenuItem
                onClick={() => router.push("/users")}
                className="text-xs cursor-pointer"
              >
                <UserIcon className="h-3.5 w-3.5 mr-2 text-slate-500" />
                Manage Users & Permissions
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={lockScreen}
              className="text-xs cursor-pointer text-amber-700 font-medium focus:text-amber-800 focus:bg-amber-50"
            >
              <Lock className="h-3.5 w-3.5 mr-2 text-amber-600" />
              <span>Lock Workstation (Ctrl+L)</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}