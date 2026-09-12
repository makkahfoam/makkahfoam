"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ReceiptText,
  CreditCard,
  Truck,
  Users,
  Building2,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  FileSpreadsheet,
  Layers,
  DollarSign,
  Calendar,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-md w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-80 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  const curr = data?.currency || "Rs.";
  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar & Action Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 font-mono text-[11px]">
              Live Feed
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time sales, inventory valuation, customer ledger receivables & vendor payables overview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/billing/new">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 shadow-xs">
              <PlusCircle className="h-4 w-4" />
              <span>Create Bill</span>
            </Button>
          </Link>
          <Link href="/purchasing/gate-in">
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-800 flex items-center space-x-1.5 bg-white">
              <Truck className="h-4 w-4 text-amber-600" />
              <span>Vendor Gate In</span>
            </Button>
          </Link>
          <Link href="/customers/payments">
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-800 flex items-center space-x-1.5 bg-white">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span>Customer Receipt</span>
            </Button>
          </Link>
          <Link href="/vendors/payments">
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-800 flex items-center space-x-1.5 bg-white">
              <CreditCard className="h-4 w-4 text-rose-600" />
              <span>Vendor Payment</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card className="border-slate-200 hover:border-amber-400 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Sales</CardTitle>
            <div className="h-8 w-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(m.todaySales, curr)}</div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center">
              <span className="text-emerald-600 font-semibold inline-flex items-center mr-1">
                <ArrowUpRight className="h-3 w-3" /> Total Bills: {m.totalBills}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Today's Customer Receipts */}
        <Card className="border-slate-200 hover:border-emerald-400 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Collections</CardTitle>
            <div className="h-8 w-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-emerald-700">{formatCurrency(m.todayPayments, curr)}</div>
            <p className="text-[11px] text-slate-500 mt-1">Direct receipts & bill advances</p>
          </CardContent>
        </Card>

        {/* Customer Receivable */}
        <Card className="border-slate-200 hover:border-blue-400 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer Receivable</CardTitle>
            <div className="h-8 w-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-blue-700">{formatCurrency(m.customerReceivable, curr)}</div>
            <p className="text-[11px] text-slate-500 mt-1">Outstanding from {m.totalCustomers} customers</p>
          </CardContent>
        </Card>

        {/* Vendor Payable */}
        <Card className="border-slate-200 hover:border-rose-400 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vendor Payable</CardTitle>
            <div className="h-8 w-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-rose-700">{formatCurrency(m.vendorPayable, curr)}</div>
            <p className="text-[11px] text-slate-500 mt-1">Pending disbursements to {m.totalVendors} vendors</p>
          </CardContent>
        </Card>

        {/* Total Stock Units */}
        <Card className="border-slate-200 hover:border-slate-400 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Stock</CardTitle>
            <div className="h-8 w-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-slate-900">{m.totalStock.toLocaleString()} Units</div>
            <p className="text-[11px] text-slate-500 mt-1">Across all furniture categories</p>
          </CardContent>
        </Card>

        {/* Stock Valuation */}
        <Card className="border-slate-200 hover:border-amber-400 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stock Valuation</CardTitle>
            <div className="h-8 w-8 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(m.totalStockValue, curr)}</div>
            <p className="text-[11px] text-slate-500 mt-1">Evaluated at purchase cost</p>
          </CardContent>
        </Card>

        {/* Today's Purchases (Gate In) */}
        <Card className="border-slate-200 hover:border-amber-400 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Gate In</CardTitle>
            <div className="h-8 w-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(m.todayPurchases, curr)}</div>
            <p className="text-[11px] text-slate-500 mt-1">Vendor goods received today</p>
          </CardContent>
        </Card>

        {/* Low Stock Warning */}
        <Card className="border-slate-200 hover:border-amber-500 transition-all shadow-xs bg-amber-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-800">Low Stock Alert</CardTitle>
            <div className="h-8 w-8 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-amber-800">{m.lowStockCount} Products</div>
            <p className="text-[11px] text-amber-700 mt-1">Below minimum reorder threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales vs Purchases 7-Day Performance */}
        <Card className="lg:col-span-8 border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between p-5">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">7-Day Sales & Financial Flow</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Daily comparison of Sales Revenue, Customer Collections, and Vendor Purchases
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(val, curr), ""]}
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "6px", color: "#fff", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Bar dataKey="sales" name="Sales" fill="#d97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="payments" name="Collections" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Gate In Purchases" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Warning List */}
        <Card className="lg:col-span-4 border-slate-200 shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Critical Stock Alerts</span>
              </CardTitle>
              <Link href="/inventory" className="text-xs text-amber-600 hover:underline font-medium">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            {(!data?.lowStockProducts || data.lowStockProducts.length === 0) ? (
              <p className="text-xs text-slate-500 py-6 text-center">All products have healthy stock levels.</p>
            ) : (
              data.lowStockProducts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-200">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {p.currentStock} {p.unit}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Min: {p.minimumStock}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Tables Tabbed View */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-slate-900">Recent Enterprise Transactions</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Real-time feed of recent customer bills, vendor gate-ins, and payment settlements.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <Tabs defaultValue="bills" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="bills" className="text-xs">Recent Bills ({data?.recentBills?.length || 0})</TabsTrigger>
              <TabsTrigger value="gatein" className="text-xs">Recent Gate In ({data?.recentGateIns?.length || 0})</TabsTrigger>
              <TabsTrigger value="custPay" className="text-xs">Customer Receipts ({data?.recentCustomerPayments?.length || 0})</TabsTrigger>
              <TabsTrigger value="vendPay" className="text-xs">Vendor Payments ({data?.recentVendorPayments?.length || 0})</TabsTrigger>
            </TabsList>

            {/* Bills Tab */}
            <TabsContent value="bills">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!data?.recentBills || data.recentBills.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-slate-500 text-xs">No recent bills found.</TableCell>
                    </TableRow>
                  ) : (
                    data.recentBills.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono font-bold text-slate-900 text-xs">{b.billNumber}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(b.date)}</TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800">{b.customerName || "Customer"}</TableCell>
                        <TableCell className="text-right text-xs font-bold">{formatCurrency(b.grandTotal, curr)}</TableCell>
                        <TableCell className="text-right text-xs text-emerald-700">{formatCurrency(b.paidAmount, curr)}</TableCell>
                        <TableCell className="text-right text-xs text-rose-700 font-semibold">{formatCurrency(b.remainingBalance, curr)}</TableCell>
                        <TableCell>
                          <Badge variant={b.paymentStatus === "PAID" ? "success" : b.paymentStatus === "PARTIAL" ? "warning" : "destructive"}>
                            {b.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/billing/${b.id}`}>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Gate In Tab */}
            <TabsContent value="gatein">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gate In Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Vendor Invoice #</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!data?.recentGateIns || data.recentGateIns.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-slate-500 text-xs">No Gate In entries found.</TableCell>
                    </TableRow>
                  ) : (
                    data.recentGateIns.map((g: any) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-mono font-bold text-amber-700 text-xs">{g.gateInNumber}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(g.date)}</TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800">{g.vendorName || "Vendor"}</TableCell>
                        <TableCell className="text-xs font-mono text-slate-500">{g.vendorInvoiceNumber || "-"}</TableCell>
                        <TableCell className="text-right text-xs font-bold text-slate-900">{formatCurrency(g.totalAmount, curr)}</TableCell>
                        <TableCell className="text-xs text-slate-500">{g.createdBy || "Staff"}</TableCell>
                        <TableCell className="text-right">
                          <Link href="/purchasing/gate-in/history">
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs">History</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Customer Payments Tab */}
            <TabsContent value="custPay">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Receipt #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!data?.recentCustomerPayments || data.recentCustomerPayments.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-slate-500 text-xs">No customer payments recorded.</TableCell>
                    </TableRow>
                  ) : (
                    data.recentCustomerPayments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono font-bold text-xs">{p.paymentNumber}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(p.date)}</TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800">{p.customerName || "Customer"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">{p.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-500">{p.referenceNumber || "-"}</TableCell>
                        <TableCell className="text-right text-xs font-bold text-emerald-700">{formatCurrency(p.amount, curr)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Vendor Payments Tab */}
            <TabsContent value="vendPay">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!data?.recentVendorPayments || data.recentVendorPayments.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-slate-500 text-xs">No vendor payments recorded.</TableCell>
                    </TableRow>
                  ) : (
                    data.recentVendorPayments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono font-bold text-xs">{p.paymentNumber}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(p.date)}</TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800">{p.vendorName || "Vendor"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">{p.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-500">{p.referenceNumber || "-"}</TableCell>
                        <TableCell className="text-right text-xs font-bold text-rose-700">{formatCurrency(p.amount, curr)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}