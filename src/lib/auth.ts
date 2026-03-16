'use server';

import {
  shopifyCustomerFetch,
  type ShopifyCustomer,
} from './shopify';
import { getValidCustomerAccessToken } from './server/customer-account-auth';

/**
 * Get the currently authenticated customer (server-side).
 * Used only for checkout email pre-fill.
 * Account management is handled by Shopify's hosted account pages.
 */
export async function getCustomer(): Promise<ShopifyCustomer | null> {
  const token = await getValidCustomerAccessToken();
  if (!token) return null;

  try {
    const customer = await shopifyCustomerFetch(token);
    return customer;
  } catch {
    return null;
  }
}
