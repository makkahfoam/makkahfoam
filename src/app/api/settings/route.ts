export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const session = await requirePermission("settings");
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, session.shopId),
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: "Shop profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: shop });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message?.includes("FORBIDDEN")) {
      return NextResponse.json({ success: false, message: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch shop settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requirePermission("settings");
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: "Shop name is required" },
        { status: 400 }
      );
    }

    const updatedShop = {
      name: body.name.trim(),
      logo: body.logo?.trim() || null,
      address: body.address?.trim() || "",
      phone1: body.phone1?.trim() || "",
      phone2: body.phone2?.trim() || "",
      email: body.email?.trim() || "",
      currency: body.currency?.trim() || "Rs.",
      billPrefix: body.billPrefix?.trim() || "INV-",
      gateInPrefix: body.gateInPrefix?.trim() || "GI-",
      vendorPaymentPrefix: body.vendorPaymentPrefix?.trim() || "VP-",
      customerPaymentPrefix: body.customerPaymentPrefix?.trim() || "CP-",
      warrantyText: body.warrantyText !== undefined ? body.warrantyText.trim() : "1 Year Structure Warranty",
      footerText: body.footerText !== undefined ? body.footerText.trim() : "Thank you for your business!",
      businessDescription: body.businessDescription?.trim() || "",
      defaultPaymentMethod: body.defaultPaymentMethod || "Cash",
      lowStockThreshold: Number(body.lowStockThreshold) >= 0 ? Number(body.lowStockThreshold) : 5,
      updatedAt: new Date().toISOString(),
    };

    await db.update(shops).set(updatedShop).where(eq(shops.id, session.shopId));

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "UPDATE",
      recordType: "settings",
      recordId: session.shopId,
      details: `Updated shop settings: ${updatedShop.name}`,
    });

    const refreshed = await db.query.shops.findFirst({
      where: eq(shops.id, session.shopId),
    });

    return NextResponse.json({
      success: true,
      message: "Shop settings updated successfully",
      data: refreshed,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message?.includes("FORBIDDEN")) {
      return NextResponse.json({ success: false, message: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update shop settings" },
      { status: 500 }
    );
  }
}
