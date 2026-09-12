export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, customerLedger } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const session = await requirePermission("customers");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const list = await db.query.customers.findMany({
      where: eq(customers.shopId, session.shopId),
      orderBy: [desc(customers.createdAt)],
    });

    let filtered = list;
    if (search) {
      filtered = list.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.customerCode.toLowerCase().includes(search) ||
          (c.phone && c.phone.includes(search)) ||
          (c.email && c.email.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission("customers");
    const body = await request.json();
    const {
      name,
      phone = "",
      whatsapp = "",
      address = "",
      email = "",
      openingBalance = 0,
      notes = "",
    } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Customer name is required." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const opBal = Number(openingBalance) || 0;
    const customerId = `cst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const customerCode = `CST-${Math.floor(1000 + Math.random() * 9000)}`;

    await db.insert(customers).values({
      id: customerId,
      shopId: session.shopId,
      customerCode,
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      address: address.trim(),
      email: email.trim(),
      openingBalance: opBal,
      currentReceivable: opBal,
      notes: notes.trim(),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Opening balance permanently becomes first customer ledger entry
    if (opBal > 0) {
      await db.insert(customerLedger).values({
        id: `cl_op_${customerId}`,
        shopId: session.shopId,
        customerId,
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
      action: "CUSTOMER_CREATED",
      recordType: "CUSTOMER",
      recordId: customerId,
      details: { name, customerCode, openingBalance: opBal },
    });

    return NextResponse.json({ success: true, message: "Customer created successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to create customer" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requirePermission("customers");
    const body = await request.json();
    const { id, name, phone, whatsapp, address, email, notes, status } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, message: "Customer ID and Name are required" }, { status: 400 });
    }

    await db.update(customers)
      .set({
        name,
        phone,
        whatsapp,
        address,
        email,
        notes,
        status: status || "active",
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(customers.id, id), eq(customers.shopId, session.shopId)));

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "CUSTOMER_EDITED",
      recordType: "CUSTOMER",
      recordId: id,
      details: { name, phone },
    });

    return NextResponse.json({ success: true, message: "Customer updated." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to update customer" }, { status: 500 });
  }
}