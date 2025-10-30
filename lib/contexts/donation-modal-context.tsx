'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type DonationModalContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const DonationModalContext = createContext<DonationModalContextValue | undefined>(undefined);

export function DonationModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);
  return <DonationModalContext.Provider value={value}>{children}</DonationModalContext.Provider>;
}

export function useDonationModal() {
  const ctx = useContext(DonationModalContext);
  if (!ctx) throw new Error('useDonationModal must be used within DonationModalProvider');
  return ctx;
}


