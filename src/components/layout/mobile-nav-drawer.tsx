"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  PlusCircle,
  Package,
  Layers,
  ArrowLeftRight,
  Truck,
  History,
  Users,
  BookOpen,
  CreditCard,
  Building2,
  FileBarChart2,
  UserCog,
  DatabaseBackup,
  Settings,
  ShieldCheck,
  X,
  Store,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionUser, PermissionKey } from "@/lib/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useMobileNav } from "./mobile-nav-context";
import { useLockScreen } from "./lock-screen-provider";
import { Button } from "@/components/ui/button";

interface MobileNavDrawerProps {
  user: SessionUser;
  activeShopName: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  permission?: PermissionKey;
  adminOnly?: boolean;
  badge?: string | number;
}

interface NavGroup {
  group: string;
  permission?: PermissionKey;
  adminOnly?: boolean;
  items: NavItem[];
}

export function MobileNavDrawer({ user, activeShopName }: MobileNavDrawerProps) {
  const { isOpen, closeNav } = useMobileNav();
  const { lockScreen } = useLockScreen();
  const pathname = usePathname();

  const navigation: NavGroup[] = [
    {
      group: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/",
          icon: LayoutDashboard,
          permission: "dashboard",
        },
      ],
    },
    {
      group: "Sales & Invoicing",
      permission: "billing",
      items: [
        {
          title: "Bills & Invoices",
          href: "/billing",
          icon: ReceiptText,
          permission: "billing",
        },
        {
          title: "New Bill (POS)",
          href: "/billing/new",
          icon: PlusCircle,
          permission: "billing",
        },
      ],
    },
    {
      group: "Inventory & Catalog",
      permission: "products",
      items: [
        {
          title: "Product Catalog",
          href: "/products",
          icon: Package,
          permission: "products",
        },
        {
          title: "Stock Management",
          href: "/inventory",
          icon: Layers,
          permission: "inventory",
        },
        {
          title: "Stock Audit Trail",
          href: "/inventory/movements",
          icon: ArrowLeftRight,
          permission: "inventory",
        },
      ],
    },
    {
      group: "Purchasing & Receiving",
      permission: "vendor_gate_in",
      items: [
        {
          title: "Gate In (Receiving)",
          href: "/purchasing/gate-in",
          icon: Truck,
          permission: "vendor_gate_in",
        },
        {
          title: "Gate In History",
          href: "/purchasing/gate-in/history",
          icon: History,
          permission: "vendor_gate_in",
        },
      ],
    },
    {
      group: "Customer Khata",
      permission: "customers",
      items: [
        {
          title: "Customer Directory",
          href: "/customers",
          icon: Users,
          permission: "customers",
        },
        {
          title: "Dedicated Ledger",
          href: "/customers/ledger",
          icon: BookOpen,
          permission: "customer_ledger",
        },
        {
          title: "Payment Receipts",
          href: "/customers/payments",
          icon: CreditCard,
          permission: "customer_payments",
        },
      ],
    },
    {
      group: "Vendor Khata",
      permission: "vendors",
      items: [
        {
          title: "Vendor Directory",
          href: "/vendors",
          icon: Building2,
          permission: "vendors",
        },
        {
          title: "Dedicated Ledger",
          href: "/vendors/ledger",
          icon: BookOpen,
          permission: "vendor_ledger",
        },
        {
          title: "Payment Disbursements",
          href: "/vendors/payments",
          icon: CreditCard,
          permission: "vendor_payments",
        },
      ],
    },
    {
      group: "Reports & Analytics",
      permission: "reports",
      items: [
        {
          title: "Financial & Business Reports",
          href: "/reports",
          icon: FileBarChart2,
          permission: "reports",
        },
      ],
    },
    {
      group: "Administration",
      adminOnly: true,
      items: [
        {
          title: "User Management",
          href: "/users",
          icon: UserCog,
          adminOnly: true,
        },
        {
          title: "Database Backup",
          href: "/backup",
          icon: DatabaseBackup,
          permission: "backup",
          adminOnly: true,
        },
        {
          title: "System Settings",
          href: "/settings",
          icon: Settings,
          permission: "settings",
          adminOnly: true,
        },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex select-none">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
        onClick={closeNav}
      />

      {/* Slide-in drawer container */}
      <div className="relative w-72 max-w-[85vw] bg-slate-950 text-slate-100 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250 border-r border-slate-800">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
              FE
            </div>
            <div className="truncate">
              <h2 className="text-sm font-bold tracking-tight text-white truncate">Furniture ERP</h2>
              <p className="text-[10px] text-amber-400 font-medium truncate flex items-center gap-1">
                <Store className="h-3 w-3 inline shrink-0" />
                <span className="truncate">{activeShopName || user.shopName || "Enterprise Suite"}</span>
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={closeNav}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 -webkit-overflow-scrolling-touch">
          {navigation.map((section, idx) => {
            if (section.adminOnly && user.role !== "admin") return null;
            if (section.permission && !hasPermission(user.permissions, section.permission, user.role)) return null;

            const visibleItems = section.items.filter((item) => {
              if (item.adminOnly && user.role !== "admin") return false;
              if (item.permission && !hasPermission(user.permissions, item.permission, user.role)) return false;
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.group}
                </h3>
                <div className="space-y-0.5 pt-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeNav}
                        className={cn(
                          "group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all",
                          isActive
                            ? "bg-amber-600 text-white shadow-sm font-semibold"
                            : "text-slate-300 hover:bg-slate-900 hover:text-white active:bg-slate-800"
                        )}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isActive ? "text-white" : "text-slate-400 group-hover:text-amber-400"
                            )}
                          />
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer with User Info & Lock Screen */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/80 space-y-2">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-slate-950 border border-slate-800">
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="h-7 w-7 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs border border-slate-700 shrink-0">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase font-mono font-bold">
              {user.role}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              closeNav();
              lockScreen();
            }}
            className="w-full flex items-center justify-center space-x-1.5 h-8 text-xs font-semibold bg-slate-900 hover:bg-amber-950/40 text-amber-400 border-slate-800 hover:border-amber-600/40"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Lock Screen</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
