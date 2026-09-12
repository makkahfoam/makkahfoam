export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  bills,
  customerPayments,
  vendorPayments,
  gateIns,
  customers,
  vendors,
  products,
  shops,
} from "@/lib/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const shopId = session.shopId;

    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Fetch Shop info (low stock threshold, currency)
    const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
    const threshold = shop?.lowStockThreshold || 5;

    // 1. Total Customers & Vendors
    const allCustomers = await db.query.customers.findMany({ where: eq(customers.shopId, shopId) });
    const allVendors = await db.query.vendors.findMany({ where: eq(vendors.shopId, shopId) });

    const totalCustomers = allCustomers.length;
    const totalVendors = allVendors.length;

    const customerReceivable = allCustomers.reduce((acc, c) => acc + (c.currentReceivable || 0), 0);
    const vendorPayable = allVendors.reduce((acc, v) => acc + (v.currentPayable || 0), 0);

    // 2. Inventory & Stock Valuation
    const allProducts = await db.query.products.findMany({ where: eq(products.shopId, shopId) });
    const totalStock = allProducts.reduce((acc, p) => acc + (p.currentStock || 0), 0);
    const totalStockValue = allProducts.reduce((acc, p) => acc + (p.currentStock || 0) * (p.purchasePrice || 0), 0);
    const lowStockProducts = allProducts.filter((p) => p.currentStock <= (p.minimumStock || threshold));

    // 3. Today's metrics
    const allBills = await db.query.bills.findMany({ where: eq(bills.shopId, shopId) });
    const allCustPayments = await db.query.customerPayments.findMany({ where: eq(customerPayments.shopId, shopId) });
    const allGateIns = await db.query.gateIns.findMany({ where: eq(gateIns.shopId, shopId) });
    const allVendPayments = await db.query.vendorPayments.findMany({ where: eq(vendorPayments.shopId, shopId) });

    const todaySales = allBills
      .filter((b) => b.date.startsWith(todayStr))
      .reduce((acc, b) => acc + (b.grandTotal || 0), 0);

    const todayPayments = allCustPayments
      .filter((p) => p.date.startsWith(todayStr))
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const todayPurchases = allGateIns
      .filter((g) => g.date.startsWith(todayStr))
      .reduce((acc, g) => acc + (g.totalAmount || 0), 0);

    // 4. Recent activities (top 5 each)
    const recentBills = await db.query.bills.findMany({
      where: eq(bills.shopId, shopId),
      orderBy: [desc(bills.createdAt)],
      limit: 5,
      with: { customer: true },
    }).catch(async () => {
      // fallback without relation if not defined
      const raw = await db.query.bills.findMany({
        where: eq(bills.shopId, shopId),
        orderBy: [desc(bills.createdAt)],
        limit: 5,
      });
      return raw.map((b) => {
        const cust = allCustomers.find((c) => c.id === b.customerId);
        return { ...b, customerName: cust?.name || "Customer" };
      });
    });

    const recentGateIns = allGateIns
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, 5)
      .map((g) => {
        const vnd = allVendors.find((v) => v.id === g.vendorId);
        return { ...g, vendorName: vnd?.name || "Vendor" };
      });

    const recentCustomerPayments = allCustPayments
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, 5)
      .map((p) => {
        const cust = allCustomers.find((c) => c.id === p.customerId);
        return { ...p, customerName: cust?.name || "Customer" };
      });

    const recentVendorPayments = allVendPayments
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, 5)
      .map((p) => {
        const vnd = allVendors.find((v) => v.id === p.vendorId);
        return { ...p, vendorName: vnd?.name || "Vendor" };
      });

    // 5. Chart series data (Last 7 days & monthly breakdown)
    const last7Days: { date: string; sales: number; payments: number; purchases: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const daySales = allBills
        .filter((b) => b.date.startsWith(dStr))
        .reduce((acc, b) => acc + (b.grandTotal || 0), 0);
      const dayCustPay = allCustPayments
        .filter((p) => p.date.startsWith(dStr))
        .reduce((acc, p) => acc + (p.amount || 0), 0);
      const dayPurchases = allGateIns
        .filter((g) => g.date.startsWith(dStr))
        .reduce((acc, g) => acc + (g.totalAmount || 0), 0);

      last7Days.push({
        date: d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
        sales: daySales,
        payments: dayCustPay,
        purchases: dayPurchases,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        currency: shop?.currency || "Rs.",
        metrics: {
          todaySales,
          todayPayments,
          todayPurchases,
          vendorPayable,
          customerReceivable,
          totalStock,
          totalStockValue,
          totalCustomers,
          totalVendors,
          totalBills: allBills.length,
          lowStockCount: lowStockProducts.length,
        },
        lowStockProducts: lowStockProducts.slice(0, 6),
        recentBills,
        recentGateIns,
        recentCustomerPayments,
        recentVendorPayments,
        chartData: last7Days,
      },
    });
  } catch (err: any) {
    console.error("Dashboard API Error:", err);
    return NextResponse.json(
      { success: false, message: "Unable to compile dashboard metrics." },
      { status: 500 }
    );
  }
}