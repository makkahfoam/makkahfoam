"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, Search, Plus, Calendar, ArrowLeft, Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VendorPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Payment Entry Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/vendors").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
    ])
      .then(([vRes, dashRes]) => {
        if (vRes.success) setVendors(vRes.data);
        if (dashRes.success && dashRes.data.recentVendorPayments) {
          setPayments(dashRes.data.recentVendorPayments);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setVendorId(vendors[0]?.id || "");
    setDate(new Date().toISOString().split("T")[0]);
    setAmount(0);
    setPaymentMethod("Cash");
    setReferenceNumber("");
    setNotes("");
    setError("");
    setModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || amount <= 0) {
      setError("Please select a vendor and specify an amount greater than 0.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/vendors/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          date,
          amount,
          paymentMethod,
          referenceNumber,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to record payment.");
      } else {
        setModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setError("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVendor = vendors.find((v) => v.id === vendorId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/vendors" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vendor Payments & Disbursements</h1>
            <Badge variant="secondary" className="font-mono text-xs">Vouchers</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Issue and track disbursements to raw material and hardware vendors.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Record Vendor Payment</span>
        </Button>
      </div>

      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Voucher #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference / Cheque #</TableHead>
                <TableHead className="text-right">Amount Disbursed</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">Loading payments...</TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">No vendor payments recorded yet.</TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-bold text-xs">{p.paymentNumber}</TableCell>
                    <TableCell className="text-xs text-slate-600">{formatDate(p.date)}</TableCell>
                    <TableCell className="font-semibold text-xs text-slate-800">{p.vendorName || "Vendor"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{p.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{p.referenceNumber || "-"}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-rose-700">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/vendors/${p.vendorId}`}>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                          Ledger
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Payment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Issue Payment to Vendor</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Disburse payment to reduce vendor payable balance. Automatically updates Vendor Ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePayment} className="space-y-3">
            {error && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Choose Vendor *</label>
              <select
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.companyName ? `(${v.companyName})` : ""} [Payable: {v.currentPayable}]
                  </option>
                ))}
              </select>
              {selectedVendor && (
                <p className="text-[11px] text-slate-500">
                  Current Payable: <strong className="text-rose-700 font-mono">{formatCurrency(selectedVendor.currentPayable)}</strong>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Payment Date *</label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Payment Amount (Rs.) *</label>
              <NumericInput
                prefixSymbol="Rs."
                value={amount}
                onChangeValue={(val) => setAmount(val)}
                placeholder="0"
                className="text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
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
              <label className="text-xs font-semibold text-slate-700">Reference Number</label>
              <Input
                placeholder="e.g. CHQ-99410"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Notes / Remarks</label>
              <Input
                placeholder="e.g. Cleared payment against Gate In shipment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {submitting ? "Recording..." : "Confirm & Post Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}