"use client";

import React, { useState, useEffect } from "react";
import {
  FileBarChart2,
  Printer,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  CreditCard,
  Truck,
  Users,
  Building2,
  Package,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("ALL");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = (t: string, r: string) => {
    setLoading(true);
    fetch(`/api/reports?type=${t}&range=${r}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport(reportType, dateRange);
  }, [reportType, dateRange]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    if (reportType === "sales" && data.items) {
      csvContent += "Bill Number,Date,Customer,Grand Total,Paid,Remaining,Status\n";
      data.items.forEach((b: any) => {
        csvContent += `"${b.billNumber}","${b.date}","${b.customerName}","${b.grandTotal}","${b.paidAmount}","${b.remainingBalance}","${b.paymentStatus}"\n`;
      });
    } else if (reportType === "purchases" && data.items) {
      csvContent += "Gate In Number,Date,Vendor,Vendor Invoice,Total Amount\n";
      data.items.forEach((g: any) => {
        csvContent += `"${g.gateInNumber}","${g.date}","${g.vendorName}","${g.vendorInvoiceNumber || ""}","${g.totalAmount}"\n`;
      });
    } else if (reportType === "outstanding" && data.items) {
      csvContent += "Customer Code,Customer Name,Phone,Outstanding Balance\n";
      data.items.forEach((c: any) => {
        csvContent += `"${c.customerCode}","${c.name}","${c.phone || ""}","${c.currentReceivable}"\n`;
      });
    } else if (reportType === "payables" && data.items) {
      csvContent += "Vendor Code,Vendor Name,Company,Payable Balance\n";
      data.items.forEach((v: any) => {
        csvContent += `"${v.vendorCode}","${v.name}","${v.companyName || ""}","${v.currentPayable}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${reportType}_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const curr = data?.currency || "Rs.";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs no-print">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Reports Suite</h1>
            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-xs">
              Audit & Analytics
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export comprehensive sales, purchasing, receivables aging, and stock valuation summaries.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="border-slate-300 text-slate-800 flex items-center space-x-1.5 bg-white text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 shadow-xs text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Tabs & Date Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <Tabs value={reportType} onValueChange={setReportType} className="w-full sm:w-auto">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="sales" className="text-xs">Sales</TabsTrigger>
            <TabsTrigger value="purchases" className="text-xs">Gate In / Purchases</TabsTrigger>
            <TabsTrigger value="outstanding" className="text-xs">Customer Outstanding</TabsTrigger>
            <TabsTrigger value="payables" className="text-xs">Vendor Payables</TabsTrigger>
            <TabsTrigger value="stock" className="text-xs">Stock Valuation</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">Cash Flow</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Date Range:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-slate-700 focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="THIS_YEAR">This Year</option>
          </select>
        </div>
      </div>

      {/* Printable Report Title */}
      <div className="hidden print-only mb-6 border-b-2 border-slate-900 pb-3">
        <h1 className="text-2xl font-black uppercase text-slate-900">
          {reportType.toUpperCase()} REPORT - {dateRange}
        </h1>
        <p className="text-xs text-slate-500">Printed: {new Date().toLocaleString()}</p>
      </div>

      {/* Summary KPI Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {reportType === "sales" && (
            <>
              <Card className="border-slate-200 shadow-xs p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Billed Sales</span>
                <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatCurrency(data.summary.totalSales, curr)}</p>
              </Card>
              <Card className="border-slate-200 shadow-xs p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Paid Advances</span>
                <p className="text-xl font-black text-emerald-700 mt-1 font-mono">{formatCurrency(data.summary.totalPaid, curr)}</p>
              </Card>
              <Card className="border-slate-200 shadow-xs p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Outstanding Receivables</span>
                <p className="text-xl font-black text-rose-700 mt-1 font-mono">{formatCurrency(data.summary.totalOutstanding, curr)}</p>
              </Card>
              <Card className="border-slate-200 shadow-xs p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Invoices</span>
                <p className="text-xl font-black text-slate-800 mt-1 font-mono">{data.summary.count}</p>
              </Card>
            </>
          )}

          {reportType === "purchases" && (
            <>
              <Card className="border-slate-200 shadow-xs p-4 col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Gate In Purchases</span>
                <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{formatCurrency(data.summary.totalPurchases, curr)}</p>
              </Card>
              <Card className="border-slate-200 shadow-xs p-4 col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Shipments Received</span>
                <p className="text-2xl font-black text-amber-700 mt-1 font-mono">{data.summary.count}</p>
              </Card>
            </>
          )}

          {reportType === "outstanding" && (
            <Card className="border-slate-200 shadow-xs p-4 col-span-4 bg-rose-50/20 border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-800">Total Customer Receivables</span>
              <p className="text-2xl font-black text-rose-700 mt-1 font-mono">{formatCurrency(data.summary.totalOutstanding, curr)}</p>
              <p className="text-xs text-rose-600 mt-0.5">{data.summary.count} customers currently have outstanding dues.</p>
            </Card>
          )}

          {reportType === "payables" && (
            <Card className="border-slate-200 shadow-xs p-4 col-span-4 bg-amber-50/20 border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800">Total Vendor Payables</span>
              <p className="text-2xl font-black text-amber-700 mt-1 font-mono">{formatCurrency(data.summary.totalPayable, curr)}</p>
              <p className="text-xs text-amber-600 mt-0.5">{data.summary.count} vendors with pending payment settlements.</p>
            </Card>
          )}

          {reportType === "stock" && (
            <>
              <Card className="border-slate-200 shadow-xs p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Physical Units</span>
                <p className="text-xl font-black text-slate-900 mt-1 font-mono">{data.summary.totalUnits.toLocaleString()}</p>
              </Card>
              <Card className="border-slate-200 shadow-xs p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Valuation (Purchase Cost)</span>
                <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatCurrency(data.summary.totalCostValue, curr)}</p>
              </Card>
              <Card className="border-slate-200 shadow-xs p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Valuation (Selling Retail)</span>
                <p className="text-xl font-black text-amber-700 mt-1 font-mono">{formatCurrency(data.summary.totalRetailValue, curr)}</p>
              </Card>
              <Card className="border-slate-200 shadow-xs p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Catalog SKUs</span>
                <p className="text-xl font-black text-slate-800 mt-1 font-mono">{data.summary.count}</p>
              </Card>
            </>
          )}

          {reportType === "payments" && (
            <>
              <Card className="border-slate-200 shadow-xs p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Received (Inflow)</span>
                <p className="text-xl font-black text-emerald-700 mt-1 font-mono">{formatCurrency(data.summary.totalReceived, curr)}</p>
              </Card>
              <Card className="border-slate-200 shadow-xs p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Paid (Outflow)</span>
                <p className="text-xl font-black text-rose-700 mt-1 font-mono">{formatCurrency(data.summary.totalDisbursed, curr)}</p>
              </Card>
              <Card className="border-slate-200 shadow-xs p-4 col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Net Cash Flow</span>
                <p className={`text-xl font-black font-mono mt-1 ${data.summary.netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {formatCurrency(data.summary.netCashFlow, curr)}
                </p>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Main Report Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            {reportType === "sales" && (
              <>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">Compiling report...</TableCell></TableRow>
                  ) : !data?.items || data.items.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">No records found for this period.</TableCell></TableRow>
                  ) : (
                    data.items.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono font-bold text-xs">{b.billNumber}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(b.date)}</TableCell>
                        <TableCell className="font-semibold text-xs text-slate-800">{b.customerName}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">{formatCurrency(b.grandTotal, curr)}</TableCell>
                        <TableCell className="text-right font-mono text-emerald-700 text-xs">{formatCurrency(b.paidAmount, curr)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-rose-700 text-xs">{formatCurrency(b.remainingBalance, curr)}</TableCell>
                        <TableCell>
                          <Badge variant={b.paymentStatus === "PAID" ? "success" : b.paymentStatus === "PARTIAL" ? "warning" : "destructive"} className="text-[10px]">
                            {b.paymentStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </>
            )}

            {reportType === "purchases" && (
              <>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gate In #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Vendor Invoice #</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">Compiling report...</TableCell></TableRow>
                  ) : !data?.items || data.items.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">No records found.</TableCell></TableRow>
                  ) : (
                    data.items.map((g: any) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-mono font-bold text-xs text-amber-700">{g.gateInNumber}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(g.date)}</TableCell>
                        <TableCell className="font-semibold text-xs text-slate-800">{g.vendorName}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{g.vendorInvoiceNumber || "-"}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">{formatCurrency(g.totalAmount, curr)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </>
            )}

            {reportType === "outstanding" && (
              <>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Code</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Outstanding Receivable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">Compiling report...</TableCell></TableRow>
                  ) : !data?.items || data.items.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">No outstanding customer balances.</TableCell></TableRow>
                  ) : (
                    data.items.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-bold text-xs">{c.customerCode}</TableCell>
                        <TableCell className="font-semibold text-xs text-slate-800">{c.name}</TableCell>
                        <TableCell className="text-xs text-slate-600">{c.phone || "-"}</TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-xs truncate">{c.address || "-"}</TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-rose-700 text-xs">
                          {formatCurrency(c.currentReceivable, curr)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </>
            )}

            {reportType === "payables" && (
              <>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Code</TableHead>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Current Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">Compiling report...</TableCell></TableRow>
                  ) : !data?.items || data.items.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">No outstanding vendor payables.</TableCell></TableRow>
                  ) : (
                    data.items.map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono font-bold text-xs">{v.vendorCode}</TableCell>
                        <TableCell className="font-semibold text-xs text-slate-800">{v.name}</TableCell>
                        <TableCell className="text-xs text-slate-500">{v.companyName || "-"}</TableCell>
                        <TableCell className="text-xs text-slate-600">{v.phone || "-"}</TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-rose-700 text-xs">
                          {formatCurrency(v.currentPayable, curr)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </>
            )}

            {reportType === "stock" && (
              <>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Stock Level</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Total Cost Value</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-right">Total Retail Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">Compiling report...</TableCell></TableRow>
                  ) : !data?.items || data.items.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">No inventory found.</TableCell></TableRow>
                  ) : (
                    data.items.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono font-bold text-xs">{p.sku}</TableCell>
                        <TableCell className="font-semibold text-xs text-slate-800">{p.name}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">
                          {p.currentStock} {p.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(p.purchasePrice, curr)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">{formatCurrency(p.currentStock * p.purchasePrice, curr)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(p.sellingPrice, curr)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-amber-700 text-xs">{formatCurrency(p.currentStock * p.sellingPrice, curr)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </>
            )}

            {reportType === "payments" && (
              <>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flow Type</TableHead>
                    <TableHead>Reference #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-xs text-slate-500">Compiling flow...</TableCell></TableRow>
                  ) : (
                    <>
                      {data?.receipts?.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell><Badge variant="success" className="text-[10px]">Receipt Inflow (+)</Badge></TableCell>
                          <TableCell className="font-mono font-bold text-xs">{r.paymentNumber}</TableCell>
                          <TableCell className="text-xs text-slate-600">{formatDate(r.date)}</TableCell>
                          <TableCell className="font-semibold text-xs text-slate-800">{r.partyName}</TableCell>
                          <TableCell className="text-xs text-slate-500">{r.paymentMethod}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-700 text-xs">{formatCurrency(r.amount, curr)}</TableCell>
                        </TableRow>
                      ))}
                      {data?.disbursements?.map((d: any) => (
                        <TableRow key={d.id}>
                          <TableCell><Badge variant="destructive" className="text-[10px]">Payment Outflow (-)</Badge></TableCell>
                          <TableCell className="font-mono font-bold text-xs">{d.paymentNumber}</TableCell>
                          <TableCell className="text-xs text-slate-600">{formatDate(d.date)}</TableCell>
                          <TableCell className="font-semibold text-xs text-slate-800">{d.partyName}</TableCell>
                          <TableCell className="text-xs text-slate-500">{d.paymentMethod}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-rose-700 text-xs">{formatCurrency(d.amount, curr)}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}