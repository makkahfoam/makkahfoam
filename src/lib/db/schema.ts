import { sqliteTable, text, real, integer, index } from "drizzle-orm/sqlite-core";

// ==========================================
// 1. BUSINESS PROFILES / SHOPS (Max 4)
// ==========================================
export const shops = sqliteTable("shops", {
  id: text("id").primaryKey(), // e.g. "shop_1", "shop_2", "shop_3", "shop_4"
  name: text("name").notNull(),
  logo: text("logo"), // Data URL or Image URL
  address: text("address").default(""),
  phone1: text("phone1").default(""),
  phone2: text("phone2").default(""),
  email: text("email").default(""),
  currency: text("currency").default("Rs.").notNull(),
  billPrefix: text("bill_prefix").default("INV-").notNull(),
  billCounter: integer("bill_counter").default(1).notNull(),
  gateInPrefix: text("gate_in_prefix").default("GI-").notNull(),
  gateInCounter: integer("gate_in_counter").default(1).notNull(),
  vendorPaymentPrefix: text("vendor_payment_prefix").default("VP-").notNull(),
  vendorPaymentCounter: integer("vendor_payment_counter").default(1).notNull(),
  customerPaymentPrefix: text("customer_payment_prefix").default("CP-").notNull(),
  customerPaymentCounter: integer("customer_payment_counter").default(1).notNull(),
  warrantyText: text("warranty_text").default("1 Year Structure Warranty"),
  footerText: text("footer_text").default("Thank you for your business! Items once sold can only be exchanged within 7 days."),
  businessDescription: text("business_description").default("Premium Furniture & Interior Solutions"),
  defaultPaymentMethod: text("default_payment_method").default("Cash").notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ==========================================
// 2. USERS & PERMISSIONS
// ==========================================
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("staff"), // "admin" | "staff"
  permissions: text("permissions").notNull().default("[]"), // JSON string array of permission keys
  status: text("status").notNull().default("active"), // "active" | "inactive"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => ({
  shopIdx: index("users_shop_idx").on(table.shopId),
  emailIdx: index("users_email_idx").on(table.email),
}));

// ==========================================
// 3. PRODUCT CATEGORIES
// ==========================================
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  name: text("name").notNull(),
  description: text("description").default(""),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  shopIdx: index("categories_shop_idx").on(table.shopId),
}));

// ==========================================
// 4. PRODUCTS & INVENTORY
// ==========================================
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  categoryId: text("category_id").references(() => categories.id),
  brand: text("brand").default(""),
  unit: text("unit").default("Pcs").notNull(),
  purchasePrice: real("purchase_price").default(0).notNull(),
  sellingPrice: real("selling_price").default(0).notNull(),
  currentStock: real("current_stock").default(0).notNull(),
  minimumStock: real("minimum_stock").default(5).notNull(),
  description: text("description").default(""),
  imageUrl: text("image_url").default(""),
  status: text("status").default("active").notNull(), // "active" | "inactive"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => ({
  shopIdx: index("products_shop_idx").on(table.shopId),
  skuIdx: index("products_sku_idx").on(table.shopId, table.sku),
}));

// ==========================================
// 5. STOCK MOVEMENTS (Complete Inventory Audit)
// ==========================================
export const stockMovements = sqliteTable("stock_movements", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  productId: text("product_id").notNull().references(() => products.id),
  movementType: text("movement_type").notNull(), // "GATE_IN" | "SALE" | "ADJUSTMENT_ADD" | "ADJUSTMENT_SUB" | "BILL_EDIT" | "BILL_DELETE" | "INITIAL"
  quantity: real("quantity").notNull(),
  previousStock: real("previous_stock").notNull(),
  newStock: real("new_stock").notNull(),
  reference: text("reference").notNull(), // e.g. GI-0001, INV-0001, ADJ-001
  userId: text("user_id"),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  shopIdx: index("sm_shop_idx").on(table.shopId),
  productIdx: index("sm_product_idx").on(table.productId),
  refIdx: index("sm_ref_idx").on(table.reference),
}));

// ==========================================
// 6. VENDORS
// ==========================================
export const vendors = sqliteTable("vendors", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  vendorCode: text("vendor_code").notNull(), // e.g. VND-0001
  name: text("name").notNull(),
  companyName: text("company_name").default(""),
  phone: text("phone").default(""),
  whatsapp: text("whatsapp").default(""),
  address: text("address").default(""),
  email: text("email").default(""),
  openingBalance: real("opening_balance").default(0).notNull(), // Initial payable if positive
  currentPayable: real("current_payable").default(0).notNull(), // Total remaining payable
  notes: text("notes").default(""),
  status: text("status").default("active").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => ({
  shopIdx: index("vendors_shop_idx").on(table.shopId),
  codeIdx: index("vendors_code_idx").on(table.shopId, table.vendorCode),
}));

// ==========================================
// 7. VENDOR GATE IN (Purchases - NO GATE OUT)
// ==========================================
export const gateIns = sqliteTable("gate_ins", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  gateInNumber: text("gate_in_number").notNull(), // e.g. GI-0001
  vendorId: text("vendor_id").notNull().references(() => vendors.id),
  date: text("date").notNull(),
  vendorInvoiceNumber: text("vendor_invoice_number").default(""),
  totalAmount: real("total_amount").default(0).notNull(),
  notes: text("notes").default(""),
  createdBy: text("created_by").default(""),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  shopIdx: index("gate_ins_shop_idx").on(table.shopId),
  vendorIdx: index("gate_ins_vendor_idx").on(table.vendorId),
  giNumIdx: index("gate_ins_num_idx").on(table.shopId, table.gateInNumber),
}));

export const gateInItems = sqliteTable("gate_in_items", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  gateInId: text("gate_in_id").notNull().references(() => gateIns.id),
  productId: text("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").default("Pcs").notNull(),
  purchaseRate: real("purchase_rate").notNull(),
  totalAmount: real("total_amount").notNull(),
}, (table) => ({
  gateInIdx: index("gii_gi_idx").on(table.gateInId),
  productIdx: index("gii_product_idx").on(table.productId),
}));

// ==========================================
// 8. VENDOR LEDGER (Permanent Chronological History)
// ==========================================
export const vendorLedger = sqliteTable("vendor_ledger", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  vendorId: text("vendor_id").notNull().references(() => vendors.id),
  date: text("date").notNull(),
  type: text("type").notNull(), // "OPENING_BALANCE" | "GATE_IN" | "PAYMENT" | "ADJUSTMENT" | "RETURN"
  reference: text("reference").notNull(), // e.g. GI-0001, VP-0001, OP-001
  description: text("description").notNull(),
  amount: real("amount").default(0).notNull(), // Purchases / Payables added
  payment: real("payment").default(0).notNull(), // Payments disbursed
  balance: real("balance").default(0).notNull(), // Cumulative running payable balance
  createdAt: text("created_at").notNull(),
}, (table) => ({
  shopIdx: index("vl_shop_idx").on(table.shopId),
  vendorIdx: index("vl_vendor_idx").on(table.vendorId),
  dateIdx: index("vl_date_idx").on(table.date),
}));

// ==========================================
// 9. VENDOR PAYMENTS
// ==========================================
export const vendorPayments = sqliteTable("vendor_payments", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  paymentNumber: text("payment_number").notNull(), // e.g. VP-0001
  vendorId: text("vendor_id").notNull().references(() => vendors.id),
  date: text("date").notNull(),
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method").notNull(), // "Cash" | "Bank Transfer" | "Easypaisa" | "JazzCash" | "Other"
  referenceNumber: text("reference_number").default(""),
  notes: text("notes").default(""),
  createdBy: text("created_by").default(""),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  shopIdx: index("vp_shop_idx").on(table.shopId),
  vendorIdx: index("vp_vendor_idx").on(table.vendorId),
}));

// ==========================================
// 10. CUSTOMERS
// ==========================================
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  customerCode: text("customer_code").notNull(), // e.g. CST-0001
  name: text("name").notNull(),
  phone: text("phone").default(""),
  whatsapp: text("whatsapp").default(""),
  address: text("address").default(""),
  email: text("email").default(""),
  openingBalance: real("opening_balance").default(0).notNull(), // Initial receivable if positive
  currentReceivable: real("current_receivable").default(0).notNull(), // Total remaining receivable
  notes: text("notes").default(""),
  status: text("status").default("active").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => ({
  shopIdx: index("customers_shop_idx").on(table.shopId),
  codeIdx: index("customers_code_idx").on(table.shopId, table.customerCode),
}));

// ==========================================
// 11. BILLS / SALES
// ==========================================
export const bills = sqliteTable("bills", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  billNumber: text("bill_number").notNull(), // e.g. INV-0001
  customerId: text("customer_id").notNull().references(() => customers.id),
  date: text("date").notNull(),
  subtotal: real("subtotal").default(0).notNull(),
  discountType: text("discount_type").default("fixed").notNull(), // "fixed" | "percentage"
  discountValue: real("discount_value").default(0).notNull(),
  discountAmount: real("discount_amount").default(0).notNull(),
  grandTotal: real("grand_total").default(0).notNull(),
  paidAmount: real("paid_amount").default(0).notNull(),
  remainingBalance: real("remaining_balance").default(0).notNull(),
  paymentMethod: text("payment_method").default("Cash").notNull(),
  paymentStatus: text("payment_status").default("UNPAID").notNull(), // "PAID" | "PARTIAL" | "UNPAID"
  notes: text("notes").default(""),
  createdBy: text("created_by").default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => ({
  shopIdx: index("bills_shop_idx").on(table.shopId),
  customerIdx: index("bills_customer_idx").on(table.customerId),
  numIdx: index("bills_num_idx").on(table.shopId, table.billNumber),
  dateIdx: index("bills_date_idx").on(table.date),
}));

export const billItems = sqliteTable("bill_items", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  billId: text("bill_id").notNull().references(() => bills.id),
  productId: text("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").default("Pcs").notNull(),
  unitPrice: real("unit_price").notNull(),
  discountType: text("discount_type").default("fixed").notNull(),
  discountValue: real("discount_value").default(0).notNull(),
  discountAmount: real("discount_amount").default(0).notNull(),
  totalPrice: real("total_price").notNull(),
}, (table) => ({
  billIdx: index("bi_bill_idx").on(table.billId),
  productIdx: index("bi_product_idx").on(table.productId),
}));

// ==========================================
// 12. CUSTOMER LEDGER (Permanent Chronological History)
// ==========================================
export const customerLedger = sqliteTable("customer_ledger", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  date: text("date").notNull(),
  type: text("type").notNull(), // "OPENING_BALANCE" | "SALE" | "PAYMENT" | "ADJUSTMENT" | "RETURN"
  reference: text("reference").notNull(), // e.g. INV-0001, CP-0001
  description: text("description").notNull(),
  amount: real("amount").default(0).notNull(), // Sales added (Receivable increase)
  payment: real("payment").default(0).notNull(), // Payments received (Receivable decrease)
  balance: real("balance").default(0).notNull(), // Cumulative running receivable balance
  createdAt: text("created_at").notNull(),
}, (table) => ({
  shopIdx: index("cl_shop_idx").on(table.shopId),
  customerIdx: index("cl_customer_idx").on(table.customerId),
  dateIdx: index("cl_date_idx").on(table.date),
}));

// ==========================================
// 13. CUSTOMER PAYMENTS
// ==========================================
export const customerPayments = sqliteTable("customer_payments", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  paymentNumber: text("payment_number").notNull(), // e.g. CP-0001
  customerId: text("customer_id").notNull().references(() => customers.id),
  billId: text("bill_id").references(() => bills.id),
  date: text("date").notNull(),
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  referenceNumber: text("reference_number").default(""),
  notes: text("notes").default(""),
  createdBy: text("created_by").default(""),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  shopIdx: index("cp_shop_idx").on(table.shopId),
  customerIdx: index("cp_customer_idx").on(table.customerId),
}));

// ==========================================
// 14. AUDIT LOGS
// ==========================================
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  userId: text("user_id").default(""),
  userName: text("user_name").default(""),
  action: text("action").notNull(), // "BILL_CREATED" | "BILL_EDITED" | "BILL_DELETED" | "GATE_IN_CREATED" etc.
  recordType: text("record_type").notNull(),
  recordId: text("record_id").notNull(),
  details: text("details").default(""),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  shopIdx: index("al_shop_idx").on(table.shopId),
  dateIdx: index("al_date_idx").on(table.createdAt),
}));

// ==========================================
// 15. BACKUPS RECORD
// ==========================================
export const backups = sqliteTable("backups", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id),
  filename: text("filename").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdBy: text("created_by").default(""),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  shopIdx: index("bk_shop_idx").on(table.shopId),
}));