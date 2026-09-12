"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Phone,
  MapPin,
  ArrowLeft,
  CreditCard,
  Truck,
  Printer,
  Trash2,
  AlertCircle,
  Calendar,
  DollarSign,
  Receipt,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadData = () => {
    setLoading(true);
    fetch(`/api/vendors/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setPayAmount(res.data.vendor.currentPayable > 0 ? res.data.vendor.currentPayable : 0);
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
      setPayError("Payment ki raqam 0 se zyada honi chahiye.");
      return;
    }

    setPaySubmitting(true);
    setPayError("");

    try {
      const res = await fetch("/api/vendors/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: params.id,
          date: payDate,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          referenceNumber: payRef,
          notes: payNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setPayError(json.message || "Payment process karne me masla aya.");
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

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/vendors/${params.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setDeleteError(json.message || "Failed to delete vendor");
        return;
      }
      router.push("/vendors");
    } catch (err: any) {
      setDeleteError("Network error while deleting vendor.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">
        Vendor ka khata load ho raha hai...
      </div>
    );
  }

  if (!data || !data.vendor) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700">Vendor Nahi Mila</p>
        <Link href="/vendors">
          <Button size="sm" variant="outline">Wapis Vendors List</Button>
        </Link>
      </div>
    );
  }

  const { vendor, summary, gateIns = [], payments = [] } = data;
  const currency = data.shop?.currency || "Rs.";
  const hasDue = (summary.currentPayable || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Top Bar (Screen Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div className="flex items-center space-x-3">
          <Link href="/vendors">
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs text-slate-700 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Wapis List</span>
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {vendor.name}
              </h1>
              {vendor.companyName && (
                <Badge variant="outline" className="text-xs font-semibold text-slate-700 bg-slate-50">
                  {vendor.companyName}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>Phone: <strong className="font-mono text-slate-700">{vendor.phone || "-"}</strong></span>
              {vendor.address && <span>• Pata: {vendor.address}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Record Payment Button */}
          <Button
            size="sm"
            onClick={() => {
              setPayAmount(summary.currentPayable > 0 ? summary.currentPayable : 0);
              setPayDate(new Date().toISOString().split("T")[0]);
              setPayMethod("Cash");
              setPayRef("");
              setPayNotes("");
              setPayError("");
              setPayModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
          >
            <CreditCard className="h-4 w-4" />
            <span>+ Payment Likhein</span>
          </Button>

          {/* Print Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="border-slate-300 text-slate-800 hover:bg-slate-50 flex items-center space-x-1.5 font-bold text-xs bg-white"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Print Khata</span>
          </Button>

          {/* Delete Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeleteModalOpen(true)}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs bg-white"
            title="Vendor Delete Karein"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary / Baqi Rakam Highlight Card (Screen Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        {/* Total Purchases */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kul Kharidari (Total Purchases)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(summary.totalPurchases, currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{gateIns.length} Kharidari / Gate In Bills</p>
          </CardContent>
        </Card>

        {/* Total Paid */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Kul Diye Gaye Paise (Total Paid)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
              {formatCurrency(summary.totalPaid, currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{payments.length} Payments recorded</p>
          </CardContent>
        </Card>

        {/* Total Baqi Dena Hai (Prominent) */}
        <Card className={`shadow-xs border-2 ${hasDue ? "border-rose-400 bg-rose-50/70" : "border-emerald-300 bg-emerald-50/70"}`}>
          <CardHeader className="p-4 pb-1">
            <CardTitle className={`text-xs font-black uppercase tracking-wider ${hasDue ? "text-rose-900" : "text-emerald-900"}`}>
              Total Baqi Dena Hai (Baqi Khata)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className={`text-2xl sm:text-3xl font-black font-mono ${hasDue ? "text-rose-700" : "text-emerald-700"}`}>
              {formatCurrency(summary.currentPayable, currency)}
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              {hasDue ? "Yeh raqam supplier ko ada karni hai" : "Hisab bilkul saaf hai (Nill)"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: PURCHASES / BILLS (SCREEN ONLY) */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              1. Maal Ki Kharidari / Bills ({gateIns.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Supplier se aya hua maal</span>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100/60 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-3 text-left font-bold">Tareekh & Time</th>
                  <th className="p-3 text-left font-bold">Bill / Gate In #</th>
                  <th className="p-3 text-left font-bold">Supplier Invoice #</th>
                  <th className="p-3 text-right font-bold">Bill Total Rakam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gateIns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Abhi tak koi kharidari bill darj nahi hua.
                    </td>
                  </tr>
                ) : (
                  gateIns.map((g: any) => (
                    <tr key={g.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-600">{formatDateTime(g.createdAt || g.date)}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{g.gateInNumber}</td>
                      <td className="p-3 text-slate-700">{g.vendorInvoiceNumber || "-"}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(g.totalAmount, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: PAYMENTS HISTORY (SCREEN ONLY) */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              2. Diye Gaye Paise / Payments History ({payments.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Supplier ko ada ki gayi rakam</span>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100/60 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-3 text-left font-bold">Payment Tareekh & Time</th>
                  <th className="p-3 text-left font-bold">Receipt / Voucher #</th>
                  <th className="p-3 text-left font-bold">Tareeqa (Method)</th>
                  <th className="p-3 text-left font-bold">Reference / Notes</th>
                  <th className="p-3 text-right font-bold">Ada Ki Gayi Rakam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Abhi tak koi payment darj nahi ki gayi.
                    </td>
                  </tr>
                ) : (
                  payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-600">{formatDateTime(p.createdAt || p.date)}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="p-3 font-semibold text-slate-700">{p.paymentMethod}</td>
                      <td className="p-3 text-slate-500">{p.referenceNumber || p.notes || "-"}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                        {formatCurrency(p.amount, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* HIGH-DEFINITION PRINT STATEMENT (Visible ONLY on print) */}
      {/* ========================================================= */}
      <div className="hidden print-only print-container space-y-4 text-slate-900">
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              {data.shop?.name || "Furniture Enterprise"}
            </h1>
            <p className="text-xs text-slate-600">{data.shop?.address || "Main Showroom & Warehouse"}</p>
            <p className="text-xs text-slate-600">Phone: {data.shop?.phone || "-"} | Email: {data.shop?.email || "-"}</p>
          </div>
          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white font-black text-xs px-2.5 py-1 uppercase tracking-wider rounded">
              Vendor Khata Statement
            </div>
            <p className="text-[11px] text-slate-600 mt-1 font-mono">
              Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Vendor Info & Total Remaining Balance Box */}
        <div className="grid grid-cols-2 gap-3 border border-slate-300 p-3 rounded bg-slate-50/50">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Vendor / Supplier Details</span>
            <h2 className="text-sm font-extrabold text-slate-900">{vendor.name}</h2>
            {vendor.companyName && <p className="text-xs font-semibold text-slate-700">{vendor.companyName}</p>}
            <p className="text-xs text-slate-600">Phone: {vendor.phone || "-"}</p>
            {vendor.address && <p className="text-xs text-slate-600">Address: {vendor.address}</p>}
          </div>
          <div className="border-l border-slate-200 pl-3 flex flex-col justify-between">
            <div className="flex justify-between text-xs pb-1 border-b border-slate-200">
              <span className="text-slate-600">Kul Kharidari (Purchases):</span>
              <span className="font-mono font-bold">{formatCurrency(summary.totalPurchases, currency)}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-slate-200">
              <span className="text-slate-600">Kul Diye Gaye Paise (Paid):</span>
              <span className="font-mono font-bold text-emerald-700">{formatCurrency(summary.totalPaid, currency)}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 pb-1 px-2 bg-amber-100 rounded border border-amber-300 mt-1">
              <span className="text-xs font-black uppercase text-amber-950">Total Baqi Dena Hai:</span>
              <span className="text-base font-black text-rose-700 font-mono">{formatCurrency(summary.currentPayable, currency)}</span>
            </div>
          </div>
        </div>

        {/* Print Section 1: Purchases */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider">
            1. Maal Kharidari / Bills ({gateIns.length})
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
              {gateIns.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-2 text-slate-500">Koi bill nahi hai.</td></tr>
              ) : (
                gateIns.map((g: any) => (
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

        {/* Print Section 2: Payments */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase text-emerald-900 tracking-wider">
            2. Diye Gaye Paise / Payments ({payments.length})
          </h3>
          <table>
            <thead>
              <tr>
                <th className="text-left">Payment Date & Time</th>
                <th className="text-left">Voucher #</th>
                <th className="text-left">Method</th>
                <th className="text-left">Ref / Notes</th>
                <th className="text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-2 text-slate-500">Koi payment nahi hai.</td></tr>
              ) : (
                payments.map((p: any) => (
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

      {/* Record Payment Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Supplier Ko Payment Dein
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {vendor.name} ke khate me ada ki gayi payment darj karein.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePayment} className="space-y-3.5">
            {payError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center text-xs">
              <span className="font-bold text-amber-950">Mojooda Baqi Rakam:</span>
              <span className="font-mono font-black text-rose-700 text-sm">
                {formatCurrency(summary.currentPayable, currency)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Payment Ki Rakam (Amount) *</label>
              <NumericInput
                value={payAmount}
                onChangeValue={(val) => setPayAmount(val)}
                className="text-sm font-mono font-bold h-10 border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Payment Ki Tareekh</label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Tareeqa (Method)</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Cash">Cash (Naqad)</option>
                  <option value="Bank Transfer">Bank Transfer (Online)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="JazzCash / EasyPaisa">JazzCash / EasyPaisa</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Reference / Notes (Optional)</label>
              <Input
                placeholder="e.g. Cheque # ya Meezan bank transfer"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="text-xs h-9"
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                {paySubmitting ? "Processing..." : "Payment Save Karein"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              <span>Vendor Delete Karein</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Kia aap waqai vendor <strong className="text-slate-900">{vendor.name}</strong> ko delete karna chahte hain? Is se iska tamam purana khata record khatam ho jaye ga.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
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
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              {deleteLoading ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}