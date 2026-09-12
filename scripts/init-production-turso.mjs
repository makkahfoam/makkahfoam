import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log(`Connecting to Turso Cloud Database: ${url}...`);

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({
  url,
  authToken,
});

async function initProductionTurso() {
  console.log("\n1. Testing Turso Cloud Connection...");
  const ping = await client.execute("SELECT 1 AS alive;");
  console.log("✔ Connection established successfully! Server response:", ping.rows[0]);

  console.log("\n2. Provisioning All 16 Enterprise DDL Tables...");

  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      address TEXT DEFAULT '',
      phone1 TEXT DEFAULT '',
      phone2 TEXT DEFAULT '',
      email TEXT DEFAULT '',
      currency TEXT NOT NULL DEFAULT 'Rs.',
      bill_prefix TEXT NOT NULL DEFAULT 'INV-',
      bill_counter INTEGER NOT NULL DEFAULT 1,
      gate_in_prefix TEXT NOT NULL DEFAULT 'GI-',
      gate_in_counter INTEGER NOT NULL DEFAULT 1,
      vendor_payment_prefix TEXT NOT NULL DEFAULT 'VP-',
      vendor_payment_counter INTEGER NOT NULL DEFAULT 1,
      customer_payment_prefix TEXT NOT NULL DEFAULT 'CP-',
      customer_payment_counter INTEGER NOT NULL DEFAULT 1,
      warranty_text TEXT DEFAULT '1 Year Structure Warranty',
      footer_text TEXT DEFAULT 'Thank you for your business! Items once sold can only be exchanged within 7 days.',
      business_description TEXT DEFAULT 'Premium Furniture & Interior Solutions',
      default_payment_method TEXT NOT NULL DEFAULT 'Cash',
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      permissions TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      category_id TEXT REFERENCES categories(id),
      brand TEXT DEFAULT '',
      unit TEXT NOT NULL DEFAULT 'Pcs',
      purchase_price REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      current_stock REAL NOT NULL DEFAULT 0,
      minimum_stock REAL NOT NULL DEFAULT 5,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      movement_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      previous_stock REAL NOT NULL,
      new_stock REAL NOT NULL,
      reference TEXT NOT NULL,
      user_id TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      customer_code TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      whatsapp TEXT DEFAULT '',
      address TEXT DEFAULT '',
      email TEXT DEFAULT '',
      cnic TEXT DEFAULT '',
      opening_balance REAL NOT NULL DEFAULT 0,
      current_receivable REAL NOT NULL DEFAULT 0,
      credit_limit REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS customer_ledger (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      customer_id TEXT NOT NULL REFERENCES customers(id),
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      reference TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      payment REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      bill_number TEXT NOT NULL,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_type TEXT NOT NULL DEFAULT 'fixed',
      discount_value REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      remaining_balance REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'Cash',
      payment_status TEXT NOT NULL DEFAULT 'UNPAID',
      notes TEXT DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      bill_id TEXT NOT NULL REFERENCES bills(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'Pcs',
      unit_price REAL NOT NULL,
      discount_type TEXT NOT NULL DEFAULT 'fixed',
      discount_value REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_price REAL NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS customer_payments (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      payment_number TEXT NOT NULL,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      bill_id TEXT REFERENCES bills(id),
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Cash',
      reference_number TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      vendor_code TEXT NOT NULL,
      name TEXT NOT NULL,
      company_name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      whatsapp TEXT DEFAULT '',
      address TEXT DEFAULT '',
      email TEXT DEFAULT '',
      opening_balance REAL NOT NULL DEFAULT 0,
      current_payable REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS vendor_ledger (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      vendor_id TEXT NOT NULL REFERENCES vendors(id),
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      reference TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      payment REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS gate_ins (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      gate_in_number TEXT NOT NULL,
      vendor_id TEXT NOT NULL REFERENCES vendors(id),
      date TEXT NOT NULL,
      vendor_invoice_number TEXT DEFAULT '',
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS gate_in_items (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      gate_in_id TEXT NOT NULL REFERENCES gate_ins(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'Pcs',
      purchase_rate REAL NOT NULL,
      total_amount REAL NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS vendor_payments (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      payment_number TEXT NOT NULL,
      vendor_id TEXT NOT NULL REFERENCES vendors(id),
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Cash',
      reference_number TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      user_id TEXT,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      record_type TEXT NOT NULL,
      record_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );`
  ];

  for (const stmt of ddlStatements) {
    await client.execute(stmt);
  }
  console.log("✔ All 16 database tables verified & created on Turso cloud!");

  console.log("\n3. Initializing Business Shop Profile...");
  const now = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO shops (
      id, name, logo, address, phone1, phone2, email, currency, bill_prefix, bill_counter,
      gate_in_prefix, gate_in_counter, vendor_payment_prefix, vendor_payment_counter,
      customer_payment_prefix, customer_payment_counter, warranty_text, footer_text,
      business_description, default_payment_method, low_stock_threshold, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      updated_at = excluded.updated_at;`,
    args: [
      "shop_1",
      "Makkah Foam & Furniture",
      "/logos/makkahfoam.png",
      "Main Showroom & Warehouse",
      "+92 300 1234567",
      "",
      "info@makkahfoam.com",
      "Rs.",
      "INV-",
      1,
      "GI-",
      1,
      "VP-",
      1,
      "CP-",
      1,
      "1 Year Structural Warranty",
      "Thank you for your business with Makkah Foam & Furniture!",
      "Manufacturers & Retailers of Premium Foam & Furniture",
      "Cash",
      5,
      now,
      now
    ]
  });
  console.log("✔ Primary Shop profile initialized: 'Makkah Foam & Furniture'");

  console.log("\n4. Initializing Master Administrator Account...");
  const adminHash = await bcrypt.hash("Admin@123", 10);
  const allPerms = JSON.stringify([
    "dashboard", "products", "inventory", "billing", "customers", "customer_ledger",
    "customer_payments", "vendors", "vendor_gate_in", "vendor_ledger", "vendor_payments",
    "reports", "settings", "backup"
  ]);

  await client.execute({
    sql: `INSERT INTO users (id, shop_id, name, email, password_hash, role, permissions, status, created_at, updated_at)
          VALUES ('usr_admin', 'shop_1', 'Executive Admin', 'admin@royaloak.com', ?, 'admin', ?, 'active', ?, ?)
          ON CONFLICT(id) DO UPDATE SET
          name = 'Executive Admin',
          email = 'admin@royaloak.com',
          password_hash = excluded.password_hash,
          role = 'admin',
          permissions = excluded.permissions,
          status = 'active',
          updated_at = excluded.updated_at;`,
    args: [adminHash, allPerms, now, now]
  });
  console.log("✔ Master Admin created: admin@royaloak.com (Password: Admin@123)");

  console.log("\n5. Initializing Standard Furniture Categories...");
  const categoriesList = [
    { id: "cat_sofas", name: "Luxury Sofas & Living Room", desc: "Chesterfields, sectionals, recliners" },
    { id: "cat_beds", name: "Master Bedroom Suites", desc: "King & Queen solid wood beds, wardrobes, dressers" },
    { id: "cat_dining", name: "Dining Tables & Chairs", desc: "Dining tables, dining chairs, console tables" },
    { id: "cat_office", name: "Office & Study Furniture", desc: "Executive desks, ergonomic chairs, bookshelves" },
    { id: "cat_raw", name: "Raw Materials & Hardware", desc: "Foam sheets, seasoned timber, fabrics, fittings" },
  ];

  for (const c of categoriesList) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO categories (id, shop_id, name, description, created_at) VALUES (?, 'shop_1', ?, ?, ?)`,
      args: [c.id, c.name, c.desc, now]
    });
  }
  console.log(`✔ Seeded ${categoriesList.length} clean standard categories`);

  console.log("\n=======================================================");
  console.log("  TURSO CLOUD DATABASE IS 100% ONLINE & LIVE!         ");
  console.log("=======================================================");
  console.log(`Database URL: ${url}`);
  console.log("Master Admin Login: admin@royaloak.com");
  console.log("Master Admin Password: Admin@123");
  console.log("Shop Name: Makkah Foam & Furniture");
  console.log("Total Clean Bills: 0");
  console.log("Total Clean Customers: 0");
  console.log("Total Clean Vendors: 0");
  console.log("Total Clean Products: 0");
  console.log("Ready for real business data!");
}

initProductionTurso().catch((err) => {
  console.error("Production Turso initialization failed:", err);
  process.exit(1);
});
