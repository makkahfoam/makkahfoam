export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { requireSession, setActiveShopOverride } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Only administrators can switch shop profiles." }, { status: 403 });
    }

    const { shopId } = await request.json();
    if (!shopId) {
      return NextResponse.json({ success: false, message: "Shop ID is required." }, { status: 400 });
    }

    await setActiveShopOverride(shopId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Error switching shop." }, { status: 500 });
  }
}