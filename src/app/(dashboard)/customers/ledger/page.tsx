"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Printer,
  Download,
  Users,
  Calendar,
  Filter,
  DollarSign,
  ReceiptText,
  CreditCard,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function CustomerLedgerReportPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerData, setCustomerData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [dateRange, setDateRange] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setCustomers(res.data);
          setSelectedCustomerId(res.data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) return;
    setLoading(true);
    fetch(`/api/customers/${selectedCustomerId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCustomerData(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCustomerId]);

  const handlePrint = () => {
    window.print();
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const currency = customerData?.currency || "Rs.";
  const customer = customerData?.customer;
  const summary = customerData?.summary;
  const ledger = customerData?.ledger || [];

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
            <Link href="/customers" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dedicated Customer Ledger</h1>
            <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-xs">
              Client Accounts
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Instant search and complete historical sales and payments statement for any customer.
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
            <span>Print Statement</span>
          </Button>
        </div>
      </div>

      {/* Customer Quick Search & Selector */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3 no-print">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Customer Search & Selector
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search customer by name, code, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-slate-50"
            />
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500"
          >
            {filteredCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} [{c.customerCode}] {c.phone ? `(${c.phone})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {customer && summary && (
        <>
          {/* Redesigned Printable Statement (Visible only when printing) */}
          <div className="hidden print-only print-container space-y-4 text-slate-900">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {customerData.shop?.name || "Furniture Enterprise"}
                </h1>
                <p className="text-xs text-slate-600">{customerData.shop?.address || "Main Showroom & Furniture Store"}</p>
                <p className="text-xs text-slate-600">Phone: {customerData.shop?.phone || "-"} | Email: {customerData.shop?.email || "-"}</p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white font-black text-xs px-2.5 py-1 uppercase tracking-wider rounded">
                  Customer Account Statement
                </div>
                <p className="text-[11px] text-slate-600 mt-1 font-mono">
                  Statement Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Customer Details & Outstanding Summary Box */}
            <div className="grid grid-cols-2 gap-3 border border-slate-300 p-3 rounded bg-slate-50/50">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Customer Details</span>
                <h2 className="text-sm font-extrabold text-slate-900">{customer.name}</h2>
                <p className="text-xs text-slate-600">Customer ID: <span className="font-mono font-bold">{customer.customerCode}</span> | Phone: {customer.phone || "-"}</p>
                {customer.address && <p className="text-xs text-slate-600">Address: {customer.address}</p>}
              </div>
              <div className="border-l border-slate-200 pl-3 flex flex-col justify-between">
                <div className="flex justify-between text-xs pb-1 border-b border-slate-200">
                  <span className="text-slate-600">Total Billed / Sales:</span>
                  <span className="font-mono font-bold">{formatCurrency(summary.totalSales, currency)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span className="text-slate-600">Total Payments Received:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(summary.totalPaid, currency)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 pb-1 px-2 bg-amber-100/90 rounded border border-amber-300 mt-1">
                  <span className="text-xs font-black uppercase text-amber-950">Total Remaining Due (Baqi Khata):</span>
                  <span className="text-base font-black text-rose-700 font-mono">{formatCurrency(summary.outstanding, currency)}</span>
                </div>
              </div>
            </div>

            {/* Section 1: Invoices & Bills Breakdown */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider">
                1. Bills & Invoices Summary ({customerData.bills?.length || 0})
              </h3>
              <table>
                <thead>
                  <tr>
                    <th className="text-left">Date & Time</th>
                    <th className="text-left">Invoice #</th>
                    <th className="text-right">Bill Total</th>
                    <th className="text-right">Paid Amount</th>
                    <th className="text-right">Remaining Due</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!customerData.bills || customerData.bills.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-2 text-slate-500">No invoices issued yet.</td></tr>
                  ) : (
                    customerData.bills.map((b: any) => (
                      <tr key={b.id}>
                        <td className="font-mono">{formatDateTime(b.createdAt || b.date)}</td>
                        <td className="font-mono font-bold">#{b.billNumber}</td>
                        <td className="text-right font-mono">{formatCurrency(b.grandTotal, currency)}</td>
                        <td className="text-right font-mono text-emerald-700">{formatCurrency(b.paidAmount, currency)}</td>
                        <td className="text-right font-mono font-bold text-rose-700">{formatCurrency(b.remainingBalance, currency)}</td>
                        <td className="text-center font-bold text-[10px]">{b.paymentStatus}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 2: Payment Entries ("itni date ko itni payment aayi thi") */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase text-emerald-900 tracking-wider">
                2. Payment Entries Received ("Kab Kab Aur Kitni Payment Aayi") ({customerData.payments?.length || 0})
              </h3>
              <table>
                <thead>
                  <tr>
                    <th className="text-left">Payment Date & Time</th>
                    <th className="text-left">Receipt #</th>
                    <th className="text-left">Payment Method</th>
                    <th className="text-left">Reference / Notes</th>
                    <th className="text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody>
                  {!customerData.payments || customerData.payments.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-2 text-slate-500">No payment receipts recorded yet.</td></tr>
                  ) : (
                    customerData.payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="font-mono text-slate-700">{formatDateTime(p.createdAt || p.date)}</td>
                        <td className="font-mono font-bold">{p.receiptNumber}</td>
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
                <p className="font-semibold text-slate-800">Customer / Receiver Signature</p>
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
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Sales</span>
              <span className="text-sm font-bold text-slate-900 font-mono block mt-1">
                {formatCurrency(summary.totalSales, currency)}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Payments</span>
              <span className="text-sm font-bold text-emerald-700 font-mono block mt-1">
                {formatCurrency(summary.totalPaid, currency)}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-rose-200 bg-rose-50/20 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Outstanding</span>
              <span className="text-base font-extrabold text-rose-700 font-mono block mt-0.5">
                {formatCurrency(summary.outstanding, currency)}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Invoices</span>
              <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                {summary.totalBills} Bills
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Receipts</span>
              <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                {summary.paymentCount} Payments
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Transaction</span>
              <span className="text-xs font-semibold text-slate-800 block mt-1">
                {formatDate(summary.lastTransactionDate)}
              </span>
            </div>
          </div>

          {/* Pending Invoices Banner (Customer Khata) */}
          {customerData?.bills && customerData.bills.some((b: any) => (b.remainingBalance || 0) > 0) && (
            <div className="bg-amber-50/70 border border-amber-300 rounded-lg p-4 space-y-3 no-print">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Pending / Unsettled Invoices on Khata ({customerData.bills.filter((b: any) => (b.remainingBalance || 0) > 0).length})</span>
                </h3>
                <span className="text-xs font-mono font-bold text-rose-700 bg-white px-2.5 py-0.5 rounded border border-amber-200">
                  Total Due: {formatCurrency(customerData.bills.filter((b: any) => (b.remainingBalance || 0) > 0).reduce((acc: number, b: any) => acc + (b.remainingBalance || 0), 0), currency)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {customerData.bills.filter((b: any) => (b.remainingBalance || 0) > 0).map((pb: any) => (
                  <div key={pb.id} className="bg-white p-3 rounded-md border border-amber-200 text-xs space-y-1.5 shadow-2xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-900">#{pb.billNumber}</span>
                      <Badge variant={pb.paymentStatus === "PARTIAL" ? "warning" : "destructive"} className="text-[10px]">
                        {pb.paymentStatus}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">{formatDateTime(pb.createdAt || pb.date)}</p>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Bill Total: {formatCurrency(pb.grandTotal, currency)}</span>
                      <span className="font-bold text-rose-700 font-mono">Due: {formatCurrency(pb.remainingBalance, currency)}</span>
                    </div>
                    <Link href={`/billing/${pb.id}`} className="block pt-1">
                      <Button size="sm" variant="outline" className="w-full h-7 text-[11px] bg-amber-50/50 hover:bg-amber-100 border-amber-300 text-amber-900">
                        Open / Print Invoice
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ledger Table with Date Filters */}
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <CardHeader className="p-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 no-print">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Transaction Ledger: {customer.name}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Every transaction shows clearly whether it is a Sale, Payment, Opening Balance, or Return.
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
                  <option value="SALE">Sale (Bill)</option>
                  <option value="PAYMENT">Payment Receipt</option>
                  <option value="OPENING_BALANCE">Opening Balance</option>
                  <option value="RETURN">Return / Void</option>
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
                      <th className="p-2.5 text-left">Description / Products</th>
                      <th className="p-2.5 text-right">Sale Amount (Debit)</th>
                      <th className="p-2.5 text-right">Payment Received (Credit)</th>
                      <th className="p-2.5 text-right">Receivable Balance</th>
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
                      filteredLedger.map((row: any) => {
                        const matchingBill = customerData?.bills?.find(
                          (b: any) => b.billNumber === row.reference || b.invoiceNumber === row.reference || b.id === row.reference
                        );
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap text-[11px]">{formatDateTime(row.date)}</td>
                            <td className="p-2.5">
                              <Badge
                                variant={
                                  row.type === "SALE"
                                    ? "info"
                                    : row.type === "PAYMENT"
                                    ? "success"
                                    : row.type === "RETURN"
                                    ? "warning"
                                    : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {row.type}
                              </Badge>
                            </td>
                            <td className="p-2.5 font-mono font-bold text-slate-900">
                              {matchingBill ? (
                                <Link
                                  href={`/billing/${matchingBill.id}`}
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                  title="View / Print Tax Invoice"
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
                        );
                      })
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