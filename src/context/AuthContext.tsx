'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { ShopifyCustomer } from '@/lib/shopify';

// ============================================
// Types
// ============================================

interface AuthContextType {
  customer: ShopifyCustomer | null;
  isLoading: boolean;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================
// Provider
// ============================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<ShopifyCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });

      if (!response.ok) {
        setCustomer(null);
        setIsLoading(false);
        return;
      }

      const payload = await response.json();
      setCustomer(payload.data ?? null);
    } catch {
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return (
    <AuthContext.Provider value={{ customer, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
