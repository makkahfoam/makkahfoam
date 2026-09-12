import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "../db";
import { users, shops } from "../db/schema";
import { eq } from "drizzle-orm";
import { SessionUser, PermissionKey } from "../types";
import { hasPermission } from "./permissions";

const SESSION_COOKIE_NAME = "furniture_erp_session";
const ACTIVE_SHOP_COOKIE_NAME = "furniture_erp_active_shop";
const SECRET = process.env.SESSION_SECRET || "furniture-erp-production-secret-encryption-key-secure-2026";

function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payload);
  return `${payload}.${hmac.digest("hex")}`;
}

function verify(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return payload;
  }
  return null;
}

export async function createSession(user: { id: string; shopId: string }) {
  const payload = JSON.stringify({ userId: user.id, shopId: user.shopId, iat: Date.now() });
  const signedToken = sign(Buffer.from(payload).toString("base64"));
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(ACTIVE_SHOP_COOKIE_NAME);
}

export async function setActiveShopOverride(shopId: string) {
  const cookieStore = cookies();
  cookieStore.set(ACTIVE_SHOP_COOKIE_NAME, shopId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const rawPayload = verify(token);
    if (!rawPayload) return null;

    const data = JSON.parse(Buffer.from(rawPayload, "base64").toString("utf-8"));
    const userId = data.userId;

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!userRecord || userRecord.status !== "active") return null;

    // Check if admin has active shop override
    let activeShopId = userRecord.shopId;
    if (userRecord.role === "admin") {
      const overrideShopId = cookieStore.get(ACTIVE_SHOP_COOKIE_NAME)?.value;
      if (overrideShopId) {
        activeShopId = overrideShopId;
      }
    }

    const shopRecord = await db.query.shops.findFirst({
      where: eq(shops.id, activeShopId),
    });

    let perms: PermissionKey[] = [];
    try {
      perms = JSON.parse(userRecord.permissions || "[]");
    } catch {
      perms = [];
    }

    return {
      id: userRecord.id,
      shopId: activeShopId,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role as "admin" | "staff",
      permissions: perms,
      shopName: shopRecord?.name || "Furniture Enterprise",
      currency: shopRecord?.currency || "Rs.",
      logo: shopRecord?.logo || null,
    };
  } catch (err) {
    console.error("Session verification error:", err);
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requirePermission(permission: PermissionKey): Promise<SessionUser> {
  const session = await requireSession();
  if (!hasPermission(session.permissions, permission, session.role)) {
    throw new Error(`FORBIDDEN: Missing permission '${permission}'`);
  }
  return session;
}