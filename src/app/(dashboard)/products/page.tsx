"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  DollarSign,
  Tag,
  Boxes,
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

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form fields
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("Pcs");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);
  const [minimumStock, setMinimumStock] = useState(5);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/products/categories").then((r) => r.json()),
    ])
      .then(([prodRes, catRes]) => {
        if (prodRes.success) setProducts(prodRes.data);
        if (catRes.success) setCategories(catRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setSku(`PROD-${Math.floor(1000 + Math.random() * 9000)}`);
    setName("");
    setCategoryId(categories[0]?.id || "");
    setBrand("");
    setUnit("Pcs");
    setPurchasePrice(0);
    setSellingPrice(0);
    setCurrentStock(0);
    setMinimumStock(5);
    setDescription("");
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setCategoryId(p.categoryId || "");
    setBrand(p.brand || "");
    setUnit(p.unit || "Pcs");
    setPurchasePrice(p.purchasePrice || 0);
    setSellingPrice(p.sellingPrice || 0);
    setCurrentStock(p.currentStock || 0);
    setMinimumStock(p.minimumStock || 5);
    setDescription(p.description || "");
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name) {
      setFormError("SKU Code and Product Name are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        id: editingProduct?.id,
        sku,
        name,
        categoryId,
        brand,
        unit,
        purchasePrice,
        sellingPrice,
        currentStock,
        minimumStock,
        description,
      };

      const res = await fetch("/api/products", {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "Failed to save product.");
      } else {
        setModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setFormError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!confirm(`Are you sure you want to delete "${prodName}"?`)) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.message || "Cannot delete product.");
      }
    } catch (err) {
      alert("Error deleting product.");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCat === "ALL" || p.categoryId === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Furniture Product Catalog</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {products.length} Products
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Master SKU inventory database, cost valuations, pricing, and stock monitoring.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-2 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by product name, SKU code, or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-700 shadow-xs focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500">
                    Loading product catalog...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500">
                    No products found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= (p.minimumStock || 5);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-bold text-xs text-slate-900">{p.sku}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.description}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{p.categoryName}</TableCell>
                      <TableCell className="text-xs text-slate-500">{p.brand || "-"}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-600">
                        {formatCurrency(p.purchasePrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                        {formatCurrency(p.sellingPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">
                        {p.currentStock} <span className="text-[10px] font-normal text-slate-500">{p.unit}</span>
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant="destructive" className="text-[10px] space-x-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Low Stock (&lt;{p.minimumStock})</span>
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px] space-x-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>In Stock</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(p)}
                            className="h-7 w-7 p-0"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-slate-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="h-7 w-7 p-0 hover:border-rose-300 hover:bg-rose-50"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Product Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingProduct ? "Edit Product Details" : "Add New Furniture Product"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure product identification, categorization, pricing rates, and stock monitoring.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">SKU / Code *</label>
                <Input
                  required
                  placeholder="e.g. SOF-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Product Name *</label>
                <Input
                  required
                  placeholder="e.g. Chesterfield 3-Seater Sofa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-700 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Brand / Make</label>
                <Input
                  placeholder="e.g. Royal Oak Crafted"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Unit of Measure</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-700 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Pcs">Pcs (Pieces)</option>
                  <option value="Set">Set</option>
                  <option value="Feet">Feet (Cubic/Running)</option>
                  <option value="Meter">Meter</option>
                  <option value="Kg">Kg</option>
                  <option value="Box">Box</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Minimum Stock Alert</label>
                {/* Notice: NumericInput automatically handles zero-replacement! */}
                <NumericInput
                  value={minimumStock}
                  onChangeValue={(val) => setMinimumStock(val)}
                  placeholder="5"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Purchase Rate (Cost)</label>
                <NumericInput
                  prefixSymbol="Rs."
                  value={purchasePrice}
                  onChangeValue={(val) => setPurchasePrice(val)}
                  placeholder="0"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Selling Rate (Retail Price)</label>
                <NumericInput
                  prefixSymbol="Rs."
                  value={sellingPrice}
                  onChangeValue={(val) => setSellingPrice(val)}
                  placeholder="0"
                  className="text-xs font-mono"
                />
              </div>

              {!editingProduct && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Initial Opening Stock (Units)</label>
                  <NumericInput
                    value={currentStock}
                    onChangeValue={(val) => setCurrentStock(val)}
                    placeholder="0"
                    className="text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    Initial stock will automatically generate an opening stock movement entry in the audit trail.
                  </p>
                </div>
              )}

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Description / Specifications</label>
                <textarea
                  rows={2}
                  placeholder="Dimensions, wood polish finish, fabric grade, warranty terms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
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
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              >
                {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}