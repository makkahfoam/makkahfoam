export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vendors, vendorPayments, vendorLedger, shops } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await requirePermission("vendor_payments");
    const body = await request.json();
    const { vendorId, date, amount, paymentMethod = "Cash", referenceNumber = "", notes = "" } = body;

    const payAmt = Number(amount);
    if (!vendorId || !date || isNaN(payAmt) || payAmt <= 0) {
      return NextResponse.json({ success: false, message: "Valid vendor, date, and payment amount are required." }, { status: 400 });
    }

    const vendor = await db.query.vendors.findFirst({
      where: and(eq(vendors.id, vendorId), eq(vendors.shopId, session.shopId)),
    });

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 });
    }

    const shop = await db.query.shops.findFirst({ where: eq(shops.id, session.shopId) });
    const counter = shop?.vendorPaymentCounter || 1;
    const prefix = shop?.vendorPaymentPrefix || "VP-";
    const paymentNumber = `${prefix}${String(counter).padStart(4, "0")}`;

    const now = new Date().toISOString();
    const paymentId = `vp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newPayable = (vendor.currentPayable || 0) - payAmt;

    // Transaction execution:
    // 1. Insert vendor payment record
    await db.insert(vendorPayments).values({
      id: paymentId,
      shopId: session.shopId,
      paymentNumber,
      vendorId,
      date,
      amount: payAmt,
      paymentMethod,
      referenceNumber,
      notes,
      createdBy: session.name,
      createdAt: now,
    });

    // 2. Insert vendor ledger entry
    await db.insert(vendorLedger).values({
      id: `vl_${paymentId}`,
      shopId: session.shopId,
      vendorId,
      date,
      type: "PAYMENT",
      reference: paymentNumber,
      description: `Payment via ${paymentMethod}${referenceNumber ? ` (Ref: ${referenceNumber})` : ""}`,
      amount: 0,
      payment: payAmt,
      balance: newPayable,
      createdAt: now,
    });

    // 3. Update vendor current payable
    await db.update(vendors)
      .set({ currentPayable: newPayable, updatedAt: now })
      .where(eq(vendors.id, vendorId));

    // 4. Increment shop counter
    await db.update(shops)
      .set({ vendorPaymentCounter: counter + 1, updatedAt: now })
      .where(eq(shops.id, session.shopId));

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "VENDOR_PAYMENT",
      recordType: "VENDOR_PAYMENT",
      recordId: paymentId,
      details: { vendorName: vendor.name, paymentNumber, amount: payAmt, paymentMethod, newPayable },
    });

    return NextResponse.json({
      success: true,
      message: `Payment of ${payAmt} recorded successfully against voucher ${paymentNumber}.`,
    });
  } catch (err: any) {
    console.error("Vendor payment error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to record payment" }, { status: 500 });
  }
}