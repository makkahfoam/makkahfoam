export type PermissionKey =
  | "dashboard"
  | "products"
  | "inventory"
  | "billing"
  | "customers"
  | "customer_ledger"
  | "customer_payments"
  | "vendors"
  | "vendor_gate_in"
  | "vendor_ledger"
  | "vendor_payments"
  | "reports"
  | "settings"
  | "backup";

export interface SessionUser {
  id: string;
  shopId: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  permissions: PermissionKey[];
  shopName: string;
  currency: string;
  logo?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export type PaymentMethod = "Cash" | "Bank Transfer" | "Easypaisa" | "JazzCash" | "Other";