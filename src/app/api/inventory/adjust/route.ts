export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, stockMovements } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await requirePermission("inventory");
    const { productId, type, quantity, reason } = await request.json();

    if (!productId || !type || quantity === undefined) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.shopId, session.shopId)),
    });

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const previousStock = product.currentStock;
    const qty = Math.abs(Number(quantity));
    let newStock = previousStock;
    let movementType = "ADJUSTMENT_ADD";

    if (type === "ADD") {
      newStock = previousStock + qty;
      movementType = "ADJUSTMENT_ADD";
    } else if (type === "SUBTRACT") {
      if (previousStock < qty) {
        return NextResponse.json(
          { success: false, message: `Cannot subtract ${qty}. Only ${previousStock} units currently in stock.` },
          { status: 400 }
        );
      }
      newStock = previousStock - qty;
      movementType = "ADJUSTMENT_SUB";
    } else if (type === "SET") {
      newStock = qty;
      movementType = newStock >= previousStock ? "ADJUSTMENT_ADD" : "ADJUSTMENT_SUB";
    }

    const now = new Date().toISOString();

    // Update Product Stock
    await db.update(products)
      .set({ currentStock: newStock, updatedAt: now })
      .where(eq(products.id, productId));

    // Create Stock Movement Audit Record
    const refCode = `ADJ-${Date.now().toString().slice(-4)}`;
    await db.insert(stockMovements).values({
      id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shopId: session.shopId,
      productId,
      movementType,
      quantity: Math.abs(newStock - previousStock),
      previousStock,
      newStock,
      reference: refCode,
      userId: session.id,
      notes: reason || "Manual stock reconciliation",
      createdAt: now,
    });

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "STOCK_ADJUSTMENT",
      recordType: "PRODUCT",
      recordId: productId,
      details: { previousStock, newStock, reason, refCode },
    });

    return NextResponse.json({
      success: true,
      message: `Stock updated successfully from ${previousStock} to ${newStock} ${product.unit}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to adjust stock." }, { status: 500 });
  }
}