"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  BookOpen,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit2,
  DollarSign,
  AlertCircle,
  ReceiptText,
} from "lucide-react";
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
import { formatCurrency } from "@/lib/utils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Quick Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payCustomer, setPayCustomer] = useState<any | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");

  // Customer Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [openingBalance, setOpeningBalance] = useState(0);
  const [notes, setNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadCustomers = () => {
    setLoading(true);
    fetch("/api/customers")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCustomers(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setWhatsapp("");
    setAddress("");
    setEmail("");
    setOpeningBalance(0);
    setNotes("");
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone || "");
    setWhatsapp(c.whatsapp || "");
    setAddress(c.address || "");
    setEmail(c.email || "");
    setOpeningBalance(c.openingBalance || 0);
    setNotes(c.notes || "");
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenPay = (c: any) => {
    setPayCustomer(c);
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayAmount(c.currentReceivable > 0 ? c.currentReceivable : 0);
    setPayMethod("Cash");
    setPayRef("");
    setPayNotes("");
    setPayError("");
    setPayModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setFormError("Customer name is required.");
      return;
    }

    setFormSubmitting(true);
    setFormError("");

    try {
      const payload = {
        id: editingCustomer?.id,
        name,
        phone,
        whatsapp,
        address,
        email,
        openingBalance,
        notes,
      };

      const res = await fetch("/api/customers", {
        method: editingCustomer ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "Failed to save customer.");
      } else {
        setModalOpen(false);
        loadCustomers();
      }
    } catch (err: any) {
      setFormError("Network error occurred.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payCustomer || payAmount <= 0) {
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
          customerId: payCustomer.id,
          date: payDate,
          amount: payAmount,
          paymentMethod: payMethod,
          referenceNumber: payRef,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPayError(data.message || "Failed to process receipt.");
      } else {
        setPayModalOpen(false);
        loadCustomers();
      }
    } catch (err: any) {
      setPayError("Network error occurred.");
    } finally {
      setPaySubmitting(false);
    }
  };

  const totalOutstanding = customers.reduce((acc, c) => acc + (c.currentReceivable || 0), 0);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {customers.length} Accounts
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Retail buyers, interior designers, commercial accounts, and receivable ledger balances.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/customers/ledger">
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-800 flex items-center space-x-1.5 bg-white">
              <BookOpen className="h-4 w-4 text-slate-600" />
              <span>Dedicated Customer Ledger</span>
            </Button>
          </Link>
          <Button onClick={handleOpenAdd} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registered Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-slate-900">{customers.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Active customer profiles</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-700">Total Customer Receivables</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-blue-700">{formatCurrency(totalOutstanding)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Outstanding across all customer ledgers</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Quick POS Billing</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <p className="text-xs text-slate-600">Need to book a new order?</p>
            <Link href="/billing/new">
              <Button size="sm" variant="outline" className="h-7 text-xs flex items-center space-x-1 border-emerald-300 bg-emerald-50/50 text-emerald-800">
                <ReceiptText className="h-3.5 w-3.5" />
                <span>New Bill</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search customer by name, code, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-slate-50/50"
          />
        </div>
      </div>

      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Code</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Contact / Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Opening Bal</TableHead>
                <TableHead className="text-right">Outstanding Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">Loading customers...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">No customers found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold text-xs text-slate-900">{c.customerCode}</TableCell>
                    <TableCell>
                      <Link href={`/customers/${c.id}`} className="font-semibold text-xs text-amber-700 hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <div>{c.phone || "-"}</div>
                      {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">{c.address || "-"}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-600">
                      {formatCurrency(c.openingBalance)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-extrabold text-rose-700">
                      {formatCurrency(c.currentReceivable)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Link href={`/customers/${c.id}`}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" title="View Full Account">
                            <Eye className="h-3.5 w-3.5 mr-1 text-slate-600" />
                            <span>View</span>
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPay(c)}
                          className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                          title="Record Payment"
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" />
                          <span>Receive</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(c)}
                          className="h-7 w-7 p-0"
                          title="Edit Profile"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Customer Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingCustomer ? "Edit Customer Profile" : "Register New Customer"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide contact info and starting opening balance receivable.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCustomer} className="space-y-3">
            {formError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Customer Full Name *</label>
              <Input
                required
                placeholder="e.g. Ali Raza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Phone</label>
                <Input
                  placeholder="+92 322 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">WhatsApp</label>
                <Input
                  placeholder="+92 322 1234567"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <Input
                type="email"
                placeholder="customer@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Delivery / Residential Address</label>
              <Input
                placeholder="House #, Street, Phase / Sector, City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-xs"
              />
            </div>

            {!editingCustomer && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Opening Balance Receivable (Rs.)</label>
                <NumericInput
                  prefixSymbol="Rs."
                  value={openingBalance}
                  onChangeValue={(val) => setOpeningBalance(val)}
                  placeholder="0"
                  className="text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  Opening balance will permanently become the first transaction in this customer's ledger.
                </p>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={formSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              >
                {formSubmitting ? "Saving..." : editingCustomer ? "Update Customer" : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Customer Payment Dialog */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Record Customer Payment Receipt</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">{payCustomer?.name}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePayment} className="space-y-3">
            {payError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {payError}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Total Outstanding:</span>
              <span className="font-bold text-rose-700 font-mono text-sm">
                {formatCurrency(payCustomer?.currentReceivable)}
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
              <label className="text-xs font-semibold text-slate-700">Amount Received (Rs.) *</label>
              <NumericInput
                prefixSymbol="Rs."
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
                placeholder="e.g. Bank slip # or JazzCash Trx ID"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Notes / Remarks</label>
              <Input
                placeholder="e.g. Final settlement of balance"
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
    </div>
  );
}