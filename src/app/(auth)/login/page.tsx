"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials. Please try again.");
      } else {
        try {
          sessionStorage.setItem("erp_just_logged_in", "true");
        } catch {}

        let destination = "/";
        try {
          const params = new URLSearchParams(window.location.search);
          const redirectParam = params.get("redirect");
          if (redirectParam && redirectParam.startsWith("/")) {
            destination = redirectParam;
          }
        } catch {}

        window.location.href = destination;
      }
    } catch (err: any) {
      setError("Unable to connect to the authentication service. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left column: Enterprise Brand Narrative */}
        <div className="lg:col-span-6 space-y-6 text-white">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Store className="h-3.5 w-3.5" />
              <span>Enterprise Furniture Management</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Furniture ERP & Ledger System
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Complete professional management covering POS Billing, Inventory, Vendor Gate In, Vendor Ledgers, Customer Receivables, and Financial Reporting.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="h-8 w-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Live Multi-Shop Invoicing & POS</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Instant retail bills, customer advance tracking, and clear A4/thermal printing.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="h-8 w-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Simplified Customer & Vendor Khata</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Zero accounting clutter — transparent remaining balance and payment entries history.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="h-8 w-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">High Security & Workstation Protection</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated re-authentication on refresh and instant workstation screen lock.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Login Card */}
        <div className="lg:col-span-6">
          <Card className="border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold text-white">System Authentication</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Enter your authorized credentials to access your business console.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Mail className="h-3.5 w-3.5 text-amber-500" />
                    <span>Email or Username / Full Name</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. admin@royaloak.com or Executive Admin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Password</span>
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 h-10"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold h-10 shadow-md"
                >
                  {loading ? (
                    "Authenticating..."
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>Access Business Console</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
                <p className="text-[11px] text-center text-slate-500">
                  Secured with encrypted sessions & multi-tenant isolation.
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>

      </div>
    </div>
  );
}