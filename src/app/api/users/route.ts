export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, shops } from "@/lib/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const session = await requireSession();
    if (session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden: Admin access required." }, { status: 403 });
    }

    const userList = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    });

    const shopList = await db.query.shops.findMany();

    const sanitized = userList.map((u) => {
      const s = shopList.find((shop) => shop.id === u.shopId);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        shopId: u.shopId,
        shopName: s?.name || "Shop",
        permissions: JSON.parse(u.permissions || "[]"),
        status: u.status,
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: sanitized, shops: shopList });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden: Admin access required." }, { status: 403 });
    }

    const currentUsers = await db.query.users.findMany();
    if (currentUsers.length >= 4) {
      return NextResponse.json(
        { success: false, message: "Maximum limit reached. The system allows a maximum of 4 business users/profiles." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, password, shopId, role = "staff", permissions = [] } = body;

    if (!name || !email || !password || !shopId) {
      return NextResponse.json(
        { success: false, message: "Name, email/username, password, and shop assignment are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const existing = await db.query.users.findFirst({
      where: or(
        eq(users.email, cleanEmail),
        eq(users.name, cleanName)
      ),
    });

    if (existing) {
      return NextResponse.json({ success: false, message: "A user with this email/username or name already exists." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await db.insert(users).values({
      id: userId,
      shopId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      permissions: JSON.stringify(permissions),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await logAuditEvent({
      shopId,
      user: session,
      action: "USER_CREATED",
      recordType: "USER",
      recordId: userId,
      details: { name, email, role, shopId, permissions },
    });

    return NextResponse.json({ success: true, message: "User created successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    if (session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, permissions, status, newPassword } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    const updateFields: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updateFields.name = name.trim();
    if (permissions) updateFields.permissions = JSON.stringify(permissions);
    if (status) updateFields.status = status;
    if (newPassword && newPassword.length >= 6) {
      updateFields.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await db.update(users).set(updateFields).where(eq(users.id, id));

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "USER_UPDATED",
      recordType: "USER",
      recordId: id,
      details: { name, status, permissionsUpdated: !!permissions, passwordReset: !!newPassword },
    });

    return NextResponse.json({ success: true, message: "User updated successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession();
    if (session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ success: false, message: "User ID is required." }, { status: 400 });
    }

    // Prevent deleting own user account
    if (id === session.id) {
      return NextResponse.json(
        { success: false, message: "Security restriction: You cannot delete your own active administrator account." },
        { status: 400 }
      );
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    await db.delete(users).where(eq(users.id, id));

    await logAuditEvent({
      shopId: session.shopId,
      user: session,
      action: "USER_DELETED",
      recordType: "USER",
      recordId: id,
      details: { deletedUserName: targetUser.name, deletedUserEmail: targetUser.email },
    });

    return NextResponse.json({ success: true, message: `User '${targetUser.name}' deleted successfully.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to delete user." }, { status: 500 });
  }
}