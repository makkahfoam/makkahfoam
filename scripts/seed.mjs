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

async function runSeed() {
  console.log("Creating tables if not exist...");

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

    `CREATE TABLE IF NOT EXISTS gate_ins (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      gate_in_number TEXT NOT NULL,
      vendor_id TEXT NOT NULL REFERENCES vendors(id),
      date TEXT NOT NULL,
      vendor_invoice_number TEXT DEFAULT '',
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS gate_in_items (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      gate_in_id TEXT NOT NULL REFERENCES gate_ins(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'Pcs',
      purchase_rate REAL NOT NULL,
      total_amount REAL NOT NULL
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

    `CREATE TABLE IF NOT EXISTS vendor_payments (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      payment_number TEXT NOT NULL,
      vendor_id TEXT NOT NULL REFERENCES vendors(id),
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      reference_number TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
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
      opening_balance REAL NOT NULL DEFAULT 0,
      current_receivable REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
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
      created_by TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
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

    `CREATE TABLE IF NOT EXISTS customer_payments (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      payment_number TEXT NOT NULL,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      bill_id TEXT REFERENCES bills(id),
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      reference_number TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      user_id TEXT DEFAULT '',
      user_name TEXT DEFAULT '',
      action TEXT NOT NULL,
      record_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      details TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      filename TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_by TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );`
  ];

  for (const sql of ddlStatements) {
    await client.execute(sql);
  }
  console.log("All tables verified/created successfully.");

  // Check if Shop 1 already exists
  const checkShop = await client.execute({ sql: "SELECT id FROM shops WHERE id = 'shop_1'", args: [] });
  if (checkShop.rows.length > 0) {
    console.log("Database already seeded. Skipping initial inserts.");
    return;
  }

  const now = new Date().toISOString();

  // 1. Insert 2 Shops (Shop 1 and Shop 2)
  await client.execute({
    sql: `INSERT INTO shops (
      id, name, logo, address, phone1, phone2, email, currency, bill_prefix, bill_counter,
      gate_in_prefix, gate_in_counter, vendor_payment_prefix, vendor_payment_counter,
      customer_payment_prefix, customer_payment_counter, warranty_text, footer_text,
      business_description, default_payment_method, low_stock_threshold, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "shop_1",
      "Royal Oak Luxury Living",
      "/logos/royaloak.png",
      "Plot 42, Main Boulevard, Gulberg III, Lahore",
      "+92 300 8472910",
      "+92 42 35789123",
      "info@royaloakliving.com",
      "Rs.",
      "RO-",
      2,
      "ROGI-",
      2,
      "ROVP-",
      2,
      "ROCP-",
      3,
      "1 Year Structural & Polish Warranty",
      "Thank you for choosing Royal Oak Luxury Living. Items once sold can be exchanged within 7 days with original invoice.",
      "Manufacturers & Importers of Bespoke Italian & Solid Sheesham Furniture",
      "Cash",
      5,
      now,
      now
    ]
  });

  await client.execute({
    sql: `INSERT INTO shops (
      id, name, logo, address, phone1, phone2, email, currency, bill_prefix, bill_counter,
      gate_in_prefix, gate_in_counter, vendor_payment_prefix, vendor_payment_counter,
      customer_payment_prefix, customer_payment_counter, warranty_text, footer_text,
      business_description, default_payment_method, low_stock_threshold, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "shop_2",
      "Heritage Woodcrafts & Interiors",
      "/logos/heritagewood.png",
      "Shop 14-16, Zamzama Commercial Lane 5, DHA Phase 5, Karachi",
      "+92 321 9876543",
      "+92 21 35874120",
      "sales@heritagewoodcrafts.com",
      "Rs.",
      "HW-",
      1,
      "HWGI-",
      1,
      "HWVP-",
      1,
      "HWCP-",
      1,
      "2 Year Solid Teak Guarantee",
      "Heritage Woodcrafts provides lifetime authenticity certification for pure hardwood furniture.",
      "Handmade Classic Sheesham & Burma Teak Living Room Suites",
      "Bank Transfer",
      3,
      now,
      now
    ]
  });

  console.log("Shops seeded.");

  // 2. Insert 4 Users with realistic credentials
  // Admin password: "Admin@123"
  // Staff password: "Staff@123"
  const adminHash = await bcrypt.hash("Admin@123", 10);
  const staffHash = await bcrypt.hash("Staff@123", 10);

  const allPerms = JSON.stringify([
    "dashboard", "products", "inventory", "billing", "customers", "customer_ledger",
    "customer_payments", "vendors", "vendor_gate_in", "vendor_ledger", "vendor_payments",
    "reports", "settings", "backup"
  ]);

  const salesPerms = JSON.stringify([
    "dashboard", "products", "inventory", "billing", "customers", "customer_ledger",
    "customer_payments", "reports"
  ]);

  const purchasePerms = JSON.stringify([
    "dashboard", "products", "inventory", "vendors", "vendor_gate_in", "vendor_ledger",
    "vendor_payments"
  ]);

  const branchManagerPerms = JSON.stringify([
    "dashboard", "products", "inventory", "billing", "customers", "customer_ledger",
    "customer_payments", "vendors", "vendor_gate_in", "vendor_ledger", "vendor_payments",
    "reports", "settings"
  ]);

  await client.execute({
    sql: `INSERT INTO users (id, shop_id, name, email, password_hash, role, permissions, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["usr_admin", "shop_1", "Executive Admin", "admin@royaloak.com", adminHash, "admin", allPerms, "active", now, now]
  });

  await client.execute({
    sql: `INSERT INTO users (id, shop_id, name, email, password_hash, role, permissions, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["usr_sales", "shop_1", "Tariq Mehmood (Sales)", "sales@royaloak.com", staffHash, "staff", salesPerms, "active", now, now]
  });

  await client.execute({
    sql: `INSERT INTO users (id, shop_id, name, email, password_hash, role, permissions, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["usr_purchase", "shop_1", "Bilal Khan (Warehouse)", "purchase@royaloak.com", staffHash, "staff", purchasePerms, "active", now, now]
  });

  await client.execute({
    sql: `INSERT INTO users (id, shop_id, name, email, password_hash, role, permissions, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["usr_branch", "shop_2", "Suleman Farooq (Branch Mgr)", "manager@heritagewood.com", staffHash, "staff", branchManagerPerms, "active", now, now]
  });

  console.log("Users seeded.");

  // 3. Categories
  const categoriesList = [
    { id: "cat_sofas", name: "Luxury Sofas & Living Room", desc: "Chesterfields, L-shape sectionals, accent recliners" },
    { id: "cat_beds", name: "Master Bedroom Suites", desc: "King & Queen solid Sheesham beds, dressers, side tables" },
    { id: "cat_dining", name: "Executive Dining Tables", desc: "6, 8, and 10 seater marble and solid wood dining sets" },
    { id: "cat_office", name: "Ergonomic Office & Study", desc: "Executive leather chairs, study desks, conference tables" },
    { id: "cat_raw", name: "Raw Materials & Hardware", desc: "High density foam sheets, timber wood planks, fabric, hinges" },
  ];

  for (const c of categoriesList) {
    await client.execute({
      sql: `INSERT INTO categories (id, shop_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [c.id, "shop_1", c.name, c.desc, now]
    });
  }

  // 4. Products
  const productsList = [
    {
      id: "prod_sofa_1",
      sku: "SOF-CHEST-3S",
      name: "Chesterfield 3-Seater Royal Velvet Sofa",
      catId: "cat_sofas",
      brand: "Royal Oak Crafted",
      unit: "Set",
      purchasePrice: 65000,
      sellingPrice: 120000,
      currentStock: 14,
      minStock: 3,
      desc: "Deep button tufted premium velvet with solid Sheesham inner structure and high density 42D foam."
    },
    {
      id: "prod_bed_1",
      sku: "BED-KING-ROYAL",
      name: "King Size Carved Sheesham Bed Set",
      catId: "cat_beds",
      brand: "Royal Oak Heritage",
      unit: "Set",
      purchasePrice: 85000,
      sellingPrice: 165000,
      currentStock: 8,
      minStock: 2,
      desc: "Hand-carved traditional floral crown with 2 matching nightstands and hydraulic storage option."
    },
    {
      id: "prod_dining_1",
      sku: "DIN-MARBLE-8S",
      name: "8-Seater Italian Carrara Marble Dining Set",
      catId: "cat_dining",
      brand: "Milano Imports",
      unit: "Set",
      purchasePrice: 130000,
      sellingPrice: 245000,
      currentStock: 4,
      minStock: 2,
      desc: "Imported heat-resistant marble top with walnut base and 8 padded microfiber ergonomic chairs."
    },
    {
      id: "prod_chair_1",
      sku: "CHR-EXEC-LEA",
      name: "Executive High-Back Leatherette Office Chair",
      catId: "cat_office",
      brand: "ErgoComfort",
      unit: "Pcs",
      purchasePrice: 16000,
      sellingPrice: 28000,
      currentStock: 22,
      minStock: 5,
      desc: "Synchronized tilt mechanism, class-4 gas lift, memory foam padding with chrome base."
    },
    {
      id: "prod_raw_foam",
      sku: "RAW-FOAM-HD42",
      name: "Diamond High-Density Foam 6x2 Sheet",
      catId: "cat_raw",
      brand: "ABC Foam",
      unit: "Pcs",
      purchasePrice: 5000,
      sellingPrice: 7500,
      currentStock: 50,
      minStock: 10,
      desc: "42 density high resilience foam sheets for upholstery manufacturing."
    },
    {
      id: "prod_raw_wood",
      sku: "RAW-TIMBER-SH",
      name: "Seasoned Sheesham Timber Planks (Cubic Ft)",
      catId: "cat_raw",
      brand: "Punjab Forest Traders",
      unit: "Feet",
      purchasePrice: 2200,
      sellingPrice: 3200,
      currentStock: 120,
      minStock: 20,
      desc: "Kiln-dried seasoned grade-A dark rosewood timber planks."
    }
  ];

  for (const p of productsList) {
    await client.execute({
      sql: `INSERT INTO products (id, shop_id, sku, name, category_id, brand, unit, purchase_price, selling_price, current_stock, minimum_stock, description, image_url, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, "shop_1", p.sku, p.name, p.catId, p.brand, p.unit, p.purchasePrice, p.sellingPrice, p.currentStock, p.minStock, p.desc, "", "active", now, now]
    });

    // Add initial stock movement
    await client.execute({
      sql: `INSERT INTO stock_movements (id, shop_id, product_id, movement_type, quantity, previous_stock, new_stock, reference, user_id, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [`sm_init_${p.id}`, "shop_1", p.id, "INITIAL", p.currentStock, 0, p.currentStock, "INIT-STOCK", "usr_admin", "Opening warehouse inventory", now]
    });
  }

  console.log("Products and initial stock movements seeded.");

  // 5. Vendors
  // Vendor 1: ABC Foam (Opening Balance 20,000)
  await client.execute({
    sql: `INSERT INTO vendors (id, shop_id, vendor_code, name, company_name, phone, whatsapp, address, email, opening_balance, current_payable, notes, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["vnd_abc_foam", "shop_1", "VND-0001", "ABC Foam Industries", "ABC Foam & Cushioning Ltd.", "+92 312 4455667", "+92 312 4455667", "Industrial Estate Kot Lakhpat, Lahore", "orders@abcfoam.pk", 20000, 50000, "Primary polyurethane foam supplier. 30-day payment term.", "active", now, now]
  });

  // Opening balance ledger for ABC Foam
  await client.execute({
    sql: `INSERT INTO vendor_ledger (id, shop_id, vendor_id, date, type, reference, description, amount, payment, balance, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["vl_op_vnd_abc", "shop_1", "vnd_abc_foam", "2026-09-01", "OPENING_BALANCE", "OP-BAL", "Opening Balance Brought Forward", 20000, 0, 20000, now]
  });

  // Gate In 1 for ABC Foam: 10 pcs of Foam @ Rs 5,000 = Rs 50,000
  // Running balance becomes: 20,000 + 50,000 = 70,000
  await client.execute({
    sql: `INSERT INTO gate_ins (id, shop_id, gate_in_number, vendor_id, date, vendor_invoice_number, total_amount, notes, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["gi_0001", "shop_1", "ROGI-0001", "vnd_abc_foam", "2026-09-05", "INV-ABC-984", 50000, "Delivered via truck LHR-5421", "Bilal Khan", now]
  });

  await client.execute({
    sql: `INSERT INTO gate_in_items (id, shop_id, gate_in_id, product_id, product_name, quantity, unit, purchase_rate, total_amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["gii_0001_1", "shop_1", "gi_0001", "prod_raw_foam", "Diamond High-Density Foam 6x2 Sheet", 10, "Pcs", 5000, 50000]
  });

  // Stock movement for Gate In
  await client.execute({
    sql: `INSERT INTO stock_movements (id, shop_id, product_id, movement_type, quantity, previous_stock, new_stock, reference, user_id, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["sm_gi_0001", "shop_1", "prod_raw_foam", "GATE_IN", 10, 40, 50, "ROGI-0001", "usr_purchase", "Received from ABC Foam Industries", now]
  });

  // Vendor ledger entry for Gate In
  await client.execute({
    sql: `INSERT INTO vendor_ledger (id, shop_id, vendor_id, date, type, reference, description, amount, payment, balance, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["vl_gi_0001", "shop_1", "vnd_abc_foam", "2026-09-05", "GATE_IN", "ROGI-0001", "Diamond High-Density Foam 6x2 Sheet x 10", 50000, 0, 70000, now]
  });

  // Vendor Payment 1: Rs 20,000 Cash paid to ABC Foam
  // Running balance becomes: 70,000 - 20,000 = 50,000
  await client.execute({
    sql: `INSERT INTO vendor_payments (id, shop_id, payment_number, vendor_id, date, amount, payment_method, reference_number, notes, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["vp_0001", "shop_1", "ROVP-0001", "vnd_abc_foam", "2026-09-10", 20000, "Cash", "CHQ-88210", "Partial settlement against Invoice ABC-984", "Executive Admin", now]
  });

  await client.execute({
    sql: `INSERT INTO vendor_ledger (id, shop_id, vendor_id, date, type, reference, description, amount, payment, balance, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["vl_vp_0001", "shop_1", "vnd_abc_foam", "2026-09-10", "PAYMENT", "ROVP-0001", "Payment via Cash (Ref: CHQ-88210)", 0, 20000, 50000, now]
  });

  // Vendor 2: Timber Craft
  await client.execute({
    sql: `INSERT INTO vendors (id, shop_id, vendor_code, name, company_name, phone, whatsapp, address, email, opening_balance, current_payable, notes, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["vnd_timber_craft", "shop_1", "VND-0002", "Timber Craft Wood Traders", "Timber Craft Pvt Ltd", "+92 301 5566778", "+92 301 5566778", "Circular Road Timber Market, Lahore", "sales@timbercraft.pk", 0, 0, "High grade Sheesham & Walnut logs.", "active", now, now]
  });

  console.log("Vendors, Gate In, and Vendor Ledger entries seeded.");

  // 6. Customers
  // Customer 1: Ali Raza (Opening Balance: 0, Buys sofa for 120,000, Advance 50,000, Payment 30,000 -> Remaining 40,000)
  await client.execute({
    sql: `INSERT INTO customers (id, shop_id, customer_code, name, phone, whatsapp, address, email, opening_balance, current_receivable, notes, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["cst_ali_raza", "shop_1", "CST-0001", "Ali Raza", "+92 322 8899112", "+92 322 8899112", "House 18, Street 4, Sector Y, DHA Phase 3, Lahore", "ali.raza@gmail.com", 0, 40000, "VIP residential customer.", "active", now, now]
  });

  // Bill 1 for Ali Raza:
  await client.execute({
    sql: `INSERT INTO bills (id, shop_id, bill_number, customer_id, date, subtotal, discount_type, discount_value, discount_amount, grand_total, paid_amount, remaining_balance, payment_method, payment_status, notes, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["bill_0001", "shop_1", "RO-0001", "cst_ali_raza", "2026-09-08", 120000, "fixed", 0, 0, 120000, 80000, 40000, "Cash", "PARTIAL", "Delivery scheduled for Monday afternoon.", "Tariq Mehmood", now, now]
  });

  await client.execute({
    sql: `INSERT INTO bill_items (id, shop_id, bill_id, product_id, product_name, quantity, unit, unit_price, discount_type, discount_value, discount_amount, total_price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["bi_0001_1", "shop_1", "bill_0001", "prod_sofa_1", "Chesterfield 3-Seater Royal Velvet Sofa", 1, "Set", 120000, "fixed", 0, 0, 120000]
  });

  // Stock movement for sale
  await client.execute({
    sql: `INSERT INTO stock_movements (id, shop_id, product_id, movement_type, quantity, previous_stock, new_stock, reference, user_id, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["sm_sale_0001", "shop_1", "prod_sofa_1", "SALE", 1, 15, 14, "RO-0001", "usr_sales", "Sold on invoice RO-0001", now]
  });

  // Customer Ledger: Sale entry (Sale = 120,000, Balance = 120,000)
  await client.execute({
    sql: `INSERT INTO customer_ledger (id, shop_id, customer_id, date, type, reference, description, amount, payment, balance, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["cl_sale_0001", "shop_1", "cst_ali_raza", "2026-09-08", "SALE", "RO-0001", "Chesterfield 3-Seater Royal Velvet Sofa x 1", 120000, 0, 120000, now]
  });

  // Customer Payment 1 (Advance at billing: Rs 50,000 Cash, Balance = 70,000)
  await client.execute({
    sql: `INSERT INTO customer_payments (id, shop_id, payment_number, customer_id, bill_id, date, amount, payment_method, reference_number, notes, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["cp_0001", "shop_1", "ROCP-0001", "cst_ali_raza", "bill_0001", "2026-09-08", 50000, "Cash", "CASH-ADV", "Advance received upon booking invoice RO-0001", "Tariq Mehmood", now]
  });

  await client.execute({
    sql: `INSERT INTO customer_ledger (id, shop_id, customer_id, date, type, reference, description, amount, payment, balance, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["cl_cp_0001", "shop_1", "cst_ali_raza", "2026-09-08", "PAYMENT", "ROCP-0001", "Advance Payment via Cash", 0, 50000, 70000, now]
  });

  // Customer Payment 2: Rs 30,000 Bank Transfer on 2026-09-10 (Balance = 40,000)
  await client.execute({
    sql: `INSERT INTO customer_payments (id, shop_id, payment_number, customer_id, bill_id, date, amount, payment_method, reference_number, notes, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["cp_0002", "shop_1", "ROCP-0002", "cst_ali_raza", "bill_0001", "2026-09-10", 30000, "Bank Transfer", "MBL-TRF-9941", "Online bank transfer to Meezan Account", "Executive Admin", now]
  });

  await client.execute({
    sql: `INSERT INTO customer_ledger (id, shop_id, customer_id, date, type, reference, description, amount, payment, balance, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["cl_cp_0002", "shop_1", "cst_ali_raza", "2026-09-10", "PAYMENT", "ROCP-0002", "Payment via Bank Transfer (Ref: MBL-TRF-9941)", 0, 30000, 40000, now]
  });

  // Customer 2: Fatima Zahra (Opening balance 50,000)
  await client.execute({
    sql: `INSERT INTO customers (id, shop_id, customer_code, name, phone, whatsapp, address, email, opening_balance, current_receivable, notes, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["cst_fatima", "shop_1", "CST-0002", "Fatima Zahra Interiors", "+92 333 4455889", "+92 333 4455889", "Office 7, Arfa Software Tech Park, Lahore", "fatima@zahradesigns.pk", 50000, 50000, "Commercial interior decorator client.", "active", now, now]
  });

  await client.execute({
    sql: `INSERT INTO customer_ledger (id, shop_id, customer_id, date, type, reference, description, amount, payment, balance, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["cl_op_fatima", "shop_1", "cst_fatima", "2026-09-01", "OPENING_BALANCE", "OP-BAL", "Opening Balance Brought Forward", 50000, 0, 50000, now]
  });

  // 7. Initial Audit Logs
  await client.execute({
    sql: `INSERT INTO audit_logs (id, shop_id, user_id, user_name, action, record_type, record_id, details, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["log_seed_1", "shop_1", "usr_admin", "Executive Admin", "SHOP_INITIALIZED", "SHOP", "shop_1", "Database seeded with initial enterprise configuration", now]
  });

  console.log("Database seeded successfully with all tables, shops, users, products, gate in, bills, and ledgers!");
}

runSeed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});