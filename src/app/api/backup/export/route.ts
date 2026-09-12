export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { backups } from "@/lib/db/schema";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const session = await requirePermission("backup");

    // Extract all database tables
    const shopsData = await db.query.shops.findMany();
    const usersData = await db.query.users.findMany();
    const categoriesData = await db.query.categories.findMany();
    const productsData = await db.query.products.findMany();
    const stockMovementsData = await db.query.stockMovements.findMany();
    const vendorsData = await db.query.vendors.findMany();
    const gateInsData = await db.query.gateIns.findMany();
    const gateInItemsData = await db.query.gateInItems.findMany();
    const vendorLedgerData = await db.query.vendorLedger.findMany();
    const vendorPaymentsData = await db.query.vendorPayments.findMany();
    const customersData = await db.query.customers.findMany();
    const billsData = await db.query.bills.findMany();
    const billItemsData = await db.query.billItems.findMany();
    const customerLedgerData = await db.query.customerLedger.findMany();
    const customerPaymentsData = await db.query.customerPayments.findMany();
    const auditLogsData = await db.query.auditLogs.findMany();

    const backupPayload = {
      version: "1.0",
      system: "Furniture ERP & Ledger System",
      timestamp: new Date().toISOString(),
      shopId: session.shopId,
      createdBy: session.name,
      data: {
        shops: shopsData,
        users: usersData,
        categories: categoriesData,
        products: productsData,
        stockMovements: stockMovementsData,
        vendors: vendorsData,
        gateIns: gateInsData,
        gateInItems: gateInItemsData,
        vendorLedger: vendorLedgerData,
        vendorPayments: vendorPaymentsData,
        customers: customersData,
        bills: billsData,
        billItems: billItemsData,
        customerLedger: customerLedgerData,
        customerPayments: customerPaymentsData,
        auditLogs: auditLogsData,
      },
    };

    const jsonStr = JSON.stringify(backupPayload, null, 2);
    const sizeBytes = Buffer.byteLength(jsonStr, "utf8");
    const filename = `backup_erp_${Date.now()}.json`;

    await db.insert(backups).values({
      id: `bk_${Date.now()}`,
      shopId: session.shopId,
      filename,
      sizeBytes,
      createdBy: session.name,
      notes: "Manual database snapshot creation",
      createdAt: new Date().toISOString(),
    });

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "BACKUP_CREATED",
      recordType: "BACKUP",
      recordId: filename,
      details: { sizeBytes, filename },
    });

    return new Response(jsonStr, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to generate backup." }, { status: 500 });
  }
}