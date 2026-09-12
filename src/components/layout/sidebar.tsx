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
  ChevronDown,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionUser, PermissionKey } from "@/lib/types";
import { hasPermission } from "@/lib/auth/permissions";

interface SidebarProps {
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
  items: NavItem[];
}

export function Sidebar({ user, activeShopName }: SidebarProps) {
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
          title: "Stock Movements",
          href: "/inventory/movements",
          icon: ArrowLeftRight,
          permission: "inventory",
        },
      ],
    },
    {
      group: "Purchasing (Receiving)",
      permission: "vendor_gate_in",
      items: [
        {
          title: "Vendor Gate In",
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
      group: "Customers & Receivables",
      permission: "customers",
      items: [
        {
          title: "Customer Directory",
          href: "/customers",
          icon: Users,
          permission: "customers",
        },
        {
          title: "Customer Ledger",
          href: "/customers/ledger",
          icon: BookOpen,
          permission: "customer_ledger",
        },
        {
          title: "Customer Payments",
          href: "/customers/payments",
          icon: CreditCard,
          permission: "customer_payments",
        },
      ],
    },
    {
      group: "Vendors & Payables",
      permission: "vendors",
      items: [
        {
          title: "Vendor Directory",
          href: "/vendors",
          icon: Building2,
          permission: "vendors",
        },
        {
          title: "Vendor Ledger",
          href: "/vendors/ledger",
          icon: BookOpen,
          permission: "vendor_ledger",
        },
        {
          title: "Vendor Payments",
          href: "/vendors/payments",
          icon: CreditCard,
          permission: "vendor_payments",
        },
      ],
    },
    {
      group: "Intelligence & Reports",
      permission: "reports",
      items: [
        {
          title: "Reports & Analytics",
          href: "/reports",
          icon: FileBarChart2,
          permission: "reports",
        },
      ],
    },
    {
      group: "Administration",
      items: [
        {
          title: "User Management",
          href: "/users",
          icon: UserCog,
          adminOnly: true,
        },
        {
          title: "Backup & Restore",
          href: "/backup",
          icon: DatabaseBackup,
          permission: "backup",
        },
        {
          title: "Shop Settings",
          href: "/settings",
          icon: Settings,
          permission: "settings",
        },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-slate-950 text-slate-200 flex-col h-screen border-r border-slate-800 select-none shrink-0 print:hidden">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-900/60">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
          <Store className="h-5 w-5" />
        </div>
        <div className="ml-3 overflow-hidden">
          <h2 className="text-sm font-bold text-white truncate tracking-tight">
            {activeShopName || "Furniture ERP"}
          </h2>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] text-slate-400 font-medium truncate">
              {user.role === "admin" ? "Enterprise Admin" : "Staff Console"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navigation.map((section, idx) => {
          // Check group permission
          if (section.permission && !hasPermission(user.permissions, section.permission, user.role)) {
            return null;
          }

          // Filter visible items
          const visibleItems = section.items.filter((item) => {
            if (item.adminOnly && user.role !== "admin") return false;
            if (item.permission && !hasPermission(user.permissions, item.permission, user.role)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.group}
              </h3>
              <div className="space-y-0.5 pt-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all",
                        isActive
                          ? "bg-amber-600/90 text-white shadow-sm font-semibold"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
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

      {/* User Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-slate-900/80 border border-slate-800">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="h-7 w-7 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs border border-slate-700">
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
      </div>
    </aside>
  );
}