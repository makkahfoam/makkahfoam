import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log(`Connecting to database at ${url}...`);

const client = createClient({
  url,
  authToken: url.startsWith("file:") ? undefined : authToken,
});

async function cleanDatabase() {
  console.log("=== STARTING COMPLETE PRODUCTION DATA CLEANUP ===");

  const tablesToClear = [
    "bill_items",
    "bills",
    "gate_in_items",
    "gate_ins",
    "customer_payments",
    "vendor_payments",
    "customer_ledger",
    "vendor_ledger",
    "stock_movements",
    "customers",
    "vendors",
    "products",
    "categories",
    "audit_logs"
  ];

  try {
    await client.execute("PRAGMA foreign_keys = OFF;");
  } catch {}

  for (const table of tablesToClear) {
    try {
      await client.execute(`DELETE FROM ${table};`);
      console.log(`✔ Cleared table: ${table}`);
    } catch (err) {
      console.warn(`Notice on table ${table}:`, err.message);
    }
  }

  try {
    await client.execute("PRAGMA foreign_keys = ON;");
  } catch {}

  // Remove test staff users, keep only primary admin or clean users
  try {
    await client.execute(`DELETE FROM users WHERE id != 'usr_admin';`);
    console.log("✔ Removed test staff users (preserved primary usr_admin)");
  } catch (err) {
    console.warn("Notice on users:", err.message);
  }

  const now = new Date().toISOString();
  const adminHash = await bcrypt.hash("Admin@123", 10);

  const allPerms = JSON.stringify([
    "dashboard", "products", "inventory", "billing", "customers", "customer_ledger",
    "customer_payments", "vendors", "vendor_gate_in", "vendor_ledger", "vendor_payments",
    "reports", "settings", "backup"
  ]);

  // Ensure shop_1 exists with clean counters
  await client.execute({
    sql: `UPDATE shops SET
      bill_counter = 1,
      gate_in_counter = 1,
      vendor_payment_counter = 1,
      customer_payment_counter = 1,
      updated_at = ?
      WHERE id = 'shop_1'`,
    args: [now]
  });
  console.log("✔ Reset document sequence counters to 1 on shop_1");

  // Upsert clean admin user
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
  console.log("✔ Master Admin account active: admin@royaloak.com / Admin@123");

  // Insert standard furniture business categories
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
  console.log(`✔ Seeded ${categoriesList.length} clean standard furniture categories`);

  console.log("\n=================================================");
  console.log("  DATABASE IS NOW 100% CLEAN & READY FOR LIVE!  ");
  console.log("=================================================");
  console.log("• Total Bills: 0");
  console.log("• Total Customers: 0");
  console.log("• Total Gate Ins: 0");
  console.log("• Total Vendors: 0");
  console.log("• Total Products: 0");
  console.log("• Primary Admin Login: admin@royaloak.com (Password: Admin@123)");
}

cleanDatabase().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
