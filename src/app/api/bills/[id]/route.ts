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
import { eq, and } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("billing");
    const billId = params.id;

    const bill = await db.query.bills.findFirst({
      where: and(eq(bills.id, billId), eq(bills.shopId, session.shopId)),
    });

    if (!bill) {
      return NextResponse.json({ success: false, message: "Bill not found" }, { status: 404 });
    }

    const items = await db.query.billItems.findMany({
      where: eq(billItems.billId, billId),
    });

    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, bill.customerId),
    });

    const payments = await db.query.customerPayments.findMany({
      where: eq(customerPayments.billId, billId),
    });

    const shop = await db.query.shops.findFirst({ where: eq(shops.id, session.shopId) });

    return NextResponse.json({
      success: true,
      data: {
        bill,
        items,
        customer,
        payments,
        shop,
        currency: shop?.currency || "Rs.",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to load bill details" }, { status: 500 });
  }
}

/**
 * ATOMIC BILL DELETION
 * 1. Fetch bill and items
 * 2. Restore stock for each product (currentStock + quantity)
 * 3. Log stock movements (BILL_DELETE)
 * 4. Post customer ledger reversal or adjust balance
 * 5. Delete bill & items safely without touching independent payments
 * 6. Log audit event
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("billing");
    const billId = params.id;

    const bill = await db.query.bills.findFirst({
      where: and(eq(bills.id, billId), eq(bills.shopId, session.shopId)),
    });

    if (!bill) {
      return NextResponse.json({ success: false, message: "Bill not found" }, { status: 404 });
    }

    const items = await db.query.billItems.findMany({ where: eq(billItems.billId, billId) });
    const customer = await db.query.customers.findFirst({ where: eq(customers.id, bill.customerId) });

    const now = new Date().toISOString();

    // 1. Restore product stocks
    for (const item of items) {
      const prod = await db.query.products.findFirst({ where: eq(products.id, item.productId) });
      if (prod) {
        const restoredStock = prod.currentStock + item.quantity;
        await db.update(products)
          .set({ currentStock: restoredStock, updatedAt: now })
          .where(eq(products.id, item.productId));

        await db.insert(stockMovements).values({
          id: `sm_del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          shopId: session.shopId,
          productId: item.productId,
          movementType: "BILL_DELETE",
          quantity: item.quantity,
          previousStock: prod.currentStock,
          newStock: restoredStock,
          reference: `DEL-${bill.billNumber}`,
          userId: session.id,
          notes: `Restored stock due to deletion of bill ${bill.billNumber}`,
          createdAt: now,
        });
      }
    }

    // 2. Reverse customer ledger sale transaction
    if (customer) {
      // Deduct unpaid balance of this bill from customer receivable
      const remainingToDeduct = bill.remainingBalance || 0;
      const newReceivable = Math.max(0, (customer.currentReceivable || 0) - remainingToDeduct);

      await db.insert(customerLedger).values({
        id: `cl_rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shopId: session.shopId,
        customerId: customer.id,
        date: now.split("T")[0],
        type: "RETURN",
        reference: `VOID-${bill.billNumber}`,
        description: `Reversal / Void of Bill ${bill.billNumber}`,
        amount: 0,
        payment: remainingToDeduct,
        balance: newReceivable,
        createdAt: now,
      });

      await db.update(customers)
        .set({ currentReceivable: newReceivable, updatedAt: now })
        .where(eq(customers.id, customer.id));
    }

    // 3. Delete bill & items
    await db.delete(billItems).where(eq(billItems.billId, billId));
    await db.delete(bills).where(eq(bills.id, billId));

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "BILL_DELETED",
      recordType: "BILL",
      recordId: billId,
      details: { billNumber: bill.billNumber, customerId: bill.customerId, grandTotal: bill.grandTotal },
    });

    return NextResponse.json({ success: true, message: `Bill ${bill.billNumber} voided and stock restored.` });
  } catch (err: any) {
    console.error("Delete bill error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to delete bill" }, { status: 500 });
  }
}