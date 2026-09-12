"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Printer,
  CreditCard,
  Trash2,
  ArrowLeft,
  Calendar,
  UserCheck,
  Building2,
  BookOpen,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");

  const loadBill = () => {
    setLoading(true);
    fetch(`/api/bills/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setPayAmount(res.data.bill.remainingBalance > 0 ? res.data.bill.remainingBalance : 0);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBill();
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to void and delete bill ${data.bill.billNumber}? Product inventory will be restored back automatically.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/bills/${params.id}`, { method: "DELETE" });
      const resData = await res.json();
      if (resData.success) {
        alert(resData.message);
        router.push("/billing");
      } else {
        alert(resData.message || "Failed to delete bill.");
      }
    } catch (err) {
      alert("Error occurred while deleting bill.");
    }
  };

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
          customerId: data.customer.id,
          billId: data.bill.id,
          date: payDate,
          amount: payAmount,
          paymentMethod: payMethod,
          referenceNumber: payRef,
          notes: payNotes || `Payment against bill ${data.bill.billNumber}`,
        }),
      });

      const resData = await res.json();
      if (!resData.success) {
        setPayError(resData.message || "Failed to record payment.");
      } else {
        setPayModalOpen(false);
        loadBill();
      }
    } catch (err) {
      setPayError("Network error occurred.");
    } finally {
      setPaySubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-80 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  const { bill, items, customer, shop, currency } = data;

  return (
    <div className="space-y-4 pb-12">
      {/* Action Bar (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs no-print">
        <div className="flex items-center space-x-3">
          <Link href="/billing" className="text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Invoice #{bill.billNumber}</h1>
              <Badge
                variant={
                  bill.paymentStatus === "PAID"
                    ? "success"
                    : bill.paymentStatus === "PARTIAL"
                    ? "warning"
                    : "destructive"
                }
                className="text-[11px]"
              >
                {bill.paymentStatus}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3 w-3" />
              <span>Created: {formatDateTime(bill.createdAt)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {bill.remainingBalance > 0 && (
            <Button
              size="sm"
              onClick={() => setPayModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 h-8 text-xs shadow-2xs"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Record Payment</span>
            </Button>
          )}

          <Link href={`/customers/${customer.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-300">
              <BookOpen className="h-3.5 w-3.5 text-amber-600" />
              <span>Customer Khata</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5 h-8 text-xs shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Bill (A4)</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            className="h-8 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
            title="Void Bill & Restore Inventory"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* COMPACT LINE-WISE A4 INVOICE DOCUMENT */}
      <div className="print-container bg-white rounded-lg border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto space-y-4 text-slate-800">
        {/* Header: Shop Info & Invoice Metadata */}
        <div className="flex justify-between items-start border-b border-slate-300 pb-3">
          <div className="space-y-0.5 max-w-sm">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{shop?.name || "Furniture Enterprise"}</h2>
            <p className="text-[11px] text-slate-600 leading-tight">{shop?.address}</p>
            <p className="text-[11px] text-slate-600 font-mono">
              Ph: {shop?.phone1 || "-"}{shop?.phone2 ? ` / ${shop.phone2}` : ""}
            </p>
            {shop?.email && <p className="text-[11px] text-slate-600">Email: {shop.email}</p>}
          </div>

          <div className="text-right space-y-0.5">
            <span className="inline-block px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded uppercase tracking-wider">
              Tax Invoice
            </span>
            <p className="text-sm font-mono font-bold text-amber-700 mt-1">#{bill.billNumber}</p>
            <p className="text-[11px] text-slate-700">
              <span className="text-slate-400">Date & Time:</span> {formatDateTime(bill.createdAt || bill.date)}
            </p>
            <p className="text-[11px] text-slate-700">
              <span className="text-slate-400">Payment Mode:</span> {bill.paymentMethod}
            </p>
            <p className="text-[11px] font-semibold text-slate-900">
              <span className="text-slate-400">Status:</span> {bill.paymentStatus}
            </p>
          </div>
        </div>

        {/* Customer & Khata Summary Box */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer Information:</span>
            <p className="font-bold text-slate-900 text-sm">{customer?.name}</p>
            <p className="text-slate-600 font-mono text-[11px]">
              Cell / Phone: {customer?.phone || "N/A"} | Code: {customer?.customerCode}
            </p>
            {customer?.address && <p className="text-slate-600 text-[11px] truncate">{customer.address}</p>}
          </div>

          <div className="text-right border-l border-slate-200 pl-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Khata Position:</span>
            <p className="text-[11px] text-slate-600">Total Customer Due (All Invoices):</p>
            <p className="text-sm font-extrabold text-rose-700 font-mono">
              {formatCurrency(customer?.currentReceivable, currency)}
            </p>
            {bill.remainingBalance > 0 ? (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block mt-0.5">
                Pending on this invoice: {formatCurrency(bill.remainingBalance, currency)}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                ✔ Fully Settled
              </span>
            )}
          </div>
        </div>

        {/* Dense Line-Wise Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-100 font-bold text-slate-800">
              <tr>
                <th className="p-1.5 text-left w-8">#</th>
                <th className="p-1.5 text-left">Furniture Description</th>
                <th className="p-1.5 text-right w-16">Qty</th>
                <th className="p-1.5 text-right w-24">Unit Price</th>
                <th className="p-1.5 text-right w-20">Discount</th>
                <th className="p-1.5 text-right w-28">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((it: any, idx: number) => (
                <tr key={it.id}>
                  <td className="p-1.5 font-mono text-slate-400 text-center">{idx + 1}</td>
                  <td className="p-1.5 font-semibold text-slate-900">{it.productName}</td>
                  <td className="p-1.5 text-right font-mono font-semibold">
                    {it.quantity} {it.unit}
                  </td>
                  <td className="p-1.5 text-right font-mono text-slate-700">
                    {formatCurrency(it.unitPrice, currency)}
                  </td>
                  <td className="p-1.5 text-right font-mono text-slate-500">
                    {it.discountAmount > 0 ? formatCurrency(it.discountAmount, currency) : "-"}
                  </td>
                  <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(it.totalPrice, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-between items-start pt-1">
          <div className="max-w-xs space-y-1 text-[11px] text-slate-600">
            {bill.notes && (
              <div className="p-2 rounded bg-amber-50/60 border border-amber-200/60">
                <span className="font-bold text-slate-800 block text-[10px] uppercase">Special Notes:</span>
                <p className="italic">{bill.notes}</p>
              </div>
            )}
          </div>

          <div className="w-64 space-y-1 text-xs border border-slate-200 rounded p-2.5 bg-slate-50/50">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(bill.subtotal, currency)}</span>
            </div>
            {bill.discountAmount > 0 && (
              <div className="flex justify-between text-rose-700">
                <span>Invoice Discount:</span>
                <span className="font-mono">-{formatCurrency(bill.discountAmount, currency)}</span>
              </div>
            )}
            <div className="border-t border-slate-300 pt-1 flex justify-between font-extrabold text-slate-900 text-sm">
              <span>Invoice Total:</span>
              <span className="font-mono text-amber-700">{formatCurrency(bill.grandTotal, currency)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold pt-0.5">
              <span>Paid / Advance:</span>
              <span className="font-mono">{formatCurrency(bill.paidAmount, currency)}</span>
            </div>
            <div className="border-t border-dashed border-slate-300 pt-1 flex justify-between font-bold text-rose-700">
              <span>Balance Remaining:</span>
              <span className="font-mono text-sm">{formatCurrency(bill.remainingBalance, currency)}</span>
            </div>
          </div>
        </div>

        {/* Compact Terms & Signatures */}
        <div className="border-t border-slate-200 pt-2 space-y-2 text-[10px] text-slate-500">
          <div className="flex justify-between gap-4">
            <p>
              <span className="font-bold text-slate-700">Warranty:</span> {shop?.warrantyText || "1 Year Structural Warranty."}
            </p>
            <p className="text-right">
              <span className="font-bold text-slate-700">Policy:</span> {shop?.footerText || "Goods once sold can be exchanged within 7 days."}
            </p>
          </div>

          <div className="flex justify-between items-end pt-8">
            <div className="text-center w-36 border-t border-slate-400 pt-1">
              <p className="text-[10px] font-medium text-slate-600">Customer Signature</p>
            </div>
            <div className="text-center w-36 border-t border-slate-400 pt-1">
              <p className="text-[10px] font-medium text-slate-600">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Record Payment for Bill</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Invoice #{bill.billNumber} | Customer: {customer?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePayment} className="space-y-3 pt-1">
            {payError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {payError}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Remaining Balance on this Bill:</span>
              <span className="font-bold text-rose-700 font-mono text-sm">
                {formatCurrency(bill.remainingBalance, currency)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Date *</label>
              <Input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Amount to Pay ({currency}) *</label>
              <NumericInput
                prefixSymbol={currency}
                value={payAmount}
                onChangeValue={(val) => setPayAmount(val)}
                placeholder="0"
                className="text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Payment Method</label>
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
              <label className="text-xs font-semibold text-slate-700">Reference / Cheque #</label>
              <Input
                placeholder="e.g. TRF-99482"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPayModalOpen(false)}
                disabled={paySubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={paySubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {paySubmitting ? "Recording..." : "Save Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}