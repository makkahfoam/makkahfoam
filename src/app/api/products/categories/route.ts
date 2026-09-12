export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireSession();
    const list = await db.query.categories.findMany({
      where: eq(categories.shopId, session.shopId),
      orderBy: [desc(categories.createdAt)],
    });
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ success: false, message: "Category name required" }, { status: 400 });
    }

    const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(categories).values({
      id,
      shopId: session.shopId,
      name: name.trim(),
      description: description || "",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Category created" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Error creating category" }, { status: 500 });
  }
}