"use client";

import React, { useState } from "react";
import {
  DatabaseBackup,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [snapshotJson, setSnapshotJson] = useState<any | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleDownloadBackup = async () => {
    setDownloading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/backup/export");
      if (!res.ok) throw new Error("Failed to generate backup");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `furniture_erp_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setStatusMessage({ type: "success", text: "Database snapshot created and downloaded successfully." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to download backup." });
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.version || !json.data) {
          setStatusMessage({ type: "error", text: "Invalid JSON backup structure." });
          setSnapshotJson(null);
        } else {
          setSnapshotJson(json);
        }
      } catch (err) {
        setStatusMessage({ type: "error", text: "Failed to parse JSON file." });
        setSnapshotJson(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!snapshotJson) return;
    setRestoring(true);
    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot: snapshotJson,
          confirmed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({ type: "error", text: data.message || "Restore failed." });
      } else {
        setConfirmModalOpen(false);
        setRestoreFile(null);
        setSnapshotJson(null);
        setStatusMessage({ type: "success", text: "Database restored successfully. Reloading data..." });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Network error during restore execution." });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Database Backup & Recovery</h1>
            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-xs">
              System Redundancy
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Export secure JSON snapshots of all shops, ledgers, inventory, and users or restore from prior backups.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-lg text-xs flex items-center space-x-2.5 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Backup */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Download className="h-5 w-5 text-amber-600" />
              <span>Create & Download Backup</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Generates a full snapshot of the active enterprise database state into an encrypted JSON file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
              <p className="font-semibold text-slate-800">Snapshot Contents Include:</p>
              <ul className="list-disc list-inside text-slate-500 space-y-0.5 pl-1 text-[11px]">
                <li>Shop Profiles & Branding configurations</li>
                <li>User Accounts & Granted permissions</li>
                <li>Product SKUs, Categories, & Current Stock</li>
                <li>Stock Movement Audit History</li>
                <li>Vendors, Gate In records, & Vendor Ledgers</li>
                <li>Customers, Bills, Items, & Customer Ledgers</li>
                <li>Payment Vouchers & Audit Trail</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleDownloadBackup}
              disabled={downloading}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold w-full h-10 shadow-xs"
            >
              {downloading ? "Compiling Database Snapshot..." : "Download Full Backup (.JSON)"}
            </Button>
          </CardFooter>
        </Card>

        {/* Restore Backup */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <RotateCcw className="h-5 w-5 text-rose-600" />
              <span>Restore Database Snapshot</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Recover database records from an official Furniture ERP JSON backup file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1 text-rose-900">
              <p className="font-bold flex items-center space-x-1">
                <ShieldAlert className="h-4 w-4 text-rose-700" />
                <span>Cautionary Notice</span>
              </p>
              <p className="text-[11px] leading-relaxed text-rose-800">
                Restoring a snapshot will synchronize and overwrite conflicting records with the snapshot data.
                Confirmation is strictly required before execution.
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 block">Select Backup JSON File</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
            </div>

            {snapshotJson && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-800 flex items-center space-x-1">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  <span>Verified Backup File:</span>
                </p>
                <p className="text-slate-600 font-mono text-[11px]">System: {snapshotJson.system}</p>
                <p className="text-slate-600 font-mono text-[11px]">Timestamp: {snapshotJson.timestamp}</p>
                <p className="text-slate-600 font-mono text-[11px]">Created By: {snapshotJson.createdBy}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => setConfirmModalOpen(true)}
              disabled={!snapshotJson}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold w-full h-10 shadow-xs disabled:opacity-50"
            >
              Proceed to Verification & Restore
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Confirmation Warning Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-700 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <span>Confirm Database Restore</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-2">
              You are about to restore the database from snapshot timestamped{" "}
              <strong>{snapshotJson?.timestamp}</strong>.
              This will update tables and reconcile ledgers.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 space-y-1">
            <p className="font-bold">Important Safeguards:</p>
            <p className="text-[11px]">Never restore untrusted files. Ensure all current users have finished active entries.</p>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
              disabled={restoring}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExecuteRestore}
              disabled={restoring}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
            >
              {restoring ? "Restoring Database..." : "Yes, Restore Snapshot Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}