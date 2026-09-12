export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, customerLedger, bills, billItems, customerPayments, shops } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("customers");
    const customerId = params.id;

    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, customerId), eq(customers.shopId, session.shopId)),
    });

    if (!customer) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    // Chronological ledger
    const ledger = await db.query.customerLedger.findMany({
      where: and(eq(customerLedger.customerId, customerId), eq(customerLedger.shopId, session.shopId)),
      orderBy: [desc(customerLedger.date), desc(customerLedger.createdAt)],
    });

    // Bills
    const customerBills = await db.query.bills.findMany({
      where: and(eq(bills.customerId, customerId), eq(bills.shopId, session.shopId)),
      orderBy: [desc(bills.createdAt)],
    });

    // Payments
    const payments = await db.query.customerPayments.findMany({
      where: and(eq(customerPayments.customerId, customerId), eq(customerPayments.shopId, session.shopId)),
      orderBy: [desc(customerPayments.createdAt)],
    });

    const totalSales = customerBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
    const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const lastTx = ledger.length > 0 ? ledger[0].date : "-";

    const shop = await db.query.shops.findFirst({ where: eq(shops.id, session.shopId) });

    return NextResponse.json({
      success: true,
      data: {
        customer,
        shop,
        currency: shop?.currency || "Rs.",
        summary: {
          openingBalance: customer.openingBalance,
          totalSales,
          totalPaid,
          outstanding: customer.currentReceivable,
          totalBills: customerBills.length,
          paymentCount: payments.length,
          lastTransactionDate: lastTx,
        },
        ledger,
        bills: customerBills,
        payments,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to load customer profile" }, { status: 500 });
  }
}

/**
 * DELETE CUSTOMER
 * Safely deletes customer profile along with ledger entries and payments.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("customers");
    const customerId = params.id;

    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, customerId), eq(customers.shopId, session.shopId)),
    });

    if (!customer) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    // 1. Delete customer ledger
    await db.delete(customerLedger).where(eq(customerLedger.customerId, customerId));

    // 2. Delete customer payments
    await db.delete(customerPayments).where(eq(customerPayments.customerId, customerId));

    // 3. Delete bills and billItems
    const cBills = await db.query.bills.findMany({ where: eq(bills.customerId, customerId) });
    for (const b of cBills) {
      await db.delete(billItems).where(eq(billItems.billId, b.id));
    }
    await db.delete(bills).where(eq(bills.customerId, customerId));

    // 4. Delete the customer
    await db.delete(customers).where(eq(customers.id, customerId));

    // 5. Audit log
    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "CUSTOMER_DELETE",
      recordType: "CUSTOMER",
      recordId: customerId,
      details: { customerCode: customer.customerCode, name: customer.name },
    });

    return NextResponse.json({
      success: true,
      message: `Customer ${customer.name} (${customer.customerCode}) deleted successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to delete customer" }, { status: 500 });
  }
}