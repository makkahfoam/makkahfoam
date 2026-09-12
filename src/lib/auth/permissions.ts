import { PermissionKey } from "../types";

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: "Core" | "Sales" | "Purchasing" | "Inventory" | "Admin";
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  { key: "dashboard", label: "Dashboard", category: "Core", description: "View executive dashboard & analytics" },
  { key: "billing", label: "Billing & Sales", category: "Sales", description: "Create, edit, view and manage bills" },
  { key: "customers", label: "Customers", category: "Sales", description: "Manage customer profiles and accounts" },
  { key: "customer_ledger", label: "Customer Ledger", category: "Sales", description: "View complete customer transaction ledger" },
  { key: "customer_payments", label: "Customer Payments", category: "Sales", description: "Record and manage customer receipts" },
  { key: "products", label: "Products Catalog", category: "Inventory", description: "Manage product listings, pricing, categories" },
  { key: "inventory", label: "Stock & Movements", category: "Inventory", description: "View stock levels, audit movements & adjust stock" },
  { key: "vendors", label: "Vendors Directory", category: "Purchasing", description: "Manage vendor profiles and contact data" },
  { key: "vendor_gate_in", label: "Vendor Gate In", category: "Purchasing", description: "Record Gate In shipments and receiving" },
  { key: "vendor_ledger", label: "Vendor Ledger", category: "Purchasing", description: "View complete vendor transaction ledger" },
  { key: "vendor_payments", label: "Vendor Payments", category: "Purchasing", description: "Issue and manage vendor payments" },
  { key: "reports", label: "Reports & Financials", category: "Core", description: "Generate sales, purchases, aging and ledger reports" },
  { key: "settings", label: "Shop Profile Settings", category: "Admin", description: "Configure shop name, logo, address, prefix, terms" },
  { key: "backup", label: "Backup & Restore", category: "Admin", description: "Create database backups and restore snapshots" },
];

export function hasPermission(userPermissions: PermissionKey[] | undefined | null, key: PermissionKey, role?: string): boolean {
  if (role === "admin") return true;
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return userPermissions.includes(key);
}

export const ROUTE_PERMISSIONS: Record<string, PermissionKey> = {
  "/": "dashboard",
  "/billing": "billing",
  "/billing/new": "billing",
  "/customers": "customers",
  "/customers/ledger": "customer_ledger",
  "/customers/payments": "customer_payments",
  "/products": "products",
  "/inventory": "inventory",
  "/inventory/adjustments": "inventory",
  "/inventory/movements": "inventory",
  "/vendors": "vendors",
  "/purchasing/gate-in": "vendor_gate_in",
  "/purchasing/gate-in/history": "vendor_gate_in",
  "/vendors/ledger": "vendor_ledger",
  "/vendors/payments": "vendor_payments",
  "/reports": "reports",
  "/settings": "settings",
  "/backup": "backup",
  "/users": "settings", // Only admin / settings access
};