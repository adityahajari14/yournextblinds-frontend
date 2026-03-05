'use server';

import { cookies } from 'next/headers';
import {
  shopifyCustomerFetch,
  type ShopifyCustomer,
} from './shopify';

const TOKEN_COOKIE = 'shopify_customer_token';

/**
 * Get the currently authenticated customer (server-side).
 * Used only for checkout email pre-fill.
 * Account management is handled by Shopify's hosted account pages.
 */
export async function getCustomer(): Promise<ShopifyCustomer | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  if (!token) return null;

  try {
    const customer = await shopifyCustomerFetch(token);
    if (!customer) {
      cookieStore.delete(TOKEN_COOKIE);
      return null;
    }
    return customer;
  } catch {
    cookieStore.delete(TOKEN_COOKIE);
    return null;
  }
}
