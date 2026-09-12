"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ReceiptText,
  Plus,
  Search,
  Eye,
} from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/utils";

export default function BillsListPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadBills = () => {
    setLoading(true);
    fetch("/api/bills")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setBills(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBills();
  }, []);

  const totalSales = bills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  const totalPaid = bills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
  const totalReceivable = bills.reduce((acc, b) => acc + (b.remainingBalance || 0), 0);

  const filtered = bills.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      b.billNumber.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      (b.customerPhone && b.customerPhone.includes(q));
    const matchesStatus = statusFilter === "ALL" || b.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales Bills & Invoices</h1>
            <Badge variant="secondary" className="font-mono text-xs">{bills.length} Invoices</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse and manage furniture sales bills, print A4 invoices, and track payment settlements.
          </p>
        </div>

        <Link href="/billing/new">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Create New Bill (POS)</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Billed Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(totalSales)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">{bills.length} invoices generated</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Total Settled Collections</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-emerald-700">{formatCurrency(totalPaid)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Advances & completed payments</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-amber-50/20 border-amber-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-800">Unsettled Balance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-amber-700">{formatCurrency(totalReceivable)}</div>
            <p className="text-[11px] text-amber-700 mt-0.5">Remaining customer receivables</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by bill #, customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-700 shadow-xs focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Fully Paid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500">Loading bills...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500">No bills found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono font-bold text-xs text-slate-900">{b.billNumber}</TableCell>
                    <TableCell className="text-xs text-slate-600">{formatDate(b.date)}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-xs text-slate-800 block">{b.customerName}</span>
                      {b.customerPhone && <span className="text-[10px] text-slate-400">{b.customerPhone}</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-slate-900">
                      {formatCurrency(b.grandTotal)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-700">
                      {formatCurrency(b.paidAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-rose-700">
                      {formatCurrency(b.remainingBalance)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          b.paymentStatus === "PAID"
                            ? "success"
                            : b.paymentStatus === "PARTIAL"
                            ? "warning"
                            : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {b.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{b.createdBy || "Staff"}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/billing/${b.id}`}>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs text-slate-700 hover:text-amber-700 hover:border-amber-300">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span>View & Print</span>
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
    </div>
  );
}