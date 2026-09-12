"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ReceiptText,
  Plus,
  Trash2,
  Search,
  UserCheck,
  UserPlus,
  Calendar,
  DollarSign,
  AlertCircle,
  ArrowLeft,
  Package,
  X,
  Check,
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
import { formatCurrency } from "@/lib/utils";

interface BillLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountType: "fixed" | "percentage";
  discountValue: number;
  discountAmount: number;
  total: number;
  availableStock: number;
}

export default function NewBillPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bill Header Form
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Quick Add New Customer Modal
  const [newCustModalOpen, setNewCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustSaving, setNewCustSaving] = useState(false);
  const [newCustError, setNewCustError] = useState("");

  // Product Catalog Search Modal
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [activeItemIndexForCatalog, setActiveItemIndexForCatalog] = useState<number | null>(null);

  // Items
  const [items, setItems] = useState<BillLineItem[]>([
    {
      productId: "",
      productName: "",
      quantity: 1,
      unit: "Pcs",
      unitPrice: 0,
      discountType: "fixed",
      discountValue: 0,
      discountAmount: 0,
      total: 0,
      availableStock: 0,
    },
  ]);

  // Overall Discount & Payment
  const [overallDiscountType, setOverallDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [overallDiscountValue, setOverallDiscountValue] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([cRes, pRes]) => {
        if (cRes.success) setCustomers(cRes.data);
        if (pRes.success) setProducts(pRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Filtered customers based on search
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.customerCode && c.customerCode.toLowerCase().includes(q))
    );
  });

  // Handle Quick Create Customer
  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      setNewCustError("Customer Name is required.");
      return;
    }

    setNewCustSaving(true);
    setNewCustError("");

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustName.trim(),
          phone: newCustPhone.trim(), // Optional cell number
          address: newCustAddress.trim(),
          openingBalance: 0,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setNewCustError(json.message || "Failed to create customer.");
      } else {
        const created = json.data;
        // Prepend to customers list and auto-select
        setCustomers((prev) => [created, ...prev]);
        setCustomerId(created.id);
        setNewCustModalOpen(false);
        setNewCustName("");
        setNewCustPhone("");
        setNewCustAddress("");
      }
    } catch (err) {
      setNewCustError("Network error while creating customer.");
    } finally {
      setNewCustSaving(false);
    }
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const next = [...items];
    const qty = next[index].quantity || 1;
    const price = prod.sellingPrice || 0;
    const discType = next[index].discountType;
    const discVal = next[index].discountValue;
    const rawTotal = qty * price;
    const discAmt = discType === "percentage" ? (rawTotal * discVal) / 100 : discVal;
    const total = Math.max(0, rawTotal - discAmt);

    next[index] = {
      ...next[index],
      productId: prod.id,
      productName: prod.name,
      unit: prod.unit,
      unitPrice: price,
      total,
      discountAmount: discAmt,
      availableStock: prod.currentStock,
    };
    setItems(next);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const next = [...items];
    const price = next[index].unitPrice || 0;
    const discType = next[index].discountType;
    const discVal = next[index].discountValue;
    const rawTotal = qty * price;
    const discAmt = discType === "percentage" ? (rawTotal * discVal) / 100 : discVal;
    const total = Math.max(0, rawTotal - discAmt);

    next[index] = { ...next[index], quantity: qty, total, discountAmount: discAmt };
    setItems(next);
  };

  const handlePriceChange = (index: number, price: number) => {
    const next = [...items];
    const qty = next[index].quantity || 1;
    const discType = next[index].discountType;
    const discVal = next[index].discountValue;
    const rawTotal = qty * price;
    const discAmt = discType === "percentage" ? (rawTotal * discVal) / 100 : discVal;
    const total = Math.max(0, rawTotal - discAmt);

    next[index] = { ...next[index], unitPrice: price, total, discountAmount: discAmt };
    setItems(next);
  };

  const handleItemDiscountChange = (index: number, val: number, type?: "fixed" | "percentage") => {
    const next = [...items];
    const qty = next[index].quantity || 1;
    const price = next[index].unitPrice || 0;
    const discType = type || next[index].discountType;
    const rawTotal = qty * price;
    const discAmt = discType === "percentage" ? (rawTotal * val) / 100 : val;
    const total = Math.max(0, rawTotal - discAmt);

    next[index] = {
      ...next[index],
      discountType: discType,
      discountValue: val,
      discountAmount: discAmt,
      total,
    };
    setItems(next);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        productName: "",
        quantity: 1,
        unit: "Pcs",
        unitPrice: 0,
        discountType: "fixed",
        discountValue: 0,
        discountAmount: 0,
        total: 0,
        availableStock: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const openCatalogForIndex = (index: number) => {
    setActiveItemIndexForCatalog(index);
    setCatalogSearch("");
    setCatalogModalOpen(true);
  };

  const handlePickProductFromCatalog = (prod: any) => {
    if (activeItemIndexForCatalog !== null) {
      handleProductSelect(activeItemIndexForCatalog, prod.id);
    } else {
      // Add as new row
      setItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: 1,
          unit: prod.unit,
          unitPrice: prod.sellingPrice || 0,
          discountType: "fixed",
          discountValue: 0,
          discountAmount: 0,
          total: prod.sellingPrice || 0,
          availableStock: prod.currentStock,
        },
      ]);
    }
    setCatalogModalOpen(false);
  };

  // Filter products for catalog search
  const filteredProducts = products.filter((p) => {
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  });

  const subtotal = items.reduce((acc, it) => acc + (it.total || 0), 0);
  const overallDiscountAmount =
    overallDiscountType === "percentage"
      ? (subtotal * overallDiscountValue) / 100
      : overallDiscountValue;
  const grandTotal = Math.max(0, subtotal - overallDiscountAmount);
  const remaining = Math.max(0, grandTotal - paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError("Please select or add a customer.");
      return;
    }

    const invalid = items.some((it) => !it.productId || it.quantity <= 0);
    if (invalid) {
      setError("Please ensure every row has a selected product and a valid quantity.");
      return;
    }

    const outOfStockItem = items.find((it) => it.quantity > it.availableStock);
    if (outOfStockItem) {
      setError(
        `Insufficient stock for "${outOfStockItem.productName}". Available: ${outOfStockItem.availableStock}, requested: ${outOfStockItem.quantity}.`
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          date,
          items,
          discountType: overallDiscountType,
          discountValue: overallDiscountValue,
          paidAmount,
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to generate bill.");
      } else {
        router.push(`/billing/${data.data.billId}`);
      }
    } catch (err: any) {
      setError("Network error occurred while submitting bill.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <Link href="/billing" className="text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Generate Sales Bill (POS)</h1>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs">
                Active Terminal
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or create customer, search products, check live stocks, and generate invoice.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Selection & Quick Add */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-amber-600" />
              Customer Information
            </CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={() => setNewCustModalOpen(true)}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-2xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ New Customer</span>
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Select Customer <span className="text-rose-500">*</span>
                </label>
                {/* Search Filter for Customer */}
                <div className="relative w-48">
                  <Search className="h-3 w-3 absolute left-2 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name or cell..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-6 pr-2 py-0.5 text-[11px] rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Choose Customer ({filteredCustomers.length} available) --</option>
                {filteredCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""} [{c.customerCode}] - Due: {formatCurrency(c.currentReceivable)}
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="pt-1.5 flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-500">Customer:</span>{" "}
                    <span className="font-bold text-slate-900">{selectedCustomer.name}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div>
                      <span className="text-slate-500">Cell:</span>{" "}
                      <span className="font-mono font-medium text-slate-800">{selectedCustomer.phone}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Previous Balance / Khata Due:</span>{" "}
                    <span className={`font-mono font-bold ${selectedCustomer.currentReceivable > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                      {formatCurrency(selectedCustomer.currentReceivable)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Invoice Date *</span>
              </label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items Table with Search & Quick Catalog Picker */}
        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-amber-600" />
                Furniture Line Items
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Type product name or click &ldquo;Search Catalog&rdquo; to quickly find and add items.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openCatalogForIndex(items.length - 1)}
                className="text-xs flex items-center space-x-1 bg-amber-50/50 border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                <Search className="h-3.5 w-3.5 text-amber-600" />
                <span>Search Catalog</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="text-xs flex items-center space-x-1 bg-white"
              >
                <Plus className="h-3.5 w-3.5 text-amber-600" />
                <span>Add Row</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-2.5 text-left w-10">#</th>
                    <th className="p-2.5 text-left min-w-[280px]">Furniture Item (Search / Select)</th>
                    <th className="p-2.5 text-left w-20">Stock</th>
                    <th className="p-2.5 text-right w-24">Qty</th>
                    <th className="p-2.5 text-right w-32">Unit Price</th>
                    <th className="p-2.5 text-right w-36">Discount</th>
                    <th className="p-2.5 text-right w-32">Total</th>
                    <th className="p-2.5 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const isExceeded = item.productId && item.quantity > item.availableStock;
                    return (
                      <tr key={idx} className={`hover:bg-slate-50/50 ${isExceeded ? "bg-rose-50/40" : ""}`}>
                        <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5">
                            <select
                              required
                              value={item.productId}
                              onChange={(e) => handleProductSelect(idx, e.target.value)}
                              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="">-- Choose Furniture Item --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku}) - {p.currentStock} {p.unit} avail
                                </option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openCatalogForIndex(idx)}
                              className="h-8 px-2 text-slate-500 hover:text-amber-700 shrink-0"
                              title="Search catalog"
                            >
                              <Search className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`font-mono text-xs ${
                              item.availableStock < 3 ? "text-rose-700 font-bold" : "text-slate-600"
                            }`}
                          >
                            {item.availableStock} {item.unit}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <NumericInput
                            value={item.quantity}
                            onChangeValue={(val) => handleQtyChange(idx, val)}
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2.5">
                          <NumericInput
                            prefixSymbol="Rs."
                            value={item.unitPrice}
                            onChangeValue={(val) => handlePriceChange(idx, val)}
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center space-x-1">
                            <select
                              value={item.discountType}
                              onChange={(e) =>
                                handleItemDiscountChange(idx, item.discountValue, e.target.value as any)
                              }
                              className="h-8 rounded border border-input bg-background px-1 text-[11px] text-slate-700"
                            >
                              <option value="fixed">Rs.</option>
                              <option value="percentage">%</option>
                            </select>
                            <NumericInput
                              value={item.discountValue}
                              onChangeValue={(val) => handleItemDiscountChange(idx, val)}
                              className="h-8 text-xs font-mono w-20"
                            />
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={items.length <= 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Summary & Advance Payment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-7 border-slate-200 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Notes & Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              <textarea
                rows={3}
                placeholder="e.g. Delivery scheduled for Friday. 1 Year Wood Guarantee applied."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="text-[11px] text-slate-400">
                Notes will be printed at the bottom of the customer&apos;s invoice.
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-5 border-slate-200 shadow-xs bg-slate-50/50">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Bill Discount:</span>
                <div className="flex items-center space-x-1.5 w-36">
                  <select
                    value={overallDiscountType}
                    onChange={(e) => setOverallDiscountType(e.target.value as any)}
                    className="h-8 rounded border border-input bg-background px-1 text-[11px]"
                  >
                    <option value="fixed">Rs.</option>
                    <option value="percentage">%</option>
                  </select>
                  <NumericInput
                    value={overallDiscountValue}
                    onChangeValue={(val) => setOverallDiscountValue(val)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-base text-amber-700">{formatCurrency(grandTotal)}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-emerald-800">Paid / Advance (Rs.):</span>
                  <div className="w-36">
                    <NumericInput
                      prefixSymbol="Rs."
                      value={paidAmount}
                      onChangeValue={(val) => setPaidAmount(val)}
                      className="h-8 text-xs font-mono font-bold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Payment Mode:</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-8 w-36 rounded border border-input bg-background px-2 text-xs"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI">UPI / Mobile</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between items-center font-bold text-rose-700">
                <span>Remaining Due:</span>
                <span className="font-mono text-sm">{formatCurrency(remaining)}</span>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 shadow-sm"
                >
                  <ReceiptText className="h-4 w-4 mr-2" />
                  {submitting ? "Processing & Generating Bill..." : "Generate & Save Bill"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* QUICK ADD CUSTOMER MODAL */}
      <Dialog open={newCustModalOpen} onOpenChange={setNewCustModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-amber-600" />
              Quick Add New Customer
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add customer details right on the billing counter. Mobile number is optional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCreateCustomer} className="space-y-3.5 pt-1">
            {newCustError && (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {newCustError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Haji Muhammad Tariq"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="text-xs h-9 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Cell / Mobile Number</span>
                <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                placeholder="e.g. 0300-1234567"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="text-xs h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Address / Location</span>
                <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                placeholder="e.g. House 42, Street 3, Lahore"
                value={newCustAddress}
                onChange={(e) => setNewCustAddress(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewCustModalOpen(false)}
                disabled={newCustSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={newCustSaving}
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                {newCustSaving ? "Saving..." : "Save & Select Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SEARCH PRODUCT CATALOG MODAL */}
      <Dialog open={catalogModalOpen} onOpenChange={setCatalogModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Search className="h-4 w-4 text-amber-600" />
              Search & Select Furniture Item
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Type product name, SKU, or category to quickly add it to the bill.
            </DialogDescription>
          </DialogHeader>

          <div className="p-1 space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                autoFocus
                placeholder="Search by title, SKU (e.g. SOFA, BED, CHAIR)..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100 max-h-[360px]">
              {filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No furniture products found matching &ldquo;{catalogSearch}&rdquo;.
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handlePickProductFromCatalog(p)}
                    className="p-3 flex items-center justify-between hover:bg-amber-50/60 cursor-pointer transition-colors text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        SKU: {p.sku} | Brand: {p.brand || "In-House"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(p.sellingPrice)}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          p.currentStock > 3
                            ? "bg-emerald-50 text-emerald-700"
                            : p.currentStock > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {p.currentStock} {p.unit} in stock
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}