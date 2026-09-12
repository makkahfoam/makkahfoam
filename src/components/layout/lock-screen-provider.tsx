"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Lock, Unlock, ShieldAlert, KeyRound, LogOut, Store, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SessionUser } from "@/lib/types";

interface LockScreenContextType {
  isLocked: boolean;
  lockScreen: () => void;
  unlockScreen: (code: string) => boolean;
  pin: string;
  updatePin: (newPin: string) => void;
}

const LockScreenContext = createContext<LockScreenContextType | null>(null);

export function useLockScreen() {
  const context = useContext(LockScreenContext);
  if (!context) {
    throw new Error("useLockScreen must be used within a LockScreenProvider");
  }
  return context;
}

export function LockScreenProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser;
}) {
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState("1234");
  const [enteredCode, setEnteredCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedLocked = localStorage.getItem("furniture_erp_locked");
      if (savedLocked === "true") {
        setIsLocked(true);
      }
      const savedPin = localStorage.getItem("furniture_erp_lock_pin");
      if (savedPin) {
        setPin(savedPin);
      }
    } catch {}
  }, []);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setCurrentDate(
        now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global hotkey Ctrl+L to lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        lockScreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const lockScreen = () => {
    setIsLocked(true);
    setEnteredCode("");
    setErrorMsg("");
    try {
      localStorage.setItem("furniture_erp_locked", "true");
    } catch {}
  };

  const updatePin = (newPin: string) => {
    const cleaned = newPin.trim();
    if (cleaned.length >= 4) {
      setPin(cleaned);
      try {
        localStorage.setItem("furniture_erp_lock_pin", cleaned);
      } catch {}
    }
  };

  const unlockScreen = (code: string): boolean => {
    const trimmed = code.trim();
    // Accepts custom PIN, default PIN "1234", or system passwords
    if (trimmed === pin || trimmed === "1234" || trimmed === "Admin@123" || trimmed === "Staff@123") {
      setIsLocked(false);
      setEnteredCode("");
      setErrorMsg("");
      try {
        localStorage.setItem("furniture_erp_locked", "false");
      } catch {}
      return true;
    } else {
      setErrorMsg("Incorrect PIN or Password. Please try again.");
      return false;
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    unlockScreen(enteredCode);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    try {
      localStorage.setItem("furniture_erp_locked", "false");
    } catch {}
    window.location.href = "/login";
  };

  const handleKeypadPress = (num: string) => {
    if (enteredCode.length < 12) {
      setEnteredCode((prev) => prev + num);
      setErrorMsg("");
    }
  };

  const handleKeypadBackspace = () => {
    setEnteredCode((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  return (
    <LockScreenContext.Provider value={{ isLocked, lockScreen, unlockScreen, pin, updatePin }}>
      {children}

      {/* FULL SCREEN SECURE LOCK OVERLAY */}
      {isLocked && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none text-slate-100 animate-in fade-in duration-200">
          <div className="w-full max-w-md space-y-6 text-center">
            {/* Business Emblem & Status */}
            <div className="flex flex-col items-center space-y-2">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-600/20 ring-4 ring-amber-500/20 animate-pulse">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-2">
                {user.shopName || "Furniture Enterprise"}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-semibold">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Workstation Locked & Secured</span>
              </div>
            </div>

            {/* Live Clock & Date */}
            <div className="space-y-0.5">
              <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
                {currentTime || "00:00:00"}
              </div>
              <p className="text-xs text-slate-400 font-medium">{currentDate}</p>
            </div>

            {/* Active User Info */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="text-left">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Active User Console</p>
                <p className="font-bold text-white text-sm">{user.name}</p>
                <p className="text-slate-400 text-[11px] font-mono">{user.email}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 text-xs text-slate-400 hover:text-rose-400 gap-1"
                title="Log out and return to sign in"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Switch User</span>
              </Button>
            </div>

            {/* Unlock Input Form */}
            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              {errorMsg && (
                <div className="p-2.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="relative">
                <KeyRound className="h-4 w-4 absolute left-3.5 top-3 text-slate-500" />
                <Input
                  autoFocus
                  type="password"
                  placeholder="Enter 4-digit PIN or Password..."
                  value={enteredCode}
                  onChange={(e) => {
                    setEnteredCode(e.target.value);
                    setErrorMsg("");
                  }}
                  className="h-12 bg-slate-900 border-slate-700 text-center font-mono text-lg tracking-widest pl-10 pr-10 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                />
                {enteredCode && (
                  <button
                    type="button"
                    onClick={() => setEnteredCode("")}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1 max-w-[280px] mx-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => {
                      if (btn === "C") setEnteredCode("");
                      else if (btn === "⌫") handleKeypadBackspace();
                      else handleKeypadPress(btn);
                    }}
                    className="h-10 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-mono font-bold text-sm active:scale-95 transition-all"
                  >
                    {btn}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 shadow-lg shadow-amber-600/20 gap-2 mt-2"
              >
                <Unlock className="h-4 w-4" />
                <span>Unlock Terminal</span>
              </Button>
            </form>

            <p className="text-[11px] text-slate-500">
              Default Quick PIN: <code className="text-amber-400 font-mono font-bold">1234</code> (Configurable in Shop Settings)
            </p>
          </div>
        </div>
      )}
    </LockScreenContext.Provider>
  );
}
