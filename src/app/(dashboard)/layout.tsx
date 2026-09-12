import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LockScreenProvider } from "@/components/layout/lock-screen-provider";
import { MobileNavProvider } from "@/components/layout/mobile-nav-context";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { AuthRefreshGuard } from "@/components/layout/auth-refresh-guard";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <LockScreenProvider user={session}>
      <AuthRefreshGuard />
      <MobileNavProvider>
        <div className="flex h-screen overflow-hidden bg-slate-100">
          {/* Desktop Sidebar navigation */}
          <Sidebar user={session} activeShopName={session.shopName} />

          {/* Mobile slide-over drawer navigation */}
          <MobileNavDrawer user={session} activeShopName={session.shopName} />

          {/* Main content wrapper */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header user={session} />
            <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-slate-50/70 pb-20 md:pb-8">
              <div className="max-w-7xl mx-auto space-y-6">
                {children}
              </div>
            </main>
          </div>

          {/* Fixed mobile bottom bar */}
          <MobileBottomNav />
        </div>
      </MobileNavProvider>
    </LockScreenProvider>
  );
}