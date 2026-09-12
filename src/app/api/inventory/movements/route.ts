export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stockMovements, products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requirePermission("inventory");

    const movements = await db.query.stockMovements.findMany({
      where: eq(stockMovements.shopId, session.shopId),
      orderBy: [desc(stockMovements.createdAt)],
      limit: 200,
    });

    const prods = await db.query.products.findMany({
      where: eq(products.shopId, session.shopId),
    });

    const enriched = movements.map((m) => {
      const p = prods.find((prod) => prod.id === m.productId);
      return {
        ...m,
        productName: p?.name || "Product",
        sku: p?.sku || "-",
        unit: p?.unit || "Pcs",
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to load stock movements" }, { status: 500 });
  }
}