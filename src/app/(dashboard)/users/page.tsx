"use client";

import React, { useState, useEffect } from "react";
import {
  UserCog,
  Plus,
  Shield,
  KeyRound,
  Store,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  User,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ALL_PERMISSIONS } from "@/lib/auth/permissions";
import { PermissionKey } from "@/lib/types";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopId, setShopId] = useState("");
  const [role, setRole] = useState("staff");
  const [selectedPerms, setSelectedPerms] = useState<PermissionKey[]>([
    "dashboard",
    "billing",
    "customers",
    "customer_ledger",
    "customer_payments",
    "products",
    "inventory",
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit / Reset Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editPerms, setEditPerms] = useState<PermissionKey[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleOpenDelete = (u: any) => {
    setUserToDelete(u);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/users?id=${userToDelete.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setDeleteError(json.message || "Failed to delete user.");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setDeleteModalOpen(false);
    } catch (err: any) {
      setDeleteError("Network error while deleting user.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const loadData = () => {
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setUsers(res.data);
          setShops(res.shops);
          if (res.shops.length > 0 && !shopId) setShopId(res.shops[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePerm = (key: PermissionKey, isEdit = false) => {
    if (isEdit) {
      if (editPerms.includes(key)) {
        setEditPerms(editPerms.filter((p) => p !== key));
      } else {
        setEditPerms([...editPerms, key]);
      }
    } else {
      if (selectedPerms.includes(key)) {
        setSelectedPerms(selectedPerms.filter((p) => p !== key));
      } else {
        setSelectedPerms([...selectedPerms, key]);
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !shopId) {
      setError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          shopId,
          role,
          permissions: selectedPerms,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to create user.");
      } else {
        setModalOpen(false);
        setName("");
        setEmail("");
        setPassword("");
        loadData();
      }
    } catch (err) {
      setError("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (u: any) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditPerms(u.permissions || []);
    setNewPassword("");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName,
          permissions: editPerms,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        loadData();
      } else {
        alert(data.message || "Failed to update user.");
      }
    } catch (err) {
      alert("Error updating user.");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">User & Access Management</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {users.length} / 4 Profiles
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Admin creates user login credentials manually. Strictly enforce module permissions per user profile.
          </p>
        </div>

        <Button
          onClick={() => {
            setError("");
            setModalOpen(true);
          }}
          disabled={users.length >= 4}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>Create User Profile</span>
        </Button>
      </div>

      {users.length >= 4 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
          <span>
            <strong>Maximum Capacity Reached:</strong> The system allows up to 4 active business users/profiles. You can edit existing permissions or reset passwords below.
          </span>
        </div>
      )}

      {/* Users Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>Login Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Business Profile</TableHead>
                <TableHead>Active Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">Loading users...</TableCell></TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold text-xs text-slate-900">{u.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Store className="h-3.5 w-3.5 text-amber-600" />
                        <span>{u.shopName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.role === "admin" ? (
                        <span className="text-[11px] text-emerald-700 font-bold">Unrestricted (All Permissions)</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {u.permissions.map((p: string) => (
                            <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" className="text-[10px]">{u.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(u)}
                          className="h-7 px-2.5 text-xs text-slate-700 hover:text-amber-700"
                          title="Manage Permissions & Reset Password"
                        >
                          <Shield className="h-3.5 w-3.5 mr-1" />
                          <span>Permissions & Password</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDelete(u)}
                          className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Create New Business User Profile</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Admin creates user credentials manually. The user will log in with this email and password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4">
            {error && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">User Full Name *</label>
                <Input required placeholder="e.g. Bilal Khan" value={name} onChange={(e) => setName(e.target.value)} className="text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Login Email *</label>
                <Input type="email" required placeholder="user@business.com" value={email} onChange={(e) => setEmail(e.target.value)} className="text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Initial Password *</label>
                <Input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Assign to Shop / Profile *</label>
                <select
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Select Granular Module Permissions
                </label>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPerms(ALL_PERMISSIONS.map((p) => p.key))}
                    className="text-[11px] text-amber-600 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPerms([])}
                    className="text-[11px] text-slate-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {ALL_PERMISSIONS.map((p) => {
                  const checked = selectedPerms.includes(p.key);
                  return (
                    <label
                      key={p.key}
                      onClick={() => handleTogglePerm(p.key)}
                      className={`flex items-start space-x-2.5 p-2 rounded-md border cursor-pointer select-none transition-all ${
                        checked ? "bg-amber-50 border-amber-300 text-amber-950" : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div className="text-xs">
                        <span className="font-semibold block">{p.label}</span>
                        <span className="text-[10px] text-slate-400 leading-tight">{p.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold">
                {submitting ? "Creating User..." : "Create User Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions & Reset Password Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit User & Permissions: {editingUser?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">{editingUser?.email}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                  <span>Reset Password (Optional)</span>
                </label>
                <Input
                  type="password"
                  placeholder="Enter new password to change"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Assigned Permissions
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {ALL_PERMISSIONS.map((p) => {
                  const checked = editPerms.includes(p.key);
                  return (
                    <label
                      key={p.key}
                      onClick={() => handleTogglePerm(p.key, true)}
                      className={`flex items-start space-x-2.5 p-2 rounded-md border cursor-pointer select-none transition-all ${
                        checked ? "bg-amber-50 border-amber-300 text-amber-950" : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div className="text-xs">
                        <span className="font-semibold block">{p.label}</span>
                        <span className="text-[10px] text-slate-400 leading-tight">{p.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} disabled={editSubmitting} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold">
                {editSubmitting ? "Saving..." : "Update Permissions"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              <span>Delete Business User</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete user{" "}
              <strong className="text-slate-900 font-bold">{userToDelete?.name}</strong> (
              <span className="font-mono text-slate-600">{userToDelete?.email}</span>)?
              This will permanently revoke their access to the system.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {deleteError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{deleteLoading ? "Deleting..." : "Confirm Delete User"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}