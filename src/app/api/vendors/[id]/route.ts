export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vendors, vendorLedger, gateIns, gateInItems, vendorPayments, shops } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("vendors");
    const vendorId = params.id;

    const vendor = await db.query.vendors.findFirst({
      where: and(eq(vendors.id, vendorId), eq(vendors.shopId, session.shopId)),
    });

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 });
    }

    // Fetch complete ledger chronologically
    const ledger = await db.query.vendorLedger.findMany({
      where: and(eq(vendorLedger.vendorId, vendorId), eq(vendorLedger.shopId, session.shopId)),
      orderBy: [desc(vendorLedger.date), desc(vendorLedger.createdAt)],
    });

    // Fetch all Gate In purchases for this vendor
    const giList = await db.query.gateIns.findMany({
      where: and(eq(gateIns.vendorId, vendorId), eq(gateIns.shopId, session.shopId)),
      orderBy: [desc(gateIns.createdAt)],
    });

    // Fetch all payments made to this vendor
    const payments = await db.query.vendorPayments.findMany({
      where: and(eq(vendorPayments.vendorId, vendorId), eq(vendorPayments.shopId, session.shopId)),
      orderBy: [desc(vendorPayments.createdAt)],
    });

    // Financial KPI Aggregations
    const totalPurchases = giList.reduce((acc, g) => acc + (g.totalAmount || 0), 0);
    const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const lastTx = ledger.length > 0 ? ledger[0].date : "-";

    const shop = await db.query.shops.findFirst({ where: eq(shops.id, session.shopId) });

    return NextResponse.json({
      success: true,
      data: {
        vendor,
        shop,
        currency: shop?.currency || "Rs.",
        summary: {
          openingBalance: vendor.openingBalance,
          totalPurchases,
          totalPaid,
          currentPayable: vendor.currentPayable,
          gateInCount: giList.length,
          paymentCount: payments.length,
          lastTransactionDate: lastTx,
        },
        ledger,
        gateIns: giList,
        payments,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to load vendor profile" }, { status: 500 });
  }
}

/**
 * DELETE VENDOR
 * Removes vendor profile and safely cascade-deletes related ledger entries,
 * payments, and gate-in purchase items.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("vendors");
    const vendorId = params.id;

    const vendor = await db.query.vendors.findFirst({
      where: and(eq(vendors.id, vendorId), eq(vendors.shopId, session.shopId)),
    });

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 });
    }

    // 1. Delete all ledger entries
    await db.delete(vendorLedger).where(eq(vendorLedger.vendorId, vendorId));

    // 2. Delete all payment records
    await db.delete(vendorPayments).where(eq(vendorPayments.vendorId, vendorId));

    // 3. Find and delete gateIns and gateInItems
    const vendorGIs = await db.query.gateIns.findMany({
      where: eq(gateIns.vendorId, vendorId),
    });
    for (const gi of vendorGIs) {
      await db.delete(gateInItems).where(eq(gateInItems.gateInId, gi.id));
    }
    await db.delete(gateIns).where(eq(gateIns.vendorId, vendorId));

    // 4. Delete the vendor
    await db.delete(vendors).where(eq(vendors.id, vendorId));

    // 5. Audit log
    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "VENDOR_DELETE",
      recordType: "VENDOR",
      recordId: vendorId,
      details: { vendorCode: vendor.vendorCode, name: vendor.name },
    });

    return NextResponse.json({
      success: true,
      message: `Vendor ${vendor.name} (${vendor.vendorCode}) deleted successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to delete vendor" }, { status: 500 });
  }
}