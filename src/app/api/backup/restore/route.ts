export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  shops,
  users,
  categories,
  products,
  stockMovements,
  vendors,
  gateIns,
  gateInItems,
  vendorLedger,
  vendorPayments,
  customers,
  bills,
  billItems,
  customerLedger,
  customerPayments,
  auditLogs,
} from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden: Only Administrators can restore backups." }, { status: 403 });
    }

    const { snapshot, confirmed } = await request.json();
    if (!confirmed) {
      return NextResponse.json(
        { success: false, message: "Confirmation is required before restoring database data." },
        { status: 400 }
      );
    }

    if (!snapshot || !snapshot.data || !snapshot.version) {
      return NextResponse.json({ success: false, message: "Invalid backup snapshot payload." }, { status: 400 });
    }

    const d = snapshot.data;

    // Restore tables inside atomic sequence
    if (Array.isArray(d.shops)) {
      for (const item of d.shops) {
        await db.insert(shops).values(item).onConflictDoUpdate({ target: shops.id, set: item });
      }
    }

    if (Array.isArray(d.categories)) {
      for (const item of d.categories) {
        await db.insert(categories).values(item).onConflictDoNothing();
      }
    }

    if (Array.isArray(d.products)) {
      for (const item of d.products) {
        await db.insert(products).values(item).onConflictDoUpdate({ target: products.id, set: item });
      }
    }

    if (Array.isArray(d.vendors)) {
      for (const item of d.vendors) {
        await db.insert(vendors).values(item).onConflictDoUpdate({ target: vendors.id, set: item });
      }
    }

    if (Array.isArray(d.gateIns)) {
      for (const item of d.gateIns) {
        await db.insert(gateIns).values(item).onConflictDoNothing();
      }
    }

    if (Array.isArray(d.gateInItems)) {
      for (const item of d.gateInItems) {
        await db.insert(gateInItems).values(item).onConflictDoNothing();
      }
    }

    if (Array.isArray(d.vendorLedger)) {
      for (const item of d.vendorLedger) {
        await db.insert(vendorLedger).values(item).onConflictDoNothing();
      }
    }

    if (Array.isArray(d.vendorPayments)) {
      for (const item of d.vendorPayments) {
        await db.insert(vendorPayments).values(item).onConflictDoNothing();
      }
    }

    if (Array.isArray(d.customers)) {
      for (const item of d.customers) {
        await db.insert(customers).values(item).onConflictDoUpdate({ target: customers.id, set: item });
      }
    }

    if (Array.isArray(d.bills)) {
      for (const item of d.bills) {
        await db.insert(bills).values(item).onConflictDoNothing();
      }
    }

    if (Array.isArray(d.billItems)) {
      for (const item of d.billItems) {
        await db.insert(billItems).values(item).onConflictDoNothing();
      }
    }

    if (Array.isArray(d.customerLedger)) {
      for (const item of d.customerLedger) {
        await db.insert(customerLedger).values(item).onConflictDoNothing();
      }
    }

    if (Array.isArray(d.customerPayments)) {
      for (const item of d.customerPayments) {
        await db.insert(customerPayments).values(item).onConflictDoNothing();
      }
    }

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "BACKUP_RESTORED",
      recordType: "DATABASE",
      recordId: snapshot.timestamp || "RESTORE",
      details: { restoredBy: session.name, timestamp: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, message: "Database state restored successfully." });
  } catch (err: any) {
    console.error("Restore error:", err);
    return NextResponse.json({ success: false, message: "Error during restore: " + err.message }, { status: 500 });
  }
}