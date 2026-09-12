"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  CreditCard,
  ReceiptText,
  BookOpen,
  Printer,
  Calendar,
  DollarSign,
  History,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment Receipt Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");

  const router = useRouter();
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/customers/${params.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setDeleteError(json.message || "Failed to delete customer");
        return;
      }
      router.push("/customers");
    } catch (err: any) {
      setDeleteError(err.message || "Network error while deleting customer");
    } finally {
      setDeleteLoading(false);
    }
  };

  const loadData = () => {
    setLoading(true);
    fetch(`/api/customers/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setPayAmount(res.data.customer.currentReceivable > 0 ? res.data.customer.currentReceivable : 0);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      setPayError("Payment amount must be greater than 0.");
      return;
    }

    setPaySubmitting(true);
    setPayError("");

    try {
      const res = await fetch("/api/customers/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: params.id,
          date: payDate,
          amount: payAmount,
          paymentMethod: payMethod,
          referenceNumber: payRef,
          notes: payNotes,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setPayError(resData.message || "Failed to process payment.");
      } else {
        setPayModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setPayError("Network error occurred.");
    } finally {
      setPaySubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-md w-1/3"></div>
        <div className="h-40 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  const { customer, summary, ledger, bills, payments, currency } = data;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs no-print">
        <div className="flex items-center space-x-3">
          <Link href="/customers" className="text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{customer.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">{customer.customerCode}</Badge>
            </div>
            <p className="text-xs text-slate-500">
              {customer.phone ? `Phone: ${customer.phone}` : "Customer Account Overview"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/billing/new">
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-800 flex items-center space-x-1.5 bg-white">
              <ReceiptText className="h-4 w-4 text-amber-600" />
              <span>Create Bill</span>
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setPayModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-xs"
          >
            <CreditCard className="h-4 w-4" />
            <span>Receive Payment</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="border-slate-300 text-slate-800 flex items-center space-x-1.5 bg-white"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Print Statement</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeleteModalOpen(true)}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center space-x-1.5 bg-white"
            title="Delete Customer Profile"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Customer</span>
          </Button>
        </div>
      </div>

      {/* Redesigned Printable Statement (Visible only when printing) */}
      <div className="hidden print-only print-container space-y-4 text-slate-900">
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              {data.shop?.name || "Furniture Enterprise"}
            </h1>
            <p className="text-xs text-slate-600">{data.shop?.address || "Main Showroom & Furniture Store"}</p>
            <p className="text-xs text-slate-600">Phone: {data.shop?.phone || "-"} | Email: {data.shop?.email || "-"}</p>
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

        {/* Customer Info & Total Remaining Balance Box */}
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
            1. Bills & Invoices Summary ({bills.length})
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
              {bills.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-2 text-slate-500">No invoices issued yet.</td></tr>
              ) : (
                bills.map((b: any) => (
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
            2. Payment Entries Received ("Kab Kab Aur Kitni Payment Aayi") ({payments.length})
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
              {payments.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-2 text-slate-500">No payment receipts recorded yet.</td></tr>
              ) : (
                payments.map((p: any) => (
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

      {/* Financial KPIs (On Screen) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Opening Balance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-slate-800">{formatCurrency(summary.openingBalance, currency)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Initial balance receivable</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Sales Value</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-slate-900">{formatCurrency(summary.totalSales, currency)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">{summary.totalBills} Invoices issued</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Total Payments Received</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-emerald-700">{formatCurrency(summary.totalPaid, currency)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">{summary.paymentCount} Receipts collected</p>
          </CardContent>
        </Card>

        <Card className="border-amber-300 shadow-xs bg-amber-50/50 border-2">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-amber-900">
              Total Remaining Balance (Baqi Khata)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-rose-700">{formatCurrency(summary.outstanding, currency)}</div>
            <p className="text-[11px] text-slate-600 mt-0.5">Last transaction: {formatDate(summary.lastTransactionDate)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs View (On Screen) */}
      <Card className="border-slate-200 shadow-xs no-print">
        <CardContent className="p-5">
          <Tabs defaultValue="statement" className="w-full">
            <TabsList className="mb-4 no-print flex-wrap">
              <TabsTrigger value="statement" className="text-xs font-bold text-amber-900">
                ⭐ Clear Statement ({bills.length} Bills, {payments.length} Payments)
              </TabsTrigger>
              <TabsTrigger value="ledger" className="text-xs">
                Detailed Ledger ({ledger.length})
              </TabsTrigger>
              <TabsTrigger value="bills" className="text-xs">
                Bills & Invoices ({bills.length})
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs">
                Payment Entries ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="profile" className="text-xs">
                Customer Profile
              </TabsTrigger>
            </TabsList>

            {/* TAB 0: Clear & Simple Statement */}
            <TabsContent value="statement">
              <div className="space-y-5">
                {/* Outstanding Highlight */}
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                      Total Remaining Due from {customer.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Total Invoiced: {formatCurrency(summary.totalSales, currency)} | Total Paid: {formatCurrency(summary.totalPaid, currency)}
                    </p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-md border border-amber-300 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Baqi Raqam / Remaining Bill Due</span>
                    <span className="text-xl font-black text-rose-700 font-mono">
                      {formatCurrency(summary.outstanding, currency)}
                    </span>
                  </div>
                </div>

                {/* Invoices Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ReceiptText className="h-4 w-4 text-amber-600" />
                    <span>Invoices & Bills Breakdown ({bills.length})</span>
                  </h4>
                  <div className="rounded-md border border-slate-200 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <tr>
                          <th className="p-2.5 text-left">Date & Time</th>
                          <th className="p-2.5 text-left">Invoice #</th>
                          <th className="p-2.5 text-right">Bill Total</th>
                          <th className="p-2.5 text-right">Paid Amount</th>
                          <th className="p-2.5 text-right">Remaining Due</th>
                          <th className="p-2.5 text-center">Status</th>
                          <th className="p-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bills.length === 0 ? (
                          <tr><td colSpan={7} className="p-4 text-center text-slate-500">No invoices generated yet.</td></tr>
                        ) : (
                          bills.map((b: any) => (
                            <tr key={b.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-mono text-slate-600">{formatDateTime(b.createdAt || b.date)}</td>
                              <td className="p-2.5 font-mono font-bold text-slate-900">#{b.billNumber}</td>
                              <td className="p-2.5 text-right font-mono text-slate-900">{formatCurrency(b.grandTotal, currency)}</td>
                              <td className="p-2.5 text-right font-mono text-emerald-700">{formatCurrency(b.paidAmount, currency)}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                                {formatCurrency(b.remainingBalance, currency)}
                              </td>
                              <td className="p-2.5 text-center">
                                <Badge
                                  variant={b.paymentStatus === "PAID" ? "success" : b.paymentStatus === "PARTIAL" ? "warning" : "destructive"}
                                  className="text-[10px]"
                                >
                                  {b.paymentStatus}
                                </Badge>
                              </td>
                              <td className="p-2.5 text-right">
                                <Link href={`/billing/${b.id}`}>
                                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">
                                    Open Bill
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payments Table: "intni date ko itni payment aayi thi" */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    <span>Payment Entries Received ("Kab Aur Kitni Payment Aayi") ({payments.length})</span>
                  </h4>
                  <div className="rounded-md border border-slate-200 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-emerald-50/50 border-b border-emerald-200 text-emerald-900 font-semibold">
                        <tr>
                          <th className="p-2.5 text-left">Payment Date & Time</th>
                          <th className="p-2.5 text-left">Receipt #</th>
                          <th className="p-2.5 text-left">Payment Method</th>
                          <th className="p-2.5 text-left">Reference / Notes</th>
                          <th className="p-2.5 text-right">Payment Amount Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.length === 0 ? (
                          <tr><td colSpan={5} className="p-4 text-center text-slate-500">No payment entries collected yet.</td></tr>
                        ) : (
                          payments.map((p: any) => (
                            <tr key={p.id} className="hover:bg-emerald-50/20">
                              <td className="p-2.5 font-mono text-slate-700 font-medium">{formatDateTime(p.createdAt || p.date)}</td>
                              <td className="p-2.5 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                              <td className="p-2.5">
                                <Badge variant="secondary" className="text-[10px]">{p.paymentMethod}</Badge>
                              </td>
                              <td className="p-2.5 text-slate-600">{p.referenceNumber || p.notes || "-"}</td>
                              <td className="p-2.5 text-right font-mono font-extrabold text-emerald-700 text-sm">
                                {formatCurrency(p.amount, currency)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 1: Detailed Chronological Ledger */}
            <TabsContent value="ledger">
              <div className="space-y-3">
                <div className="flex items-center justify-between no-print">
                  <h3 className="text-sm font-bold text-slate-900">Chronological Account Statement</h3>
                  <Button size="sm" variant="outline" onClick={handlePrint} className="h-7 text-xs flex items-center space-x-1">
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Ledger</span>
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                      <tr>
                        <th className="p-2.5 text-left">Date & Time</th>
                        <th className="p-2.5 text-left">Type</th>
                        <th className="p-2.5 text-left">Reference #</th>
                        <th className="p-2.5 text-left">Product / Description</th>
                        <th className="p-2.5 text-right">Sale Amount (Debit)</th>
                        <th className="p-2.5 text-right">Payment Received (Credit)</th>
                        <th className="p-2.5 text-right">Receivable Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledger.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-500">No transactions recorded for this customer.</td>
                        </tr>
                      ) : (
                        ledger.map((row: any) => {
                          const matchingBill = bills.find((b: any) => b.billNumber === row.reference);
                          return (
                            <tr key={row.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">{formatDateTime(row.createdAt || row.date)}</td>
                              <td className="p-2.5">
                                <Badge
                                  variant={
                                    row.type === "SALE"
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
                                {matchingBill ? (
                                  <Link
                                    href={`/billing/${matchingBill.id}`}
                                    className="text-amber-700 underline hover:text-amber-900"
                                    title="Click to view/reprint bill"
                                  >
                                    {row.reference}
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
              </div>
            </TabsContent>

            {/* TAB 2: Bills */}
            <TabsContent value="bills">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-slate-500 text-xs">No bills created for this customer.</TableCell>
                    </TableRow>
                  ) : (
                    bills.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono font-bold text-xs text-slate-900">{b.billNumber}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(b.date)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs text-slate-900">
                          {formatCurrency(b.grandTotal, currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-700">
                          {formatCurrency(b.paidAmount, currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs text-rose-700">
                          {formatCurrency(b.remainingBalance, currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={b.paymentStatus === "PAID" ? "success" : b.paymentStatus === "PARTIAL" ? "warning" : "destructive"}
                            className="text-[10px]"
                          >
                            {b.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/billing/${b.id}`}>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs">View Bill</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* TAB 3: Payments */}
            <TabsContent value="payments">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference / Trx #</TableHead>
                    <TableHead className="text-right">Amount Received</TableHead>
                    <TableHead>Recorded By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-slate-500 text-xs">No receipts recorded.</TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono font-bold text-xs">{p.paymentNumber}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(p.date)}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{p.paymentMethod}</Badge></TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{p.referenceNumber || "-"}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs text-emerald-700">
                          {formatCurrency(p.amount, currency)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{p.createdBy || "Staff"}</TableCell>
                        <TableCell className="text-xs text-slate-500">{p.notes || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* TAB 4: Profile Details */}
            <TabsContent value="profile">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2">Customer Information</h4>
                  <p><strong className="text-slate-700">Full Name:</strong> {customer.name}</p>
                  <p><strong className="text-slate-700">Phone:</strong> {customer.phone || "-"}</p>
                  <p><strong className="text-slate-700">WhatsApp:</strong> {customer.whatsapp || "-"}</p>
                  <p><strong className="text-slate-700">Email:</strong> {customer.email || "-"}</p>
                  <p><strong className="text-slate-700">Address:</strong> {customer.address || "-"}</p>
                </div>
                <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2">Account Terms & Notes</h4>
                  <p><strong className="text-slate-700">Customer Code:</strong> <span className="font-mono">{customer.customerCode}</span></p>
                  <p><strong className="text-slate-700">Account Status:</strong> <span className="capitalize">{customer.status}</span></p>
                  <p><strong className="text-slate-700">Internal Remarks:</strong> {customer.notes || "No special notes provided."}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Record Customer Payment</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">{customer.name}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePayment} className="space-y-3">
            {payError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {payError}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Remaining Outstanding:</span>
              <span className="font-bold text-rose-700 font-mono text-sm">
                {formatCurrency(customer.currentReceivable, currency)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Receipt Date *</label>
              <Input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Amount Received ({currency}) *</label>
              <NumericInput
                prefixSymbol={currency}
                value={payAmount}
                onChangeValue={(val) => setPayAmount(val)}
                placeholder="0"
                className="text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Payment Channel</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Easypaisa">Easypaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Reference / Trx #</label>
              <Input
                placeholder="e.g. Bank Ref # or Cheque #"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Notes / Remarks</label>
              <Input
                placeholder="e.g. Account settlement"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayModalOpen(false)}
                disabled={paySubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={paySubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {paySubmitting ? "Processing..." : "Confirm & Post Receipt"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600" />
              <span>Delete Customer Profile</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Are you sure you want to permanently delete customer{" "}
              <strong className="text-slate-900">{customer?.name}</strong> ({customer?.customerCode})?
              All ledger entries, payments, and invoices linked to this customer will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded text-xs">
              {deleteError}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
            >
              {deleteLoading ? "Deleting Customer..." : "Yes, Delete Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}