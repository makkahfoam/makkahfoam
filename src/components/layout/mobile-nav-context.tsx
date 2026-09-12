"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface MobileNavContextType {
  isOpen: boolean;
  openNav: () => void;
  closeNav: () => void;
  toggleNav: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  isOpen: false,
  openNav: () => {},
  closeNav: () => {},
  toggleNav: () => {},
});

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Automatically close mobile nav on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const openNav = () => setIsOpen(true);
  const closeNav = () => setIsOpen(false);
  const toggleNav = () => setIsOpen((prev) => !prev);

  return (
    <MobileNavContext.Provider value={{ isOpen, openNav, closeNav, toggleNav }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  return useContext(MobileNavContext);
}
