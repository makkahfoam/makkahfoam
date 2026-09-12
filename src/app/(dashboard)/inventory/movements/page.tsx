"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftRight, Search, ArrowLeft, Filter, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/inventory/movements")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setMovements(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = movements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.reference.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || m.movementType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/inventory" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Movement Audit Trail</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {movements.length} Logs
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable transaction-by-transaction log of every inventory delta from Gate In, Sales, Edits, and Reconciliations.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by product, SKU, or reference (e.g. GI-0001, INV-0001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-slate-50/50"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-700 shadow-xs focus:ring-2 focus:ring-amber-500"
        >
          <option value="ALL">All Movement Types</option>
          <option value="GATE_IN">Vendor Gate In (+)</option>
          <option value="SALE">Customer Sale (-)</option>
          <option value="ADJUSTMENT_ADD">Stock Adjustment (+)</option>
          <option value="ADJUSTMENT_SUB">Stock Adjustment (-)</option>
          <option value="BILL_EDIT">Bill Edit Adjustment</option>
          <option value="BILL_DELETE">Bill Void / Reversal (+)</option>
          <option value="INITIAL">Initial Stock (+)</option>
        </select>
      </div>

      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date / Timestamp</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Movement Type</TableHead>
                <TableHead>Reference #</TableHead>
                <TableHead className="text-right">Prev Stock</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">New Stock</TableHead>
                <TableHead>Notes / Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500">
                    Loading movement records...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500">
                    No stock movements recorded.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => {
                  const isPositive =
                    m.movementType === "GATE_IN" ||
                    m.movementType === "ADJUSTMENT_ADD" ||
                    m.movementType === "BILL_DELETE" ||
                    m.movementType === "INITIAL" ||
                    m.newStock > m.previousStock;

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs text-slate-600 font-mono whitespace-nowrap">
                        {formatDateTime(m.createdAt)}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-slate-800">{m.productName}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{m.sku}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.movementType === "GATE_IN"
                              ? "info"
                              : m.movementType === "SALE"
                              ? "success"
                              : m.movementType === "BILL_DELETE"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {m.movementType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs text-slate-900">{m.reference}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-500">
                        {m.previousStock} {m.unit}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-xs font-bold ${isPositive ? "text-emerald-700" : "text-rose-700"}`}>
                        {isPositive ? `+${m.quantity}` : `-${m.quantity}`} {m.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                        {m.newStock} {m.unit}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">{m.notes || "-"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}