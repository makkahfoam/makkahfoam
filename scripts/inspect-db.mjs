import { createClient } from "@libsql/client";

const client = createClient({ url: "file:local.db" });

async function fix() {
  try {
    await client.execute("ALTER TABLE customer_ledger RENAME COLUMN customerId TO customer_id");
    console.log("Renamed customerId to customer_id successfully");
  } catch (e) {
    console.log("Rename note:", e.message);
  }

  // Also seed some products and category for shop_2 if missing so shop_2 has distinct data
  const shop2Prods = await client.execute("SELECT id FROM products WHERE shop_id = 'shop_2'");
  if (shop2Prods.rows.length === 0) {
    const now = new Date().toISOString();
    await client.execute({
      sql: "INSERT INTO categories (id, shop_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)",
      args: ["cat_s2_living", "shop_2", "Solid Teak Living Collection", "Handcrafted Burma Teak Suites", now]
    });
    await client.execute({
      sql: `INSERT INTO products (id, shop_id, sku, name, category_id, brand, unit, purchase_price, selling_price, current_stock, minimum_stock, description, image_url, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["prod_s2_sofa_1", "shop_2", "HW-SOF-TEAK", "Burma Teak Traditional 5-Seater Sofa", "cat_s2_living", "Heritage Woodcrafts", "Set", 95000, 185000, 6, 2, "100% solid Burma teak with walnut polish.", "", "active", now, now]
    });
    await client.execute({
      sql: `INSERT INTO stock_movements (id, shop_id, product_id, movement_type, quantity, previous_stock, new_stock, reference, user_id, notes, created_at)
            VALUES (?, ?, ?, 'INITIAL', 6, 0, 6, 'INIT-STOCK', 'usr_branch', 'Opening warehouse inventory', datetime('now'))`,
      args: ["sm_init_s2_1", "shop_2", "prod_s2_sofa_1"]
    });
    console.log("Seeded shop_2 category and product");
  }

  const cl = await client.execute("PRAGMA table_info(customer_ledger)");
  console.log("customer_ledger cols:", cl.rows.map(r => r.name).join(", "));
}

fix();
