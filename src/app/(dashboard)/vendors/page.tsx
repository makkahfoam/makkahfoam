"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  BookOpen,
  CreditCard,
  Truck,
  Phone,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Store,
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

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingBalance, setOpeningBalance] = useState(0);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Quick Payment Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payVendor, setPayVendor] = useState<any | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");

  // Delete Vendor Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadVendors = () => {
    setLoading(true);
    fetch("/api/vendors")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setVendors(res.data || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setName("");
    setCompanyName("");
    setPhone("");
    setAddress("");
    setOpeningBalance(0);
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (v: any) => {
    setEditingVendor(v);
    setName(v.name || "");
    setCompanyName(v.companyName || "");
    setPhone(v.phone || "");
    setAddress(v.address || "");
    setOpeningBalance(v.openingBalance || 0);
    setFormError("");
    setModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Vendor ka naam likhna lazmi hai.");
      return;
    }

    setFormSubmitting(true);
    setFormError("");

    try {
      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : "/api/vendors";
      const method = editingVendor ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          companyName: companyName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          openingBalance: Number(openingBalance) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "Failed to save vendor.");
      } else {
        setModalOpen(false);
        loadVendors();
      }
    } catch (err: any) {
      setFormError("Network error occurred. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenPay = (v: any) => {
    setPayVendor(v);
    setPayAmount(v.currentPayable > 0 ? v.currentPayable : 0);
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayMethod("Cash");
    setPayRef("");
    setPayNotes("");
    setPayError("");
    setPayModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payVendor || payAmount <= 0) {
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
          vendorId: payVendor.id,
          date: payDate,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          referenceNumber: payRef,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPayError(data.message || "Payment process karne me masla aya.");
      } else {
        setPayModalOpen(false);
        loadVendors();
      }
    } catch (err: any) {
      setPayError("Network error occurred.");
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleOpenDelete = (v: any) => {
    setVendorToDelete(v);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!vendorToDelete) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/vendors/${vendorToDelete.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setDeleteError(json.message || "Vendor delete nahi ho saka.");
        return;
      }
      setVendors((prev) => prev.filter((v) => v.id !== vendorToDelete.id));
      setDeleteModalOpen(false);
    } catch (err: any) {
      setDeleteError("Network error while deleting vendor.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPayable = vendors.reduce((acc, v) => acc + (v.currentPayable || 0), 0);

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.companyName && v.companyName.toLowerCase().includes(q)) ||
      (v.phone && v.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Vendors / Suppliers
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {vendors.length} Total
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lakri (Timber), Foam, Hardware aur raw material suppliers ka hisab kitab (Khata).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>+ Naya Vendor Add Karein</span>
          </Button>
        </div>
      </div>

      {/* 2 Clear KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Vendors */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-slate-600" />
              <span>Kul Suppliers (Total Vendors)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{vendors.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Active business suppliers directory</p>
          </CardContent>
        </Card>

        {/* Total Baqi Dena Hai */}
        <Card className="border-rose-200 shadow-xs bg-rose-50/50 border-2">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Total Baqi Dena Hai (Kul Payable Rakam)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono">
              {formatCurrency(totalPayable)}
            </div>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">
              Tamam suppliers ko kul itni payment ada karni hai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Vendor ka naam, company ya phone number search karein..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-xs sm:text-sm h-10 bg-slate-50/50 border-slate-200 focus-visible:ring-amber-500"
          />
        </div>
      </div>

      {/* Simplified Vendors Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHead className="font-bold text-slate-800 text-xs">Supplier / Company</TableHead>
                  <TableHead className="font-bold text-slate-800 text-xs">Phone Number</TableHead>
                  <TableHead className="font-bold text-slate-800 text-xs">City / Address</TableHead>
                  <TableHead className="font-bold text-slate-800 text-xs text-right">Baqi Khata (Dena Hai)</TableHead>
                  <TableHead className="font-bold text-slate-800 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-xs text-slate-500">
                      Vendors load ho rahay hain...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Building2 className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">Koi Vendor Mojood Nahi Hai</p>
                        <p className="text-xs text-slate-400">Naya supplier shamil karne ke liye upar "+ Naya Vendor Add Karein" dabayein.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((v) => {
                    const hasDue = (v.currentPayable || 0) > 0;
                    return (
                      <TableRow key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Supplier Name */}
                        <TableCell>
                          <Link href={`/vendors/${v.id}`} className="font-bold text-xs sm:text-sm text-amber-700 hover:underline block">
                            {v.name}
                          </Link>
                          {v.companyName && (
                            <span className="text-[11px] text-slate-500 block">{v.companyName}</span>
                          )}
                        </TableCell>

                        {/* 2. Phone */}
                        <TableCell className="text-xs font-mono text-slate-700">
                          {v.phone || "-"}
                        </TableCell>

                        {/* 3. Address */}
                        <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                          {v.address || "-"}
                        </TableCell>

                        {/* 4. Baqi Khata */}
                        <TableCell className="text-right font-mono text-xs sm:text-sm font-bold">
                          {hasDue ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-extrabold text-xs">
                              {formatCurrency(v.currentPayable)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">
                              Rs. 0 (Saaf)
                            </span>
                          )}
                        </TableCell>

                        {/* 5. Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Khata / View */}
                            <Link href={`/vendors/${v.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs text-slate-800 hover:text-amber-700 border-slate-300 font-bold bg-white"
                                title="Vendor Ka Pura Khata Dekhein"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                                <span>Khata Dekhein</span>
                              </Button>
                            </Link>

                            {/* Payment */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPay(v)}
                              className="h-7 px-2.5 text-xs text-emerald-800 hover:bg-emerald-50 border-emerald-300 font-bold bg-emerald-50/50"
                              title="Supplier Ko Payment Dein"
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                              <span>Payment Dein</span>
                            </Button>

                            {/* Edit */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(v)}
                              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 border-slate-200"
                              title="Edit Vendor"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            {/* Delete */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDelete(v)}
                              className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                              title="Delete Vendor"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Simple Add/Edit Vendor Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingVendor ? "Vendor Ki Maloomat Tabdeel Karein" : "Naya Supplier / Vendor Add Karein"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Supplier ka naam aur phone number darj karein.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVendor} className="space-y-3.5">
            {formError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Supplier / Vendor Ka Naam *</label>
              <Input
                required
                placeholder="e.g. Tariq Wood Traders ya Bilal Hardware"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Company / Dukan Ka Naam (Optional)</label>
              <Input
                placeholder="e.g. Tariq Timber Pvt Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Phone Number (Optional)</label>
              <Input
                placeholder="e.g. 0300 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Shehar / Pata (City / Address)</label>
              <Input
                placeholder="e.g. Timber Market, Ravi Road, Lahore"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {!editingVendor && (
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-slate-700">
                  Pehle Se Baqi Rakam (Opening Balance)
                </label>
                <NumericInput
                  value={openingBalance}
                  onChangeValue={(val) => setOpeningBalance(val)}
                  placeholder="Agar pehle se koi baqi dena hai to likhein..."
                  className="text-xs h-9 font-mono"
                />
                <p className="text-[10px] text-slate-400">Agar hisab bilkul naya hai to 0 rehne dein.</p>
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
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                {formSubmitting ? "Saving..." : editingVendor ? "Update Karein" : "Save Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Payment Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Supplier Ko Payment Dein
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {payVendor?.name} ke khate me ada ki gayi payment darj karein.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePayment} className="space-y-3.5">
            {payError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            {/* Outstanding info */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center text-xs">
              <span className="font-bold text-amber-950">Mojooda Baqi Rakam:</span>
              <span className="font-mono font-black text-rose-700 text-sm">
                {formatCurrency(payVendor?.currentPayable || 0)}
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
              Kia aap waqai vendor <strong className="text-slate-900">{vendorToDelete?.name}</strong> ko delete karna chahte hain? Is se is vendor ka khata aur tamam purana record khatam ho jaye ga.
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