"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __ERP_ACTIVE_SESSION__?: boolean;
  }
}

export function AuthRefreshGuard() {
  useEffect(() => {
    // If the session is already active in memory during this client session
    if (window.__ERP_ACTIVE_SESSION__) {
      return;
    }

    // Check if the user just authenticated from /login
    const justLoggedIn = sessionStorage.getItem("erp_just_logged_in");
    if (justLoggedIn === "true") {
      sessionStorage.removeItem("erp_just_logged_in");
      window.__ERP_ACTIVE_SESSION__ = true;
      return;
    }

    // Page was refreshed (F5/reload) or reopened in a fresh tab.
    // Enforce re-authentication on refresh as requested.
    const handleRefreshReauth = async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {}

      const currentPath = window.location.pathname;
      const redirectParam = currentPath && currentPath !== "/" ? `?redirect=${encodeURIComponent(currentPath)}` : "";
      window.location.href = `/login${redirectParam}`;
    };

    handleRefreshReauth();
  }, []);

  return null;
}
