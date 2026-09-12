"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, Search, Plus, Calendar, ArrowLeft, Users } from "lucide-react";
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

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Payment Entry Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
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
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
    ])
      .then(([cRes, dashRes]) => {
        if (cRes.success) setCustomers(cRes.data);
        if (dashRes.success && dashRes.data.recentCustomerPayments) {
          setPayments(dashRes.data.recentCustomerPayments);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setCustomerId(customers[0]?.id || "");
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
    if (!customerId || amount <= 0) {
      setError("Please select a customer and specify a positive amount.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/customers/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          date,
          amount,
          paymentMethod,
          referenceNumber,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to record receipt.");
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

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/customers" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Receipts & Collections</h1>
            <Badge variant="secondary" className="font-mono text-xs">Receipts</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Record direct collections from buyers to settle receivables and update Customer Ledgers.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Record Customer Receipt</span>
        </Button>
      </div>

      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference / Slip #</TableHead>
                <TableHead className="text-right">Amount Received</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">Loading receipts...</TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">No customer receipts found.</TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-bold text-xs">{p.paymentNumber}</TableCell>
                    <TableCell className="text-xs text-slate-600">{formatDate(p.date)}</TableCell>
                    <TableCell className="font-semibold text-xs text-slate-800">{p.customerName || "Customer"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{p.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{p.referenceNumber || "-"}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-emerald-700">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/customers/${p.customerId}`}>
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

      {/* Add Receipt Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Record Customer Payment Receipt</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Receiving money will immediately reduce customer receivable and post to Customer Ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePayment} className="space-y-3">
            {error && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Customer *</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} [{c.customerCode}] [Outstanding: {c.currentReceivable}]
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <p className="text-[11px] text-slate-500">
                  Current Outstanding: <strong className="text-rose-700 font-mono">{formatCurrency(selectedCustomer.currentReceivable)}</strong>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Receipt Date *</label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Amount Received (Rs.) *</label>
              <NumericInput
                prefixSymbol="Rs."
                value={amount}
                onChangeValue={(val) => setAmount(val)}
                placeholder="0"
                className="text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Payment Channel</label>
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
              <label className="text-xs font-semibold text-slate-700">Reference / Trx #</label>
              <Input
                placeholder="e.g. Bank slip or deposit reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Notes / Remarks</label>
              <Input
                placeholder="e.g. Partial recovery"
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
                {submitting ? "Recording..." : "Confirm & Post Receipt"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}