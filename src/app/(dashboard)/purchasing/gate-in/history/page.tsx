"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Truck, Search, ArrowLeft, Plus, Calendar, FileText } from "lucide-react";
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

export default function GateInHistoryPage() {
  const [gateIns, setGateIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/gate-in")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setGateIns(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = gateIns.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.gateInNumber.toLowerCase().includes(q) ||
      g.vendorName.toLowerCase().includes(q) ||
      (g.vendorInvoiceNumber && g.vendorInvoiceNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/purchasing/gate-in" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gate In Receiving History</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {gateIns.length} Records
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete archive of all vendor goods receipts and stock increments.
          </p>
        </div>

        <Link href="/purchasing/gate-in">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>New Gate In</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search Gate In #, vendor name, or invoice number..."
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
                <TableHead>Gate In Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Vendor Invoice #</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-slate-500">
                    Loading Gate In history...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-slate-500">
                    No Gate In records found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono font-bold text-amber-700 text-xs">
                      {g.gateInNumber}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{formatDate(g.date)}</TableCell>
                    <TableCell className="font-semibold text-xs text-slate-800">
                      {g.vendorName}
                      {g.vendorCompany && (
                        <span className="block text-[10px] text-slate-400 font-normal">{g.vendorCompany}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {g.vendorInvoiceNumber || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-slate-900">
                      {formatCurrency(g.totalAmount)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{g.createdBy || "Staff"}</TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">{g.notes || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/vendors/${g.vendorId}`}>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                          Vendor Ledger
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