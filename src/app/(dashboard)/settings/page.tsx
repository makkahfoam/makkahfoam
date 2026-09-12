"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  FileText,
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  Receipt,
  Hash,
  RotateCcw,
  Sparkles,
  Lock,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumericInput } from "@/components/ui/numeric-input";
import { useLockScreen } from "@/components/layout/lock-screen-provider";

interface ShopSettings {
  id: string;
  name: string;
  logo: string | null;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  currency: string;
  billPrefix: string;
  billCounter: number;
  gateInPrefix: string;
  gateInCounter: number;
  vendorPaymentPrefix: string;
  vendorPaymentCounter: number;
  customerPaymentPrefix: string;
  customerPaymentCounter: number;
  warrantyText: string;
  footerText: string;
  businessDescription: string;
  defaultPaymentMethod: string;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const { lockScreen, pin, updatePin } = useLockScreen();
  const [customLockPin, setCustomLockPin] = useState(pin);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setCustomLockPin(pin);
  }, [pin]);

  const [settings, setSettings] = useState<ShopSettings>({
    id: "",
    name: "",
    logo: "",
    address: "",
    phone1: "",
    phone2: "",
    email: "",
    currency: "Rs.",
    billPrefix: "INV-",
    billCounter: 1,
    gateInPrefix: "GI-",
    gateInCounter: 1,
    vendorPaymentPrefix: "VP-",
    vendorPaymentCounter: 1,
    customerPaymentPrefix: "CP-",
    customerPaymentCounter: 1,
    warrantyText: "1 Year Structure Warranty",
    footerText: "Thank you for your business! Items once sold can only be exchanged within 7 days.",
    businessDescription: "Premium Furniture & Luxury Living Solutions",
    defaultPaymentMethod: "Cash",
    lowStockThreshold: 5,
    createdAt: "",
    updatedAt: "",
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setSettings({
          ...json.data,
          logo: json.data.logo || "",
          address: json.data.address || "",
          phone1: json.data.phone1 || "",
          phone2: json.data.phone2 || "",
          email: json.data.email || "",
          businessDescription: json.data.businessDescription || "",
          warrantyText: json.data.warrantyText || "",
          footerText: json.data.footerText || "",
        });
      } else {
        setErrorMsg(json.message || "Failed to load shop settings");
      }
    } catch (err: any) {
      setErrorMsg("Network error loading shop settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Shop profile & print settings saved successfully!");
        if (json.data) {
          setSettings((prev) => ({ ...prev, ...json.data }));
        }
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(json.message || "Failed to update settings");
      }
    } catch (err: any) {
      setErrorMsg("Error communicating with server");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading Shop Profile Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Shop Profile & Document Settings
            </h1>
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-mono text-xs">
              {settings.id}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure business identity, contact details, document prefixes, invoice policies, and operational defaults.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={saving}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2 font-medium shadow-sm"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main Content Grid: Settings Form (8 cols) + Realtime Invoice Preview (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="grid grid-cols-5 w-full bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="identity" className="text-xs font-semibold">Store Profile</TabsTrigger>
              <TabsTrigger value="contact" className="text-xs font-semibold">Contact & Address</TabsTrigger>
              <TabsTrigger value="numbering" className="text-xs font-semibold">Doc Numbering</TabsTrigger>
              <TabsTrigger value="terms" className="text-xs font-semibold">Print Policies</TabsTrigger>
              <TabsTrigger value="security" className="text-xs font-semibold flex items-center gap-1 text-amber-900">
                <Lock className="h-3 w-3 text-amber-600" />
                <span>Lock Screen</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: STORE PROFILE */}
            <TabsContent value="identity" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-base">Business Identity</CardTitle>
                  </div>
                  <CardDescription>
                    The business name and branding that appears across customer bills and reports.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Shop / Business Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      placeholder="e.g. Royal Oak Luxury Living"
                      className="font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Business Tagline / Subtitle
                    </label>
                    <Input
                      value={settings.businessDescription}
                      onChange={(e) => setSettings({ ...settings, businessDescription: e.target.value })}
                      placeholder="e.g. Premium Handcrafted Teak & Sheesham Furniture"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Currency Symbol / Label
                      </label>
                      <Input
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        placeholder="e.g. Rs. or $"
                        className="font-mono"
                      />
                      <p className="text-[11px] text-slate-400">Printed on all invoices and financial ledgers</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Default Payment Method
                      </label>
                      <select
                        value={settings.defaultPaymentMethod}
                        onChange={(e) => setSettings({ ...settings, defaultPaymentMethod: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer / NEFT</option>
                        <option value="Credit Card">Credit / Debit Card</option>
                        <option value="Cheque">Cheque</option>
                        <option value="UPI">UPI / Digital</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Logo Image URL (Optional)
                    </label>
                    <Input
                      value={settings.logo || ""}
                      onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                      placeholder="https://example.com/logo.png (or leave blank for text emblem)"
                    />
                    <p className="text-[11px] text-slate-400">
                      Leave empty to use the standard high-contrast furniture crest emblem on print layouts.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: CONTACT & ADDRESS */}
            <TabsContent value="contact" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-base">Contact & Physical Location</CardTitle>
                  </div>
                  <CardDescription>
                    These details are prominently displayed in invoice headers and vendor POs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Showroom / Warehouse Address
                    </label>
                    <textarea
                      rows={3}
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      placeholder="Plot 42, Industrial Furniture Boulevard, Design District, New Delhi - 110020"
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" /> Primary Phone
                      </label>
                      <Input
                        value={settings.phone1}
                        onChange={(e) => setSettings({ ...settings, phone1: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" /> Secondary Phone / Landline
                      </label>
                      <Input
                        value={settings.phone2}
                        onChange={(e) => setSettings({ ...settings, phone2: e.target.value })}
                        placeholder="+91 11 2345 6789"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" /> Official Business Email
                    </label>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      placeholder="sales@royaloakfurniture.com"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: DOCUMENT NUMBERING & PREFIXES */}
            <TabsContent value="numbering" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-base">Document Prefixes & Sequences</CardTitle>
                  </div>
                  <CardDescription>
                    Customize automatic numbering prefixes for Sales Bills, Gate In receipts, and payments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">Sales Bill Prefix</label>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          Next: {settings.billPrefix}{String(settings.billCounter).padStart(5, "0")}
                        </Badge>
                      </div>
                      <Input
                        value={settings.billPrefix}
                        onChange={(e) => setSettings({ ...settings, billPrefix: e.target.value })}
                        placeholder="INV-"
                        className="font-mono text-sm uppercase"
                      />
                      <p className="text-[11px] text-slate-400">Appears on customer sales invoices</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">Gate In Receipt Prefix</label>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          Next: {settings.gateInPrefix}{String(settings.gateInCounter).padStart(5, "0")}
                        </Badge>
                      </div>
                      <Input
                        value={settings.gateInPrefix}
                        onChange={(e) => setSettings({ ...settings, gateInPrefix: e.target.value })}
                        placeholder="GI-"
                        className="font-mono text-sm uppercase"
                      />
                      <p className="text-[11px] text-slate-400">Appears on vendor stock receiving slips</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">Customer Receipt Prefix</label>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          Next: {settings.customerPaymentPrefix}{String(settings.customerPaymentCounter).padStart(5, "0")}
                        </Badge>
                      </div>
                      <Input
                        value={settings.customerPaymentPrefix}
                        onChange={(e) => setSettings({ ...settings, customerPaymentPrefix: e.target.value })}
                        placeholder="CP-"
                        className="font-mono text-sm uppercase"
                      />
                      <p className="text-[11px] text-slate-400">Receipt voucher for customer payments</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">Vendor Payment Voucher Prefix</label>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          Next: {settings.vendorPaymentPrefix}{String(settings.vendorPaymentCounter).padStart(5, "0")}
                        </Badge>
                      </div>
                      <Input
                        value={settings.vendorPaymentPrefix}
                        onChange={(e) => setSettings({ ...settings, vendorPaymentPrefix: e.target.value })}
                        placeholder="VP-"
                        className="font-mono text-sm uppercase"
                      />
                      <p className="text-[11px] text-slate-400">Payment slip issued to vendor</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: PRINT POLICIES & TERMS */}
            <TabsContent value="terms" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-base">Print Policies, Terms & Stock Defaults</CardTitle>
                  </div>
                  <CardDescription>
                    Define standard warranty disclosures, return policy notices, and stock threshold alerts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Standard Structure Warranty Text
                    </label>
                    <Input
                      value={settings.warrantyText}
                      onChange={(e) => setSettings({ ...settings, warrantyText: e.target.value })}
                      placeholder="e.g. 1 Year Structure Warranty & Termite Resistance Guarantee"
                    />
                    <p className="text-[11px] text-slate-400">Printed in the policy highlight box on customer bills</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Invoice Footer & Return Policy Notice
                    </label>
                    <textarea
                      rows={3}
                      value={settings.footerText}
                      onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                      placeholder="Thank you for shopping with us. Goods once sold can only be replaced within 7 days against manufacturing defects."
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-200/60 space-y-2">
                    <label className="text-xs font-bold text-amber-900 block">
                      Low Stock Warning Alert Threshold (Units)
                    </label>
                    <div className="w-48">
                      <NumericInput
                        value={settings.lowStockThreshold}
                        onChangeValue={(val) => setSettings({ ...settings, lowStockThreshold: Math.max(0, Math.floor(val)) })}
                        allowDecimals={false}
                        suffixSymbol="pcs"
                        placeholder="5"
                      />
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Products with inventory at or below this count will show an alert flag on the dashboard and catalog.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: WORKSTATION & TERMINAL LOCK */}
            <TabsContent value="security" className="mt-4 space-y-4">
              <Card className="border-amber-200 shadow-xs">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-base">Workstation & Admin Panel Lock</CardTitle>
                  </div>
                  <CardDescription>
                    Secure your billing counter, inventory, and admin panel with an instant lock screen when stepping away.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-amber-950">Lock Software / Admin Panel Now</h4>
                      <p className="text-xs text-amber-800">
                        Immediately locks the entire system. Hotkey: <kbd className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono text-[11px] font-bold">Ctrl+L</kbd>
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={lockScreen}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-2 shadow-sm shrink-0"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Lock Screen Immediately</span>
                    </Button>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="text-xs font-bold text-slate-800 block">
                      Quick Unlock 4-Digit PIN
                    </label>
                    <p className="text-xs text-slate-500">
                      Enter a 4-digit numeric code used to quickly unlock the screen without re-entering long passwords.
                    </p>
                    <div className="flex items-center gap-3 max-w-xs">
                      <Input
                        type="text"
                        maxLength={6}
                        value={customLockPin}
                        onChange={(e) => setCustomLockPin(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="1234"
                        className="font-mono text-center text-base tracking-widest h-10 font-bold"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updatePin(customLockPin);
                          setSuccessMsg("Quick Unlock PIN updated successfully!");
                          setTimeout(() => setSuccessMsg(null), 3000);
                        }}
                        className="h-10 text-xs font-semibold"
                      >
                        Save PIN
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Current active PIN: <code className="font-mono font-bold text-slate-700">{pin}</code>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Security Invariants:</p>
                    <p>• If you refresh the browser (F5) while locked, the screen remains securely locked.</p>
                    <p>• In case the PIN is forgotten, you can always unlock using your master admin password.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Real-time Invoice Print Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-amber-600" />
              Live Bill Layout Preview
            </h3>
            <span className="text-[11px] text-slate-500">Updates as you edit</span>
          </div>

          <div className="border border-slate-300 rounded-xl bg-white shadow-sm p-6 text-slate-800 space-y-5">
            {/* Header Preview */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="h-10 object-contain mb-1" />
                ) : (
                  <div className="inline-flex items-center gap-2 mb-1">
                    <div className="h-7 w-7 rounded bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                      {settings.name.charAt(0) || "F"}
                    </div>
                    <span className="text-base font-black tracking-tight text-slate-900">
                      {settings.name || "Business Name"}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 italic max-w-[220px]">
                  {settings.businessDescription || "Furniture & Interior Solutions"}
                </p>
                <div className="text-[10px] text-slate-600 mt-2 space-y-0.5">
                  <p className="max-w-[220px]">{settings.address || "Address Line, City"}</p>
                  <p>Ph: {settings.phone1 || "+91 00000 00000"}{settings.phone2 ? ` / ${settings.phone2}` : ""}</p>
                  {settings.email && <p>Email: {settings.email}</p>}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                  Tax Invoice
                </span>
                <p className="font-mono text-xs font-bold text-slate-900 mt-2">
                  {settings.billPrefix}00104
                </p>
                <p className="text-[10px] text-slate-400">Date: 2026-09-11</p>
              </div>
            </div>

            {/* Simulated Line Items Preview */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-slate-600 border-b border-slate-100 pb-1">
                <span>Sample Item</span>
                <span>Qty</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-700">
                <span>Royal Teak King Size Bed</span>
                <span>1</span>
                <span className="font-mono font-medium">{settings.currency} 45,000</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-700">
                <span>Solid Oak Bedside Table</span>
                <span>2</span>
                <span className="font-mono font-medium">{settings.currency} 16,000</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-xs">
                <span>Total Payable</span>
                <span className="font-mono text-amber-700">{settings.currency} 61,000</span>
              </div>
            </div>

            {/* Warranty & Terms Preview */}
            <div className="bg-amber-50/70 border border-amber-200 rounded p-2 text-[10px] text-amber-900 space-y-0.5">
              <p className="font-bold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-amber-600" />
                Warranty Policy:
              </p>
              <p>{settings.warrantyText || "Standard Warranty Policy"}</p>
            </div>

            {/* Footer Policy Preview */}
            <div className="border-t border-slate-200 pt-3 text-center space-y-1">
              <p className="text-[10px] text-slate-500 italic">
                {settings.footerText || "Thank you for your business!"}
              </p>
              <p className="text-[9px] text-slate-400">
                System Generated Electronic Invoice • Authorized Signatory
              </p>
            </div>
          </div>

          {/* System Profile Details */}
          <Card className="bg-slate-50/70 border-slate-200">
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Active Profile ID:</span>
                <span className="font-mono font-bold text-slate-900">{settings.id}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Default Currency:</span>
                <span className="font-mono font-bold text-slate-900">{settings.currency}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Low Stock Threshold:</span>
                <span className="font-mono font-bold text-amber-700">{settings.lowStockThreshold} units</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Last Configured:</span>
                <span className="text-slate-500">
                  {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : "Initial Seed"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
