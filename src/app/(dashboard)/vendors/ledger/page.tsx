"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Printer,
  Download,
  Building2,
  Calendar,
  Filter,
  DollarSign,
  Truck,
  CreditCard,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function VendorLedgerReportPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [vendorData, setVendorData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [dateRange, setDateRange] = useState("ALL"); // ALL | TODAY | THIS_MONTH | THIS_YEAR
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/vendors")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setVendors(res.data);
          setSelectedVendorId(res.data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedVendorId) return;
    setLoading(true);
    fetch(`/api/vendors/${selectedVendorId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setVendorData(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedVendorId]);

  const handlePrint = () => {
    window.print();
  };

  const filteredVendors = vendors.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.vendorCode.toLowerCase().includes(q) ||
      (v.companyName && v.companyName.toLowerCase().includes(q))
    );
  });

  const currency = vendorData?.currency || "Rs.";
  const vendor = vendorData?.vendor;
  const summary = vendorData?.summary;
  const ledger = vendorData?.ledger || [];

  // Filter ledger rows by date and type
  const filteredLedger = ledger.filter((row: any) => {
    if (typeFilter !== "ALL" && row.type !== typeFilter) return false;
    if (dateRange === "TODAY") {
      const today = new Date().toISOString().split("T")[0];
      return row.date.startsWith(today);
    }
    if (dateRange === "THIS_MONTH") {
      const ym = new Date().toISOString().slice(0, 7);
      return row.date.startsWith(ym);
    }
    if (dateRange === "THIS_YEAR") {
      const y = new Date().getFullYear().toString();
      return row.date.startsWith(y);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs no-print">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/vendors" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dedicated Vendor Ledger</h1>
            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-xs">
              Supplier Accounts
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Instant search and complete historical business transaction statements for any vendor.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-slate-300 text-slate-800 flex items-center space-x-1.5 bg-white"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Print Ledger</span>
          </Button>
        </div>
      </div>

      {/* Instant Vendor Search & Selector */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3 no-print">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Vendor Search & Quick Selector
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Type vendor name (e.g. ABC Foam) or code to filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-slate-50"
            />
          </div>

          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500"
          >
            {filteredVendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.companyName ? `(${v.companyName})` : ""} [{v.vendorCode}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {vendor && summary && (
        <>
          {/* Redesigned Printable Statement (Visible only when printing) */}
          <div className="hidden print-only print-container space-y-4 text-slate-900">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {vendorData.shop?.name || "Furniture Enterprise"}
                </h1>
                <p className="text-xs text-slate-600">{vendorData.shop?.address || "Main Showroom & Warehouse"}</p>
                <p className="text-xs text-slate-600">Phone: {vendorData.shop?.phone || "-"} | Email: {vendorData.shop?.email || "-"}</p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white font-black text-xs px-2.5 py-1 uppercase tracking-wider rounded">
                  Vendor Account Statement
                </div>
                <p className="text-[11px] text-slate-600 mt-1 font-mono">
                  Statement Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Vendor Details & Outstanding Summary Box */}
            <div className="grid grid-cols-2 gap-3 border border-slate-300 p-3 rounded bg-slate-50/50">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Vendor / Supplier Details</span>
                <h2 className="text-sm font-extrabold text-slate-900">{vendor.name}</h2>
                {vendor.companyName && <p className="text-xs font-semibold text-slate-700">{vendor.companyName}</p>}
                <p className="text-xs text-slate-600">Vendor ID: <span className="font-mono font-bold">{vendor.vendorCode}</span> | Phone: {vendor.phone || "-"}</p>
                {vendor.address && <p className="text-xs text-slate-600">Address: {vendor.address}</p>}
              </div>
              <div className="border-l border-slate-200 pl-3 flex flex-col justify-between">
                <div className="flex justify-between text-xs pb-1 border-b border-slate-200">
                  <span className="text-slate-600">Total Purchases (Gate In):</span>
                  <span className="font-mono font-bold">{formatCurrency(summary.totalPurchases, currency)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span className="text-slate-600">Total Payments Disbursed:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(summary.totalPaid, currency)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 pb-1 px-2 bg-amber-100/90 rounded border border-amber-300 mt-1">
                  <span className="text-xs font-black uppercase text-amber-950">Total Remaining Payable (Baqi Khata):</span>
                  <span className="text-base font-black text-rose-700 font-mono">{formatCurrency(summary.currentPayable, currency)}</span>
                </div>
              </div>
            </div>

            {/* Section 1: Purchases / Gate In History */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider">
                1. Purchases / Gate In Bills ({vendorData.gateIns?.length || 0})
              </h3>
              <table>
                <thead>
                  <tr>
                    <th className="text-left">Date & Time</th>
                    <th className="text-left">Gate In #</th>
                    <th className="text-left">Supplier Invoice #</th>
                    <th className="text-right">Bill Total</th>
                  </tr>
                </thead>
                <tbody>
                  {!vendorData.gateIns || vendorData.gateIns.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-2 text-slate-500">No Gate In bills recorded.</td></tr>
                  ) : (
                    vendorData.gateIns.map((g: any) => (
                      <tr key={g.id}>
                        <td className="font-mono">{formatDateTime(g.createdAt || g.date)}</td>
                        <td className="font-mono font-bold">{g.gateInNumber}</td>
                        <td>{g.vendorInvoiceNumber || "-"}</td>
                        <td className="text-right font-mono font-bold">{formatCurrency(g.totalAmount, currency)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 2: Payment Entries */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase text-emerald-900 tracking-wider">
                2. Payment Entries Disbursed ({vendorData.payments?.length || 0})
              </h3>
              <table>
                <thead>
                  <tr>
                    <th className="text-left">Payment Date & Time</th>
                    <th className="text-left">Voucher #</th>
                    <th className="text-left">Payment Method</th>
                    <th className="text-left">Ref / Notes</th>
                    <th className="text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {!vendorData.payments || vendorData.payments.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-2 text-slate-500">No payments disbursed yet.</td></tr>
                  ) : (
                    vendorData.payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="font-mono text-slate-700">{formatDateTime(p.createdAt || p.date)}</td>
                        <td className="font-mono font-bold">{p.paymentNumber}</td>
                        <td>{p.paymentMethod}</td>
                        <td>{p.referenceNumber || p.notes || "-"}</td>
                        <td className="text-right font-mono font-bold text-emerald-700">{formatCurrency(p.amount, currency)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Statement Footer */}
            <div className="pt-6 border-t border-slate-300 flex justify-between items-end text-xs text-slate-500">
              <div>
                <p>Please verify all entries. Report any discrepancy to accounts.</p>
                <p className="text-[10px] mt-0.5">Software by Furniture ERP Suite • Turso Cloud Verified</p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-700 w-44 mb-1"></div>
                <p className="font-semibold text-slate-800">Authorized Signature</p>
              </div>
            </div>
          </div>

          {/* Account Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Opening Balance</span>
              <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                {formatCurrency(summary.openingBalance, currency)}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Purchases</span>
              <span className="text-sm font-bold text-slate-900 font-mono block mt-1">
                {formatCurrency(summary.totalPurchases, currency)}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Payments</span>
              <span className="text-sm font-bold text-emerald-700 font-mono block mt-1">
                {formatCurrency(summary.totalPaid, currency)}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-rose-200 bg-rose-50/20 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Current Payable</span>
              <span className="text-base font-extrabold text-rose-700 font-mono block mt-0.5">
                {formatCurrency(summary.currentPayable, currency)}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Gate In Counts</span>
              <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                {summary.gateInCount} Shipments
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Payments Made</span>
              <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                {summary.paymentCount} Vouchers
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Transaction</span>
              <span className="text-xs font-semibold text-slate-800 block mt-1">
                {formatDate(summary.lastTransactionDate)}
              </span>
            </div>
          </div>

          {/* Ledger Table with Date Filters */}
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <CardHeader className="p-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 no-print">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Transaction Ledger: {vendor.name}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Every transaction clearly shows its type: Gate In, Payment, Opening Balance, or Adjustment.
                </CardDescription>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-slate-700 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Time History</option>
                  <option value="TODAY">Today</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="THIS_YEAR">This Year</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-slate-700 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="GATE_IN">Gate In</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="OPENING_BALANCE">Opening Balance</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2.5 text-left">Date & Time</th>
                      <th className="p-2.5 text-left">Type</th>
                      <th className="p-2.5 text-left">Reference #</th>
                      <th className="p-2.5 text-left">Product / Description</th>
                      <th className="p-2.5 text-right">Purchase Rate / Amount</th>
                      <th className="p-2.5 text-right">Payment Disbursed</th>
                      <th className="p-2.5 text-right">Payable Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">Loading ledger data...</td>
                      </tr>
                    ) : filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">No ledger entries match this criteria.</td>
                      </tr>
                    ) : (
                      filteredLedger.map((row: any) => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap text-[11px]">{formatDateTime(row.date)}</td>
                          <td className="p-2.5">
                            <Badge
                              variant={
                                row.type === "GATE_IN"
                                  ? "info"
                                  : row.type === "PAYMENT"
                                  ? "success"
                                  : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {row.type}
                            </Badge>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900">
                            {row.type === "GATE_IN" ? (
                              <Link
                                href="/gate-in"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                                title="View Gate In Records"
                              >
                                <span>{row.reference}</span>
                              </Link>
                            ) : (
                              row.reference
                            )}
                          </td>
                          <td className="p-2.5 text-slate-800 max-w-sm">{row.description}</td>
                          <td className="p-2.5 text-right font-mono text-slate-900">
                            {row.amount > 0 ? formatCurrency(row.amount, currency) : "-"}
                          </td>
                          <td className="p-2.5 text-right font-mono text-emerald-700 font-semibold">
                            {row.payment > 0 ? formatCurrency(row.payment, currency) : "-"}
                          </td>
                          <td className="p-2.5 text-right font-mono font-extrabold text-slate-900">
                            {formatCurrency(row.balance, currency)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}