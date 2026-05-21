"use client";

import {
  AnalyticsEventName,
  ShopifySalesChannel,
  getClientBrowserParameters,
  sendShopifyAnalytics,
} from "@shopify/hydrogen-react";
import type {
  ShopifyAddToCartPayload,
  ShopifyAnalyticsProduct,
  ShopifyPageViewPayload,
} from "@shopify/hydrogen-react";
import type { Product } from "@/types";

const shopDomain = normalizeDomain(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN);
const shopId = normalizeShopId(process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ID);
const storefrontId = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID;
const acceptedLanguage =
  (process.env.NEXT_PUBLIC_SHOPIFY_ANALYTICS_LANGUAGE || "EN") as ShopifyPageViewPayload["acceptedLanguage"];
const currency =
  (process.env.NEXT_PUBLIC_SHOPIFY_ANALYTICS_CURRENCY || "USD") as ShopifyPageViewPayload["currency"];
const hasUserConsent =
  process.env.NEXT_PUBLIC_SHOPIFY_ANALYTICS_HAS_USER_CONSENT !== "false";

const LOCAL_CART_TOKEN_KEY = "shopify_analytics_cart_token";

function normalizeDomain(domain: string | undefined) {
  return domain?.replace(/^https?:\/\//, "").replace(/\/$/, "") || undefined;
}

function normalizeShopId(id: string | undefined) {
  if (!id) return undefined;
  return id.startsWith("gid://shopify/Shop/") ? id : `gid://shopify/Shop/${id}`;
}

function getLocalCartToken() {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const existingToken = localStorage.getItem(LOCAL_CART_TOKEN_KEY);
  if (existingToken) {
    return existingToken;
  }

  const nextToken =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(LOCAL_CART_TOKEN_KEY, nextToken);
  return nextToken;
}

function getBasePayload() {
  if (!shopId) return null;

  return {
    ...getClientBrowserParameters(),
    hasUserConsent,
    shopId,
    storefrontId,
    currency,
    acceptedLanguage,
    shopifySalesChannel: ShopifySalesChannel.headless,
    analyticsAllowed: hasUserConsent,
    marketingAllowed: false,
    saleOfDataAllowed: false,
  };
}

function getAnalyticsProduct(
  product: Product,
  quantity: number = 1
): ShopifyAnalyticsProduct {
  return {
    productGid: product.id,
    name: product.name,
    brand: "",
    category: product.category || undefined,
    price: product.price.toFixed(2),
    quantity,
  };
}

function logAnalyticsError(error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.warn("Shopify analytics event failed", error);
  }
}

export function trackShopifyProductView(product: Product) {
  const basePayload = getBasePayload();
  if (!basePayload) return;

  const payload: ShopifyPageViewPayload = {
    ...basePayload,
    canonicalUrl: window.location.href,
    pageType: "product",
    resourceId: product.id,
    totalValue: product.price,
    products: [getAnalyticsProduct(product)],
  };

  sendShopifyAnalytics(
    {
      eventName: AnalyticsEventName.PRODUCT_VIEW,
      payload,
    },
    shopDomain
  ).catch(logAnalyticsError);
}

export function trackShopifyAddToCart(product: Product, quantity: number = 1) {
  const basePayload = getBasePayload();
  if (!basePayload) return;

  const payload: ShopifyAddToCartPayload = {
    ...basePayload,
    cartId: `gid://shopify/Cart/${getLocalCartToken()}`,
    totalValue: product.price * quantity,
    products: [getAnalyticsProduct(product, quantity)],
  };

  sendShopifyAnalytics(
    {
      eventName: AnalyticsEventName.ADD_TO_CART,
      payload,
    },
    shopDomain
  ).catch(logAnalyticsError);
}
