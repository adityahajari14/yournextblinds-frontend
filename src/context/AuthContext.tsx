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

const SILENT_AUTH_ATTEMPT_KEY = 'shopify-silent-auth-attempted';

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
// Provider — only fetches customer for email pre-fill at checkout.
// Account management is handled entirely by Shopify's hosted account pages.
// ============================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<ShopifyCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSilentAuthErrorFromUrl = useCallback(() => {
    const currentUrl = new URL(window.location.href);
    if (!currentUrl.searchParams.has('auth_error')) return;

    currentUrl.searchParams.delete('auth_error');
    const nextUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }, []);

  const trySilentLogin = useCallback(() => {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get('auth_error') === 'login_required') {
      sessionStorage.setItem(SILENT_AUTH_ATTEMPT_KEY, '1');
      clearSilentAuthErrorFromUrl();
      setIsLoading(false);
      return;
    }

    if (sessionStorage.getItem(SILENT_AUTH_ATTEMPT_KEY) === '1') {
      setIsLoading(false);
      return;
    }

    sessionStorage.setItem(SILENT_AUTH_ATTEMPT_KEY, '1');
    const returnTo = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
    window.location.replace(
      `/api/auth/shopify/login?prompt=none&return_to=${encodeURIComponent(returnTo)}`
    );
  }, [clearSilentAuthErrorFromUrl]);

  const fetchCustomer = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });

      if (!response.ok) {
        setCustomer(null);
        if (typeof window !== 'undefined') {
          trySilentLogin();
        } else {
          setIsLoading(false);
        }
        return;
      }

      const payload = await response.json();
      setCustomer(payload.data ?? null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SILENT_AUTH_ATTEMPT_KEY);
        clearSilentAuthErrorFromUrl();
      }
    } catch {
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, [clearSilentAuthErrorFromUrl, trySilentLogin]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return (
    <AuthContext.Provider value={{ customer, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
