export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";

export async function GET() {
  try {
    const list = await db.query.shops.findMany();
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to load shops" }, { status: 500 });
  }
}