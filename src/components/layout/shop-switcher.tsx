"use client";

import React, { useState, useEffect } from "react";
import { Store, Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Shop {
  id: string;
  name: string;
  currency: string;
}

interface ShopSwitcherProps {
  currentShopId: string;
  isAdmin: boolean;
}

export function ShopSwitcher({ currentShopId, isAdmin }: ShopSwitcherProps) {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/shops")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setShops(data.data);
        }
      })
      .catch((err) => console.error("Failed to load shops:", err));
  }, []);

  const handleSwitch = async (shopId: string) => {
    if (shopId === currentShopId || !isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch("/api/shops/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Error switching shop:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentShop = shops.find((s) => s.id === currentShopId) || {
    id: currentShopId,
    name: "Active Business Profile",
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
        <Store className="h-3.5 w-3.5 text-amber-600" />
        <span className="truncate max-w-[180px]">{currentShop.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className="h-9 px-3 bg-white border-slate-200 text-slate-800 hover:bg-slate-50 flex items-center space-x-2 shadow-xs"
        >
          <Store className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="font-semibold text-xs truncate max-w-[200px]">
            {currentShop.name}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-slate-500">
          Switch Business Profile (Max 4)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {shops.map((shop) => (
          <DropdownMenuItem
            key={shop.id}
            onClick={() => handleSwitch(shop.id)}
            className="flex items-center justify-between text-xs py-2 cursor-pointer"
          >
            <div className="flex items-center space-x-2 truncate">
              <Store className="h-3.5 w-3.5 text-slate-500" />
              <span className={shop.id === currentShopId ? "font-bold text-amber-700" : "text-slate-700"}>
                {shop.name}
              </span>
            </div>
            {shop.id === currentShopId && (
              <Check className="h-4 w-4 text-amber-600 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}