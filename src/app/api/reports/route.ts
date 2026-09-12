export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  bills,
  billItems,
  gateIns,
  gateInItems,
  customerPayments,
  vendorPayments,
  customers,
  vendors,
  products,
  stockMovements,
  shops,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const session = await requirePermission("reports");
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "sales"; // sales, purchases, outstanding, payables, stock, payments, userwise
    const dateRange = searchParams.get("range") || "ALL";

    const shopId = session.shopId;
    const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
    const currency = shop?.currency || "Rs.";

    // Date filtering helper
    const matchesDate = (dStr: string) => {
      if (dateRange === "ALL") return true;
      const today = new Date().toISOString().split("T")[0];
      if (dateRange === "TODAY") return dStr.startsWith(today);
      if (dateRange === "THIS_MONTH") {
        const ym = new Date().toISOString().slice(0, 7);
        return dStr.startsWith(ym);
      }
      if (dateRange === "THIS_YEAR") {
        const y = new Date().getFullYear().toString();
        return dStr.startsWith(y);
      }
      return true;
    };

    if (type === "sales") {
      const allBills = await db.query.bills.findMany({
        where: eq(bills.shopId, shopId),
        orderBy: [desc(bills.date)],
      });
      const allCusts = await db.query.customers.findMany({ where: eq(customers.shopId, shopId) });

      const filtered = allBills.filter((b) => matchesDate(b.date)).map((b) => {
        const c = allCusts.find((cust) => cust.id === b.customerId);
        return {
          ...b,
          customerName: c?.name || "Customer",
        };
      });

      const totalSales = filtered.reduce((acc, b) => acc + b.grandTotal, 0);
      const totalPaid = filtered.reduce((acc, b) => acc + b.paidAmount, 0);
      const totalOutstanding = filtered.reduce((acc, b) => acc + b.remainingBalance, 0);

      return NextResponse.json({
        success: true,
        data: {
          items: filtered,
          summary: { totalSales, totalPaid, totalOutstanding, count: filtered.length },
          currency,
        },
      });
    }

    if (type === "purchases" || type === "gate_in") {
      const allGI = await db.query.gateIns.findMany({
        where: eq(gateIns.shopId, shopId),
        orderBy: [desc(gateIns.date)],
      });
      const allVends = await db.query.vendors.findMany({ where: eq(vendors.shopId, shopId) });

      const filtered = allGI.filter((g) => matchesDate(g.date)).map((g) => {
        const v = allVends.find((vnd) => vnd.id === g.vendorId);
        return {
          ...g,
          vendorName: v?.name || "Vendor",
          vendorCompany: v?.companyName || "",
        };
      });

      const totalPurchases = filtered.reduce((acc, g) => acc + g.totalAmount, 0);

      return NextResponse.json({
        success: true,
        data: {
          items: filtered,
          summary: { totalPurchases, count: filtered.length },
          currency,
        },
      });
    }

    if (type === "outstanding") {
      const allCusts = await db.query.customers.findMany({
        where: eq(customers.shopId, shopId),
        orderBy: [desc(customers.currentReceivable)],
      });

      const totalOutstanding = allCusts.reduce((acc, c) => acc + (c.currentReceivable || 0), 0);

      return NextResponse.json({
        success: true,
        data: {
          items: allCusts.filter((c) => c.currentReceivable > 0),
          summary: { totalOutstanding, count: allCusts.filter((c) => c.currentReceivable > 0).length },
          currency,
        },
      });
    }

    if (type === "payables") {
      const allVends = await db.query.vendors.findMany({
        where: eq(vendors.shopId, shopId),
        orderBy: [desc(vendors.currentPayable)],
      });

      const totalPayable = allVends.reduce((acc, v) => acc + (v.currentPayable || 0), 0);

      return NextResponse.json({
        success: true,
        data: {
          items: allVends.filter((v) => v.currentPayable > 0),
          summary: { totalPayable, count: allVends.filter((v) => v.currentPayable > 0).length },
          currency,
        },
      });
    }

    if (type === "stock") {
      const allProds = await db.query.products.findMany({
        where: eq(products.shopId, shopId),
        orderBy: [desc(products.currentStock)],
      });

      const totalUnits = allProds.reduce((acc, p) => acc + p.currentStock, 0);
      const totalCostValue = allProds.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);
      const totalRetailValue = allProds.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);

      return NextResponse.json({
        success: true,
        data: {
          items: allProds,
          summary: { totalUnits, totalCostValue, totalRetailValue, count: allProds.length },
          currency,
        },
      });
    }

    if (type === "payments") {
      const custP = await db.query.customerPayments.findMany({
        where: eq(customerPayments.shopId, shopId),
        orderBy: [desc(customerPayments.date)],
      });
      const vendP = await db.query.vendorPayments.findMany({
        where: eq(vendorPayments.shopId, shopId),
        orderBy: [desc(vendorPayments.date)],
      });

      const allCusts = await db.query.customers.findMany({ where: eq(customers.shopId, shopId) });
      const allVends = await db.query.vendors.findMany({ where: eq(vendors.shopId, shopId) });

      const filteredCustP = custP.filter((p) => matchesDate(p.date)).map((p) => {
        const c = allCusts.find((cust) => cust.id === p.customerId);
        return { ...p, partyName: c?.name || "Customer", flowType: "INFLOW (Receipt)" };
      });

      const filteredVendP = vendP.filter((p) => matchesDate(p.date)).map((p) => {
        const v = allVends.find((vnd) => vnd.id === p.vendorId);
        return { ...p, partyName: v?.name || "Vendor", flowType: "OUTFLOW (Payment)" };
      });

      const totalReceived = filteredCustP.reduce((acc, p) => acc + p.amount, 0);
      const totalDisbursed = filteredVendP.reduce((acc, p) => acc + p.amount, 0);
      const netCashFlow = totalReceived - totalDisbursed;

      return NextResponse.json({
        success: true,
        data: {
          receipts: filteredCustP,
          disbursements: filteredVendP,
          summary: { totalReceived, totalDisbursed, netCashFlow },
          currency,
        },
      });
    }

    return NextResponse.json({ success: false, message: "Unknown report type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Error compiling report" }, { status: 500 });
  }
}