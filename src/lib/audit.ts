import { db } from "./db";
import { auditLogs } from "./db/schema";
import { SessionUser } from "./types";

export interface LogAuditParams {
  shopId: string;
  user?: SessionUser | null;
  action: string;
  recordType: string;
  recordId: string;
  details?: any;
}

export async function logAuditEvent({
  shopId,
  user,
  action,
  recordType,
  recordId,
  details,
}: LogAuditParams) {
  try {
    const detailStr = typeof details === "string" ? details : JSON.stringify(details || {});
    await db.insert(auditLogs).values({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      shopId,
      userId: user?.id || "system",
      userName: user?.name || "System Admin",
      action,
      recordType,
      recordId,
      details: detailStr,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}