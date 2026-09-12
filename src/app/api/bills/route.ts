export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  bills,
  billItems,
  products,
  stockMovements,
  customers,
  customerLedger,
  customerPayments,
  shops,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const session = await requirePermission("billing");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const customerId = searchParams.get("customerId");

    const allBills = await db.query.bills.findMany({
      where: eq(bills.shopId, session.shopId),
      orderBy: [desc(bills.createdAt)],
    });

    const allCusts = await db.query.customers.findMany({
      where: eq(customers.shopId, session.shopId),
    });

    let enriched = allBills.map((b) => {
      const c = allCusts.find((cust) => cust.id === b.customerId);
      return {
        ...b,
        customerName: c?.name || "Customer",
        customerPhone: c?.phone || "",
      };
    });

    if (customerId) {
      enriched = enriched.filter((b) => b.customerId === customerId);
    }

    if (search) {
      enriched = enriched.filter(
        (b) =>
          b.billNumber.toLowerCase().includes(search) ||
          b.customerName.toLowerCase().includes(search) ||
          (b.customerPhone && b.customerPhone.includes(search))
      );
    }

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to load bills" }, { status: 500 });
  }
}

/**
 * ATOMIC BILL CREATION (POS / INVOICE)
 * 1. Validate sufficient product stocks
 * 2. Insert Bill Header
 * 3. Insert Bill Items
 * 4. Deduct Product Stocks & Insert Stock Movement Records
 * 5. Update Customer Ledger Sale Entry
 * 6. If Advance Paid > 0, Insert Payment Record & Payment Ledger Entry
 * 7. Update Customer Current Receivable
 * 8. Increment Shop Bill Counter
 * 9. Record Audit Event
 */
export async function POST(request: Request) {
  try {
    const session = await requirePermission("billing");
    const body = await request.json();
    const {
      customerId,
      date,
      items,
      discountType = "fixed",
      discountValue = 0,
      paidAmount = 0,
      paymentMethod = "Cash",
      notes = "",
    } = body;

    if (!customerId || !date || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Customer, date, and at least one item are required." },
        { status: 400 }
      );
    }

    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, customerId), eq(customers.shopId, session.shopId)),
    });

    if (!customer) {
      return NextResponse.json({ success: false, message: "Customer not found." }, { status: 404 });
    }

    const shop = await db.query.shops.findFirst({ where: eq(shops.id, session.shopId) });
    const counter = shop?.billCounter || 1;
    const prefix = shop?.billPrefix || "INV-";
    const billNumber = `${prefix}${String(counter).padStart(4, "0")}`;

    const now = new Date().toISOString();
    const billId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Validate Items & Check Stocks
    let subtotal = 0;
    const validatedItems: any[] = [];
    const itemSummaries: string[] = [];

    for (const item of items) {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const itemDiscType = item.discountType || "fixed";
      const itemDiscVal = Number(item.discountValue) || 0;

      if (!item.productId || isNaN(qty) || qty <= 0) {
        return NextResponse.json(
          { success: false, message: "Each item must have a selected product and positive quantity." },
          { status: 400 }
        );
      }

      const prod = await db.query.products.findFirst({
        where: and(eq(products.id, item.productId), eq(products.shopId, session.shopId)),
      });

      if (!prod) {
        return NextResponse.json({ success: false, message: `Product not found.` }, { status: 404 });
      }

      // Stock Check
      if (prod.currentStock < qty) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for "${prod.name}". Available: ${prod.currentStock} ${prod.unit}, Requested: ${qty}.`,
          },
          { status: 400 }
        );
      }

      const rawItemTotal = qty * price;
      const itemDiscAmt =
        itemDiscType === "percentage" ? (rawItemTotal * itemDiscVal) / 100 : itemDiscVal;
      const lineTotal = Math.max(0, rawItemTotal - itemDiscAmt);

      subtotal += lineTotal;

      validatedItems.push({
        id: `bi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shopId: session.shopId,
        billId,
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unit: prod.unit,
        unitPrice: price,
        discountType: itemDiscType,
        discountValue: itemDiscVal,
        discountAmount: itemDiscAmt,
        totalPrice: lineTotal,
        currentStock: prod.currentStock,
      });

      itemSummaries.push(`${prod.name} x ${qty} ${prod.unit}`);
    }

    // Bill Overall Discount
    const overallDiscVal = Number(discountValue) || 0;
    const overallDiscAmt =
      discountType === "percentage" ? (subtotal * overallDiscVal) / 100 : overallDiscVal;
    const grandTotal = Math.max(0, subtotal - overallDiscAmt);

    const advance = Math.min(grandTotal, Math.max(0, Number(paidAmount) || 0));
    const remaining = grandTotal - advance;
    const paymentStatus = remaining === 0 ? "PAID" : advance > 0 ? "PARTIAL" : "UNPAID";

    // 1. Insert Bill
    await db.insert(bills).values({
      id: billId,
      shopId: session.shopId,
      billNumber,
      customerId,
      date,
      subtotal,
      discountType,
      discountValue: overallDiscVal,
      discountAmount: overallDiscAmt,
      grandTotal,
      paidAmount: advance,
      remainingBalance: remaining,
      paymentMethod,
      paymentStatus,
      notes,
      createdBy: session.name,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Insert Bill Items & Deduct Stocks & Create Stock Movement Records
    for (const vItem of validatedItems) {
      await db.insert(billItems).values({
        id: vItem.id,
        shopId: session.shopId,
        billId: vItem.billId,
        productId: vItem.productId,
        productName: vItem.productName,
        quantity: vItem.quantity,
        unit: vItem.unit,
        unitPrice: vItem.unitPrice,
        discountType: vItem.discountType,
        discountValue: vItem.discountValue,
        discountAmount: vItem.discountAmount,
        totalPrice: vItem.totalPrice,
      });

      const newStock = vItem.currentStock - vItem.quantity;
      await db.update(products)
        .set({ currentStock: newStock, updatedAt: now })
        .where(eq(products.id, vItem.productId));

      await db.insert(stockMovements).values({
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shopId: session.shopId,
        productId: vItem.productId,
        movementType: "SALE",
        quantity: vItem.quantity,
        previousStock: vItem.currentStock,
        newStock,
        reference: billNumber,
        userId: session.id,
        notes: `Sold on invoice ${billNumber} to ${customer.name}`,
        createdAt: now,
      });
    }

    // 3. Post Customer Ledger Sale Entry (Receivable increases by grandTotal)
    const saleRunningBal = (customer.currentReceivable || 0) + grandTotal;
    await db.insert(customerLedger).values({
      id: `cl_sale_${billId}`,
      shopId: session.shopId,
      customerId,
      date,
      type: "SALE",
      reference: billNumber,
      description: itemSummaries.join(", "),
      amount: grandTotal,
      payment: 0,
      balance: saleRunningBal,
      createdAt: now,
    });

    let finalReceivable = saleRunningBal;

    // 4. If Advance Paid > 0, Record Customer Payment & Ledger Entry
    if (advance > 0) {
      const custCounter = shop?.customerPaymentCounter || 1;
      const custPrefix = shop?.customerPaymentPrefix || "CP-";
      const paymentNumber = `${custPrefix}${String(custCounter).padStart(4, "0")}`;
      finalReceivable = saleRunningBal - advance;

      await db.insert(customerPayments).values({
        id: `cp_adv_${billId}`,
        shopId: session.shopId,
        paymentNumber,
        customerId,
        billId,
        date,
        amount: advance,
        paymentMethod,
        referenceNumber: `ADV-${billNumber}`,
        notes: `Advance payment upon booking bill ${billNumber}`,
        createdBy: session.name,
        createdAt: now,
      });

      await db.insert(customerLedger).values({
        id: `cl_adv_${billId}`,
        shopId: session.shopId,
        customerId,
        date,
        type: "PAYMENT",
        reference: paymentNumber,
        description: `Advance Payment via ${paymentMethod} against ${billNumber}`,
        amount: 0,
        payment: advance,
        balance: finalReceivable,
        createdAt: now,
      });

      await db.update(shops)
        .set({ customerPaymentCounter: custCounter + 1, updatedAt: now })
        .where(eq(shops.id, session.shopId));
    }

    // 5. Update Customer Current Receivable
    await db.update(customers)
      .set({ currentReceivable: finalReceivable, updatedAt: now })
      .where(eq(customers.id, customerId));

    // 6. Increment Shop Bill Counter
    await db.update(shops)
      .set({ billCounter: counter + 1, updatedAt: now })
      .where(eq(shops.id, session.shopId));

    // 7. Audit Event
    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "BILL_CREATED",
      recordType: "BILL",
      recordId: billId,
      details: { billNumber, customerName: customer.name, grandTotal, advance, remaining },
    });

    return NextResponse.json({
      success: true,
      message: `Bill ${billNumber} generated successfully.`,
      data: { billId, billNumber },
    });
  } catch (err: any) {
    console.error("Bill creation error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to create bill" }, { status: 500 });
  }
}