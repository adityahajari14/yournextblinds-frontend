'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductConfiguration, Cart, CartItem, CartContextType } from '@/types';
import { trackShopifyAddToCart } from '@/lib/shopify-analytics';
import { track } from '@/lib/track';

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

// Set when the buyer is redirected to Shopify checkout. The cart is kept until
// the draft order is confirmed paid, so a failed/abandoned redirect never loses
// a configured order.
export const PENDING_CHECKOUT_KEY = 'pending_checkout';
const PENDING_CHECKOUT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface PendingCheckout {
  draftOrderId: string;
  createdAt: number;
}

interface SerializableCartItem extends Omit<CartItem, 'addedAt'> {
  addedAt: string;
}

const calculateCartTotals = (items: CartItem[]) => ({
  total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
});

export const CartProvider = ({ children }: CartProviderProps) => {
  const router = useRouter();
  const hasInitializedRef = useRef(false);
  const [cart, setCart] = useState<Cart>({
    items: [],
    total: 0,
    itemCount: 0,
  });

  const applyCartItems = (items: CartItem[]) => {
    const { total, itemCount } = calculateCartTotals(items);
    setCart({ items, total, itemCount });
  };

  // Cart state is intentionally local-only to avoid a runtime database dependency.
  useEffect(() => {
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

    const localItems = loadLocalCart();
    queueMicrotask(() => {
      const { total, itemCount } = calculateCartTotals(localItems);
      setCart({ items: localItems, total, itemCount });
      hasInitializedRef.current = true;
    });

    // If the buyer was previously sent to checkout, clear the cart only once
    // the draft order is confirmed paid; otherwise keep it so they can retry.
    const checkPendingCheckout = async () => {
      const raw = localStorage.getItem(PENDING_CHECKOUT_KEY);
      if (!raw) return;

      let pending: PendingCheckout;
      try {
        pending = JSON.parse(raw);
      } catch {
        localStorage.removeItem(PENDING_CHECKOUT_KEY);
        return;
      }

      if (!pending.draftOrderId || Date.now() - pending.createdAt > PENDING_CHECKOUT_MAX_AGE_MS) {
        localStorage.removeItem(PENDING_CHECKOUT_KEY);
        return;
      }

      try {
        const draftOrderId = encodeURIComponent(pending.draftOrderId);
        const response = await fetch(`/api/orders/status/${draftOrderId}`);
        if (!response.ok) return;
        const body = await response.json();
        const status = body?.data;
        if (status && (status.status === 'completed' || status.orderId)) {
          localStorage.removeItem(PENDING_CHECKOUT_KEY);
          localStorage.removeItem(CART_STORAGE_KEY);
          setCart({ items: [], total: 0, itemCount: 0 });
        }
      } catch {
        // Transient failure — keep the marker and re-check on the next visit.
      }
    };
    checkPendingCheckout();
  }, []);

  // Persist cart locally for guests and signed-in users.
  useEffect(() => {
    if (!hasInitializedRef.current) return;

    if (cart.items.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cart]);

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
    track('add_to_cart', { handle: product.slug, price: product.price });
    router.push('/cart');
  };

  const removeFromCart = (itemId: string) => {
    const removed = cart.items.find((item) => item.id === itemId);
    if (removed) {
      track('remove_from_cart', { handle: removed.product.slug, price: removed.product.price });
    }
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

  const updateCartItem = (
    itemId: string,
    product: Product,
    configuration: ProductConfiguration
  ) => {
    // Functional update so multiple calls in one tick don't clobber each other
    // (e.g. applying recalculated prices to several items at once).
    setCart((prevCart) => {
      const updatedItems = prevCart.items.map((item) =>
        item.id === itemId ? { ...item, product, configuration } : item
      );
      const { total, itemCount } = calculateCartTotals(updatedItems);
      return { items: updatedItems, total, itemCount };
    });
  };

  const clearCart = () => {
    setCart({ items: [], total: 0, itemCount: 0 });
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, updateCartItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
