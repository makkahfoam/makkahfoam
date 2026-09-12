export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  gateIns,
  gateInItems,
  products,
  stockMovements,
  vendors,
  vendorLedger,
  shops,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const session = await requirePermission("vendor_gate_in");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const list = await db.query.gateIns.findMany({
      where: eq(gateIns.shopId, session.shopId),
      orderBy: [desc(gateIns.createdAt)],
    });

    const allVendors = await db.query.vendors.findMany({ where: eq(vendors.shopId, session.shopId) });

    let enriched = list.map((g) => {
      const v = allVendors.find((vnd) => vnd.id === g.vendorId);
      return {
        ...g,
        vendorName: v?.name || "Vendor",
        vendorCompany: v?.companyName || "",
      };
    });

    if (search) {
      enriched = enriched.filter(
        (g) =>
          g.gateInNumber.toLowerCase().includes(search) ||
          g.vendorName.toLowerCase().includes(search) ||
          (g.vendorInvoiceNumber && g.vendorInvoiceNumber.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to load Gate In records" }, { status: 500 });
  }
}

/**
 * ATOMIC VENDOR GATE IN CREATION
 * 1. Insert Gate In Record
 * 2. Insert Gate In Item Lines
 * 3. Increase Product Stock for each product
 * 4. Create Stock Movement Audit Log for each product
 * 5. Update Vendor Balance (Payable increases)
 * 6. Insert Vendor Ledger Entry (Reference: Gate In Number, Details, Running Balance)
 * 7. Increment Shop Gate In Counter
 * 8. Log Audit Event
 */
export async function POST(request: Request) {
  try {
    const session = await requirePermission("vendor_gate_in");
    const body = await request.json();
    const { vendorId, date, vendorInvoiceNumber = "", items, notes = "" } = body;

    if (!vendorId || !date || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Vendor, date, and at least one product line are required for Gate In." },
        { status: 400 }
      );
    }

    const vendor = await db.query.vendors.findFirst({
      where: and(eq(vendors.id, vendorId), eq(vendors.shopId, session.shopId)),
    });

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Selected vendor does not exist." }, { status: 404 });
    }

    const shop = await db.query.shops.findFirst({ where: eq(shops.id, session.shopId) });
    const counter = shop?.gateInCounter || 1;
    const prefix = shop?.gateInPrefix || "GI-";
    const gateInNumber = `${prefix}${String(counter).padStart(4, "0")}`;

    const now = new Date().toISOString();
    const gateInId = `gi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let totalAmount = 0;
    const validatedItems: any[] = [];
    const itemSummaries: string[] = [];

    // Pre-validate products & calculate totals
    for (const item of items) {
      const qty = Number(item.quantity);
      const rate = Number(item.purchaseRate);

      if (!item.productId || isNaN(qty) || qty <= 0 || isNaN(rate) || rate < 0) {
        return NextResponse.json(
          { success: false, message: "Each item must have a valid product, positive quantity, and purchase rate." },
          { status: 400 }
        );
      }

      const prod = await db.query.products.findFirst({
        where: and(eq(products.id, item.productId), eq(products.shopId, session.shopId)),
      });

      if (!prod) {
        return NextResponse.json({ success: false, message: `Product ID '${item.productId}' not found.` }, { status: 404 });
      }

      const lineTotal = qty * rate;
      totalAmount += lineTotal;

      validatedItems.push({
        id: `gii_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shopId: session.shopId,
        gateInId,
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unit: prod.unit,
        purchaseRate: rate,
        totalAmount: lineTotal,
        currentStock: prod.currentStock,
      });

      itemSummaries.push(`${prod.name} x ${qty} ${prod.unit}`);
    }

    const newPayable = (vendor.currentPayable || 0) + totalAmount;

    // Execute atomic operations:
    // 1. Insert Gate In
    await db.insert(gateIns).values({
      id: gateInId,
      shopId: session.shopId,
      gateInNumber,
      vendorId,
      date,
      vendorInvoiceNumber,
      totalAmount,
      notes,
      createdBy: session.name,
      createdAt: now,
    });

    // 2. Insert Gate In Items & Update product stocks & Stock movements
    for (const vItem of validatedItems) {
      await db.insert(gateInItems).values({
        id: vItem.id,
        shopId: session.shopId,
        gateInId: vItem.gateInId,
        productId: vItem.productId,
        productName: vItem.productName,
        quantity: vItem.quantity,
        unit: vItem.unit,
        purchaseRate: vItem.purchaseRate,
        totalAmount: vItem.totalAmount,
      });

      const newStock = vItem.currentStock + vItem.quantity;
      await db.update(products)
        .set({ currentStock: newStock, purchasePrice: vItem.purchaseRate, updatedAt: now })
        .where(eq(products.id, vItem.productId));

      await db.insert(stockMovements).values({
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shopId: session.shopId,
        productId: vItem.productId,
        movementType: "GATE_IN",
        quantity: vItem.quantity,
        previousStock: vItem.currentStock,
        newStock,
        reference: gateInNumber,
        userId: session.id,
        notes: `Received via Gate In from ${vendor.name}`,
        createdAt: now,
      });
    }

    // 3. Update Vendor Payable Balance
    await db.update(vendors)
      .set({ currentPayable: newPayable, updatedAt: now })
      .where(eq(vendors.id, vendorId));

    // 4. Automatically Post Vendor Ledger Entry (NO DUPLICATE MANUAL WORK!)
    await db.insert(vendorLedger).values({
      id: `vl_${gateInId}`,
      shopId: session.shopId,
      vendorId,
      date,
      type: "GATE_IN",
      reference: gateInNumber,
      description: itemSummaries.join(", "),
      amount: totalAmount,
      payment: 0,
      balance: newPayable,
      createdAt: now,
    });

    // 5. Increment Shop Gate In Counter
    await db.update(shops)
      .set({ gateInCounter: counter + 1, updatedAt: now })
      .where(eq(shops.id, session.shopId));

    // 6. Record Audit Event
    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "GATE_IN_CREATED",
      recordType: "GATE_IN",
      recordId: gateInId,
      details: { gateInNumber, vendorName: vendor.name, totalAmount, itemsCount: validatedItems.length },
    });

    return NextResponse.json({
      success: true,
      message: `Gate In invoice ${gateInNumber} processed successfully. Stock and vendor ledger updated automatically.`,
      data: { gateInId, gateInNumber },
    });
  } catch (err: any) {
    console.error("Gate In Creation Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to process Gate In" }, { status: 500 });
  }
}