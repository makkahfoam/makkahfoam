export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, customerPayments, customerLedger, bills, shops } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await requirePermission("customer_payments");
    const body = await request.json();
    const { customerId, billId = null, date, amount, paymentMethod = "Cash", referenceNumber = "", notes = "" } = body;

    const payAmt = Number(amount);
    if (!customerId || !date || isNaN(payAmt) || payAmt <= 0) {
      return NextResponse.json({ success: false, message: "Valid customer, date, and payment amount are required." }, { status: 400 });
    }

    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, customerId), eq(customers.shopId, session.shopId)),
    });

    if (!customer) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    const shop = await db.query.shops.findFirst({ where: eq(shops.id, session.shopId) });
    const counter = shop?.customerPaymentCounter || 1;
    const prefix = shop?.customerPaymentPrefix || "CP-";
    const paymentNumber = `${prefix}${String(counter).padStart(4, "0")}`;

    const now = new Date().toISOString();
    const paymentId = `cp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReceivable = (customer.currentReceivable || 0) - payAmt;

    // Transaction execution:
    // 1. Insert customer payment
    await db.insert(customerPayments).values({
      id: paymentId,
      shopId: session.shopId,
      paymentNumber,
      customerId,
      billId: billId || null,
      date,
      amount: payAmt,
      paymentMethod,
      referenceNumber,
      notes,
      createdBy: session.name,
      createdAt: now,
    });

    // 2. Insert customer ledger receipt entry
    await db.insert(customerLedger).values({
      id: `cl_${paymentId}`,
      shopId: session.shopId,
      customerId,
      date,
      type: "PAYMENT",
      reference: paymentNumber,
      description: `Payment Receipt via ${paymentMethod}${referenceNumber ? ` (Ref: ${referenceNumber})` : ""}`,
      amount: 0,
      payment: payAmt,
      balance: newReceivable,
      createdAt: now,
    });

    // 3. Update customer current receivable balance
    await db.update(customers)
      .set({ currentReceivable: newReceivable, updatedAt: now })
      .where(eq(customers.id, customerId));

    // 4. If linked to a bill, update bill paid and remaining
    if (billId) {
      const b = await db.query.bills.findFirst({ where: eq(bills.id, billId) });
      if (b) {
        const newPaid = (b.paidAmount || 0) + payAmt;
        const newRemaining = Math.max(0, (b.grandTotal || 0) - newPaid);
        const newStatus = newRemaining === 0 ? "PAID" : "PARTIAL";
        await db.update(bills)
          .set({ paidAmount: newPaid, remainingBalance: newRemaining, paymentStatus: newStatus, updatedAt: now })
          .where(eq(bills.id, billId));
      }
    }

    // 5. Increment Shop Counter
    await db.update(shops)
      .set({ customerPaymentCounter: counter + 1, updatedAt: now })
      .where(eq(shops.id, session.shopId));

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "CUSTOMER_PAYMENT",
      recordType: "CUSTOMER_PAYMENT",
      recordId: paymentId,
      details: { customerName: customer.name, paymentNumber, amount: payAmt, newReceivable },
    });

    return NextResponse.json({
      success: true,
      message: `Receipt of ${payAmt} recorded successfully under receipt number ${paymentNumber}.`,
    });
  } catch (err: any) {
    console.error("Customer payment error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to record customer payment" }, { status: 500 });
  }
}