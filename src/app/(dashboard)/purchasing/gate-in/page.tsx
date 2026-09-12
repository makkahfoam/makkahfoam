"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  Plus,
  Trash2,
  Calendar,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  History,
  DollarSign,
  Package,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface GateInLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  purchaseRate: number;
  total: number;
}

export default function GateInPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [vendorId, setVendorId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<GateInLineItem[]>([
    { productId: "", productName: "", quantity: 1, unit: "Pcs", purchaseRate: 0, total: 0 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/vendors").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([vRes, pRes]) => {
        if (vRes.success) setVendors(vRes.data);
        if (pRes.success) setProducts(pRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const selectedVendor = vendors.find((v) => v.id === vendorId);

  const handleProductSelect = (index: number, pId: string) => {
    const prod = products.find((p) => p.id === pId);
    if (!prod) return;

    const next = [...items];
    next[index].productId = prod.id;
    next[index].productName = prod.name;
    next[index].unit = prod.unit;
    next[index].purchaseRate = prod.purchasePrice || 0;
    next[index].total = next[index].quantity * (prod.purchasePrice || 0);
    setItems(next);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const next = [...items];
    next[index].quantity = qty;
    next[index].total = qty * next[index].purchaseRate;
    setItems(next);
  };

  const handleRateChange = (index: number, rate: number) => {
    const next = [...items];
    next[index].purchaseRate = rate;
    next[index].total = next[index].quantity * rate;
    setItems(next);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { productId: "", productName: "", quantity: 1, unit: "Pcs", purchaseRate: 0, total: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalGateInAmount = items.reduce((acc, it) => acc + (it.total || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      setError("Please select a vendor.");
      return;
    }

    const invalid = items.some((it) => !it.productId || it.quantity <= 0);
    if (invalid) {
      setError("Please ensure every line item has a selected product and a positive quantity.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/gate-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          date,
          vendorInvoiceNumber,
          items,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to process Gate In.");
      } else {
        setSuccess(data);
      }
    } catch (err: any) {
      setError("A network error occurred while processing Gate In.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto border-emerald-200 bg-emerald-50/40 p-6 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gate In Successfully Recorded!</h2>
          <p className="text-xs text-slate-600 mt-1">
            Gate In Invoice <strong className="font-mono text-emerald-800">{success.data?.gateInNumber}</strong> has been saved.
          </p>
          <div className="mt-4 p-3 bg-white rounded-md border border-emerald-200 text-left text-xs space-y-1">
            <p className="text-emerald-800 font-semibold">&bull; Product stocks increased immediately.</p>
            <p className="text-emerald-800 font-semibold">&bull; Stock movement audit log entries created.</p>
            <p className="text-emerald-800 font-semibold">&bull; Vendor ledger automatically updated with purchase amount.</p>
            <p className="text-emerald-800 font-semibold">&bull; Vendor payable balance updated.</p>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setSuccess(null);
              setItems([{ productId: "", productName: "", quantity: 1, unit: "Pcs", purchaseRate: 0, total: 0 }]);
              setVendorInvoiceNumber("");
              setNotes("");
            }}
            className="text-xs"
          >
            Create Another Gate In
          </Button>
          <Link href={`/vendors/${vendorId}`}>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
              View Vendor Ledger
            </Button>
          </Link>
          <Link href="/purchasing/gate-in/history">
            <Button variant="secondary" className="text-xs">
              View Gate In History
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vendor Gate In Invoice</h1>
            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-xs">
              Goods Receiving
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Record supplier raw materials & furniture shipments. Automatically increases stock and updates Vendor Ledger.
          </p>
        </div>

        <Link href="/purchasing/gate-in/history">
          <Button variant="outline" size="sm" className="border-slate-300 text-slate-800 flex items-center space-x-1.5 bg-white">
            <History className="h-4 w-4 text-slate-500" />
            <span>Gate In History</span>
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Vendor & Invoice Metadata */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">Receiving & Vendor Details</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                <Building2 className="h-3.5 w-3.5 text-amber-600" />
                <span>Select Vendor *</span>
              </label>
              <select
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Choose Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.companyName ? `(${v.companyName})` : ""}
                  </option>
                ))}
              </select>
              {selectedVendor && (
                <div className="pt-1 flex items-center space-x-2 text-[11px]">
                  <span className="text-slate-500">Current Payable:</span>
                  <span className="font-bold text-rose-700 font-mono">
                    {formatCurrency(selectedVendor.currentPayable)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Gate In Date *</span>
              </label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span>Vendor Invoice # / Bilty #</span>
              </label>
              <Input
                placeholder="e.g. INV-984 / TRK-5421"
                value={vendorInvoiceNumber}
                onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                className="text-xs h-9 font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Items Table */}
        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Received Products & Inventory</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Add products received in this Gate In shipment with agreed purchase rates.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="text-xs flex items-center space-x-1 bg-white"
            >
              <Plus className="h-3.5 w-3.5 text-amber-600" />
              <span>Add Product Row</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3 text-left w-10">#</th>
                    <th className="p-3 text-left min-w-[240px]">Product / Material</th>
                    <th className="p-3 text-left w-20">Unit</th>
                    <th className="p-3 text-right w-32">Quantity</th>
                    <th className="p-3 text-right w-36">Purchase Rate</th>
                    <th className="p-3 text-right w-36">Line Total</th>
                    <th className="p-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{item.unit}</td>
                      <td className="p-3">
                        {/* Notice: NumericInput automatically handles zero-replacement! */}
                        <NumericInput
                          value={item.quantity}
                          onChangeValue={(val) => handleQuantityChange(idx, val)}
                          className="h-8 text-xs font-mono"
                        />
                      </td>
                      <td className="p-3">
                        <NumericInput
                          prefixSymbol="Rs."
                          value={item.purchaseRate}
                          onChangeValue={(val) => handleRateChange(idx, val)}
                          className="h-8 text-xs font-mono"
                        />
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/80 border-t border-slate-200">
                  <tr>
                    <td colSpan={5} className="p-3 text-right font-bold text-slate-700 text-xs">
                      Gate In Invoice Grand Total:
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-sm text-amber-700">
                      {formatCurrency(totalGateInAmount)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
          <CardFooter className="p-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-1/2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Gate In Notes / Vehicle Details</label>
              <Input
                placeholder="e.g. Driver name, vehicle number, inspection pass remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-6 h-10 shadow-sm"
            >
              {submitting ? "Processing Gate In..." : "Confirm & Save Gate In Invoice"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}