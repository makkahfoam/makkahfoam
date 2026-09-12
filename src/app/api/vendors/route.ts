export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vendors, vendorLedger, shops } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const session = await requirePermission("vendors");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const list = await db.query.vendors.findMany({
      where: eq(vendors.shopId, session.shopId),
      orderBy: [desc(vendors.createdAt)],
    });

    let filtered = list;
    if (search) {
      filtered = list.filter(
        (v) =>
          v.name.toLowerCase().includes(search) ||
          v.vendorCode.toLowerCase().includes(search) ||
          (v.companyName && v.companyName.toLowerCase().includes(search)) ||
          (v.phone && v.phone.includes(search))
      );
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission("vendors");
    const body = await request.json();
    const {
      name,
      companyName = "",
      phone = "",
      whatsapp = "",
      address = "",
      email = "",
      openingBalance = 0,
      notes = "",
    } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Vendor Name is required." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const opBal = Number(openingBalance) || 0;
    const vendorId = `vnd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const vendorCode = `VND-${Math.floor(1000 + Math.random() * 9000)}`;

    // Insert Vendor Record
    await db.insert(vendors).values({
      id: vendorId,
      shopId: session.shopId,
      vendorCode,
      name: name.trim(),
      companyName: companyName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      address: address.trim(),
      email: email.trim(),
      openingBalance: opBal,
      currentPayable: opBal,
      notes: notes.trim(),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // If opening balance > 0, make it the permanent initial entry in the vendor ledger
    if (opBal > 0) {
      await db.insert(vendorLedger).values({
        id: `vl_op_${vendorId}`,
        shopId: session.shopId,
        vendorId,
        date: now.split("T")[0],
        type: "OPENING_BALANCE",
        reference: "OP-BAL",
        description: "Opening Balance Brought Forward",
        amount: opBal,
        payment: 0,
        balance: opBal,
        createdAt: now,
      });
    }

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "VENDOR_CREATED",
      recordType: "VENDOR",
      recordId: vendorId,
      details: { name, companyName, openingBalance: opBal },
    });

    return NextResponse.json({ success: true, message: "Vendor profile created successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to create vendor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requirePermission("vendors");
    const body = await request.json();
    const { id, name, companyName, phone, whatsapp, address, email, notes, status } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, message: "Vendor ID and Name are required" }, { status: 400 });
    }

    await db.update(vendors)
      .set({
        name,
        companyName,
        phone,
        whatsapp,
        address,
        email,
        notes,
        status: status || "active",
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(vendors.id, id), eq(vendors.shopId, session.shopId)));

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "VENDOR_EDITED",
      recordType: "VENDOR",
      recordId: id,
      details: { name, companyName, phone },
    });

    return NextResponse.json({ success: true, message: "Vendor updated." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to update vendor" }, { status: 500 });
  }
}