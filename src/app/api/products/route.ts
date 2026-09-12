export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, categories, stockMovements } from "@/lib/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { requireSession, requirePermission } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const session = await requirePermission("products");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";

    const allProds = await db.query.products.findMany({
      where: eq(products.shopId, session.shopId),
      orderBy: [desc(products.createdAt)],
    });

    const allCats = await db.query.categories.findMany({
      where: eq(categories.shopId, session.shopId),
    });

    let filtered = allProds.map((p) => {
      const cat = allCats.find((c) => c.id === p.categoryId);
      return { ...p, categoryName: cat?.name || "Uncategorized" };
    });

    if (categoryId && categoryId !== "ALL") {
      filtered = filtered.filter((p) => p.categoryId === categoryId);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission("products");
    const body = await request.json();

    const {
      sku,
      name,
      categoryId,
      brand,
      unit = "Pcs",
      purchasePrice = 0,
      sellingPrice = 0,
      currentStock = 0,
      minimumStock = 5,
      description = "",
    } = body;

    if (!sku || !name) {
      return NextResponse.json(
        { success: false, message: "Product SKU and Name are required." },
        { status: 400 }
      );
    }

    // Check SKU uniqueness within this shop
    const existing = await db.query.products.findFirst({
      where: and(eq(products.shopId, session.shopId), eq(products.sku, sku.trim().toUpperCase())),
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Product with SKU '${sku}' already exists in this shop.` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await db.insert(products).values({
      id: prodId,
      shopId: session.shopId,
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      categoryId: categoryId || null,
      brand: brand || "",
      unit: unit || "Pcs",
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      currentStock: Number(currentStock) || 0,
      minimumStock: Number(minimumStock) || 5,
      description: description || "",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // If initial stock provided, log stock movement
    if (Number(currentStock) > 0) {
      await db.insert(stockMovements).values({
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shopId: session.shopId,
        productId: prodId,
        movementType: "INITIAL",
        quantity: Number(currentStock),
        previousStock: 0,
        newStock: Number(currentStock),
        reference: "INIT-PRODUCT",
        userId: session.id,
        notes: "Initial inventory setup upon product creation",
        createdAt: now,
      });
    }

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "PRODUCT_CREATED",
      recordType: "PRODUCT",
      recordId: prodId,
      details: { sku, name, currentStock, sellingPrice },
    });

    return NextResponse.json({ success: true, message: "Product created successfully." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requirePermission("products");
    const body = await request.json();
    const { id, name, categoryId, brand, unit, purchasePrice, sellingPrice, minimumStock, description } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Product ID required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    await db.update(products)
      .set({
        name,
        categoryId: categoryId || null,
        brand,
        unit,
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        minimumStock: Number(minimumStock) || 5,
        description,
        updatedAt: now,
      })
      .where(and(eq(products.id, id), eq(products.shopId, session.shopId)));

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "PRODUCT_EDITED",
      recordType: "PRODUCT",
      recordId: id,
      details: { name, sellingPrice, purchasePrice },
    });

    return NextResponse.json({ success: true, message: "Product updated successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requirePermission("products");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Product ID required" }, { status: 400 });
    }

    await db.delete(products).where(and(eq(products.id, id), eq(products.shopId, session.shopId)));

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "PRODUCT_DELETED",
      recordType: "PRODUCT",
      recordId: id,
    });

    return NextResponse.json({ success: true, message: "Product removed." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to delete product." }, { status: 500 });
  }
}