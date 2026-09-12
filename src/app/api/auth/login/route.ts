export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Please provide both email/username and password." },
        { status: 400 }
      );
    }

    const identifier = email.trim().toLowerCase();

    const user = await db.query.users.findFirst({
      where: or(
        eq(sql`lower(${users.email})`, identifier),
        eq(sql`lower(${users.name})`, identifier)
      ),
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password. Please verify credentials." },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, message: "This account has been deactivated. Please contact your administrator." },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password. Please verify credentials." },
        { status: 401 }
      );
    }

    await createSession({ id: user.id, shopId: user.shopId });

    await logAuditEvent({
      shopId: user.shopId,
      user: {
        id: user.id,
        shopId: user.shopId,
        name: user.name,
        email: user.email,
        role: user.role as any,
        permissions: [],
        shopName: "",
        currency: "Rs.",
      },
      action: "USER_LOGIN",
      recordType: "USER",
      recordId: user.id,
      details: { email: user.email, timestamp: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, message: "Login successful" });
  } catch (err: any) {
    console.error("Login API Error:", err);
    return NextResponse.json(
      { success: false, message: "Unable to process login. Please try again." },
      { status: 500 }
    );
  }
}