"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ArrowLeftRight,
  Package,
  TrendingDown,
  DollarSign,
  PlusCircle,
  MinusCircle,
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

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "LOW">("ALL");

  // Quick Adjustment Dialog
  const [adjOpen, setAdjOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjType, setAdjType] = useState<"ADD" | "SUBTRACT" | "SET">("ADD");
  const [adjQuantity, setAdjQuantity] = useState(0);
  const [adjReason, setAdjReason] = useState("");
  const [adjSubmitting, setAdjSubmitting] = useState(false);
  const [adjError, setAdjError] = useState("");

  const loadData = () => {
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setProducts(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdjust = (p: any) => {
    setSelectedProduct(p);
    setAdjType("ADD");
    setAdjQuantity(0);
    setAdjReason("");
    setAdjError("");
    setAdjOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (adjQuantity <= 0 && adjType !== "SET") {
      setAdjError("Quantity must be greater than 0.");
      return;
    }

    setAdjSubmitting(true);
    setAdjError("");

    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: adjType,
          quantity: adjQuantity,
          reason: adjReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAdjError(data.message || "Failed to adjust stock.");
      } else {
        setAdjOpen(false);
        loadData();
      }
    } catch (err: any) {
      setAdjError("Network error occurred.");
    } finally {
      setAdjSubmitting(false);
    }
  };

  const totalUnits = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
  const totalCostValuation = products.reduce((acc, p) => acc + (p.currentStock || 0) * (p.purchasePrice || 0), 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + (p.currentStock || 0) * (p.sellingPrice || 0), 0);
  const lowStockCount = products.filter((p) => p.currentStock <= (p.minimumStock || 5)).length;

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesLow = filterMode === "ALL" || p.currentStock <= (p.minimumStock || 5);
    return matchesSearch && matchesLow;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock & Warehouse Inventory</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {products.length} Tracked Items
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time physical stock levels, asset valuations, and instant stock adjustment reconciliation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/inventory/movements">
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-800 flex items-center space-x-1.5 bg-white">
              <ArrowLeftRight className="h-4 w-4 text-slate-600" />
              <span>Stock Movement Audit</span>
            </Button>
          </Link>
          <Link href="/purchasing/gate-in">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 shadow-xs">
              <Package className="h-4 w-4" />
              <span>Receive Gate In</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Physical Units</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-slate-900">{totalUnits.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Across showroom & warehouse</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Valuation (At Cost)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(totalCostValuation)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Inventory purchase capital</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Valuation (At Retail)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-amber-700">{formatCurrency(totalRetailValuation)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Projected gross sales value</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-amber-50/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-800">Low Stock Reorders</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-amber-800">{lowStockCount} Products</div>
            <p className="text-[11px] text-amber-700 mt-0.5">Items needing vendor Gate In</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Low Stock Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search inventory by product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={filterMode === "ALL" ? "default" : "outline"}
            onClick={() => setFilterMode("ALL")}
            className="text-xs h-8"
          >
            All Inventory
          </Button>
          <Button
            size="sm"
            variant={filterMode === "LOW" ? "destructive" : "outline"}
            onClick={() => setFilterMode("LOW")}
            className="text-xs h-8 flex items-center space-x-1"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low Stock ({lowStockCount})</span>
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost Rate</TableHead>
                <TableHead className="text-right">Stock Level</TableHead>
                <TableHead className="text-right">Total Asset Cost</TableHead>
                <TableHead>Alert Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-slate-500">
                    Loading stock records...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-slate-500">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const isLow = p.currentStock <= (p.minimumStock || 5);
                  const lineCost = (p.currentStock || 0) * (p.purchasePrice || 0);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-bold text-xs text-slate-900">{p.sku}</TableCell>
                      <TableCell className="font-semibold text-xs text-slate-800">{p.name}</TableCell>
                      <TableCell className="text-xs text-slate-500">{p.categoryName}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-600">
                        {formatCurrency(p.purchasePrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                        {p.currentStock} <span className="text-[10px] font-normal text-slate-500">{p.unit}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                        {formatCurrency(lineCost)}
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant="destructive" className="text-[10px] space-x-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Low (&le; {p.minimumStock})</span>
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px] space-x-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Optimal</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAdjust(p)}
                          className="h-7 px-2.5 text-xs text-slate-700 hover:text-amber-700 hover:border-amber-300"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                          <span>Adjust</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manual Stock Adjustment Dialog */}
      <Dialog open={adjOpen} onOpenChange={setAdjOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Manual Stock Adjustment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : "Adjust physical stock"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAdjustment} className="space-y-4">
            {adjError && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {adjError}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Current Stock on Record:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {selectedProduct?.currentStock || 0} {selectedProduct?.unit}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Adjustment Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjType("ADD")}
                  className={`p-2 rounded-md border text-xs font-medium flex items-center justify-center space-x-1 transition-all ${
                    adjType === "ADD"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Add (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjType("SUBTRACT")}
                  className={`p-2 rounded-md border text-xs font-medium flex items-center justify-center space-x-1 transition-all ${
                    adjType === "SUBTRACT"
                      ? "bg-rose-50 border-rose-500 text-rose-800 font-bold"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <MinusCircle className="h-3.5 w-3.5 text-rose-600" />
                  <span>Deduct (-)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjType("SET")}
                  className={`p-2 rounded-md border text-xs font-medium flex items-center justify-center space-x-1 transition-all ${
                    adjType === "SET"
                      ? "bg-amber-50 border-amber-500 text-amber-800 font-bold"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />
                  <span>Set To (=)</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                {adjType === "SET" ? "New Exact Stock Count" : "Quantity to Adjust"}
              </label>
              {/* Notice: NumericInput automatically handles zero-replacement! */}
              <NumericInput
                value={adjQuantity}
                onChangeValue={(val) => setAdjQuantity(val)}
                placeholder="0"
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Reason / Reference Notes</label>
              <Input
                placeholder="e.g. Physical inventory count correction, damaged item write-off"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjOpen(false)}
                disabled={adjSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={adjSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              >
                {adjSubmitting ? "Updating..." : "Commit Stock Adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}