'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductConfiguration, Cart, CartItem, CartContextType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { trackShopifyAddToCart } from '@/lib/shopify-analytics';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

const CART_STORAGE_KEY = 'cart';

interface CartApiResponse {
  success: boolean;
  data?: { items: SerializableCartItem[] };
  error?: { message: string };
}

interface SerializableCartItem extends Omit<CartItem, 'addedAt'> {
  addedAt: string;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const router = useRouter();
  const { customer, isLoading } = useAuth();
  const hasInitializedRef = useRef(false);
  const lastSyncedCustomerRef = useRef<string | null>(null);
  const [cart, setCart] = useState<Cart>({
    items: [],
    total: 0,
    itemCount: 0,
  });

  const calculateTotals = (items: CartItem[]) => ({
    total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  });

  const toSerializableItems = (items: CartItem[]): SerializableCartItem[] =>
    items.map((item) => ({
      ...item,
      addedAt: item.addedAt.toISOString(),
    }));

  const fromSerializableItems = (items: SerializableCartItem[]): CartItem[] =>
    items.map((item) => ({
      ...item,
      addedAt: new Date(item.addedAt),
    }));

  const applyCartItems = (items: CartItem[]) => {
    const { total, itemCount } = calculateTotals(items);
    setCart({ items, total, itemCount });
  };

  // Load local cart for guests, and merge local cart into account cart on login.
  useEffect(() => {
    if (isLoading) return;

    const loadLocalCart = (): CartItem[] => {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!savedCart) return [];

      try {
        const parsedCart = JSON.parse(savedCart);
        const parsedItems = Array.isArray(parsedCart.items)
          ? parsedCart.items.map((item: SerializableCartItem) => ({
              ...item,
              addedAt: new Date(item.addedAt),
            }))
          : [];
        return parsedItems;
      } catch (error) {
        console.error('Error loading local cart:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
      }
    };

    if (!customer?.email) {
      lastSyncedCustomerRef.current = null;
      applyCartItems(loadLocalCart());
      hasInitializedRef.current = true;
      return;
    }

    if (lastSyncedCustomerRef.current === customer.email) {
      hasInitializedRef.current = true;
      return;
    }

    const syncCustomerCart = async () => {
      const localItems = loadLocalCart();

      try {
        let serverItems: CartItem[] = [];
        const serverRes = await fetch('/api/cart', { cache: 'no-store' });
        if (serverRes.ok) {
          const payload = (await serverRes.json()) as CartApiResponse;
          serverItems = fromSerializableItems(payload.data?.items || []);
        }

        const shouldMerge = localItems.length > 0;
        if (shouldMerge) {
          const mergeRes = await fetch('/api/cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: toSerializableItems(localItems) }),
          });

          if (mergeRes.ok) {
            const payload = (await mergeRes.json()) as CartApiResponse;
            const mergedItems = fromSerializableItems(payload.data?.items || []);
            applyCartItems(mergedItems);
            localStorage.removeItem(CART_STORAGE_KEY);
            lastSyncedCustomerRef.current = customer.email;
            hasInitializedRef.current = true;
            return;
          }
        }

        applyCartItems(serverItems.length > 0 ? serverItems : localItems);
        lastSyncedCustomerRef.current = customer.email;
      } catch (error) {
        console.error('Cart sync error:', error);
        applyCartItems(localItems);
      } finally {
        hasInitializedRef.current = true;
      }
    };

    syncCustomerCart();
  }, [customer?.email, isLoading]);

  // Persist cart locally for guests, and as fallback cache for signed-in users.
  useEffect(() => {
    if (!hasInitializedRef.current) return;

    if (cart.items.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cart]);

  // Persist cart to account store whenever signed-in cart changes.
  useEffect(() => {
    if (!hasInitializedRef.current) return;
    if (isLoading || !customer?.email) return;

    const timeout = setTimeout(async () => {
      try {
        await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: toSerializableItems(cart.items) }),
        });
      } catch (error) {
        console.error('Failed to persist account cart:', error);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [cart.items, customer?.email, isLoading]);

  const addToCart = (product: Product, configuration: ProductConfiguration) => {
    const newItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      product,
      configuration,
      quantity: 1,
      addedAt: new Date(),
    };

    const updatedItems = [...cart.items, newItem];
    applyCartItems(updatedItems);
    trackShopifyAddToCart(product);
    router.push('/cart');
  };

  const removeFromCart = (itemId: string) => {
    const updatedItems = cart.items.filter((item) => item.id !== itemId);
    applyCartItems(updatedItems);

    if (updatedItems.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedItems = cart.items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
    applyCartItems(updatedItems);
  };

  const clearCart = () => {
    setCart({ items: [], total: 0, itemCount: 0 });
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
