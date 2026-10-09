"use client";

import {
  AnalyticsEventName,
  AnalyticsPageType,
  ShopifySalesChannel,
  getClientBrowserParameters,
  sendShopifyAnalytics,
  useShopifyCookies,
} from "@shopify/hydrogen-react";
import type { ShopifyPageViewPayload } from "@shopify/hydrogen-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { getPageType } from "@/lib/page-type";

const shopDomain = normalizeDomain(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN);
const shopId = normalizeShopId(process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ID);
const storefrontId = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID;
const acceptedLanguage =
  (process.env.NEXT_PUBLIC_SHOPIFY_ANALYTICS_LANGUAGE || "EN") as ShopifyPageViewPayload["acceptedLanguage"];
const currency =
  (process.env.NEXT_PUBLIC_SHOPIFY_ANALYTICS_CURRENCY || "USD") as ShopifyPageViewPayload["currency"];
const hasUserConsent =
  process.env.NEXT_PUBLIC_SHOPIFY_ANALYTICS_HAS_USER_CONSENT !== "false";

function normalizeDomain(domain: string | undefined) {
  return domain?.replace(/^https?:\/\//, "").replace(/\/$/, "") || undefined;
}

function normalizeShopId(id: string | undefined) {
  if (!id) return undefined;
  return id.startsWith("gid://shopify/Shop/") ? id : `gid://shopify/Shop/${id}`;
}

// Maps the shared page classification onto Shopify's own enum values.
const SHOPIFY_PAGE_TYPES: Record<ReturnType<typeof getPageType>, string> = {
  home: AnalyticsPageType.home,
  cart: AnalyticsPageType.cart,
  customersAccount: AnalyticsPageType.customersAccount,
  customersLogin: AnalyticsPageType.customersLogin,
  collection: AnalyticsPageType.collection,
  product: AnalyticsPageType.product,
  policy: AnalyticsPageType.policy,
  page: AnalyticsPageType.page,
};

export default function ShopifyAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef<string | null>(null);

  const search = useMemo(() => searchParams.toString(), [searchParams]);

  useShopifyCookies({
    hasUserConsent,
    checkoutDomain: shopDomain,
    fetchTrackingValues: false,
  });

  useEffect(() => {
    if (!shopId || !pathname) return;

    const url = `${pathname}${search ? `?${search}` : ""}`;
    if (lastTrackedUrl.current === url) return;
    lastTrackedUrl.current = url;

    const browserParameters = getClientBrowserParameters();
    const payload: ShopifyPageViewPayload = {
      ...browserParameters,
      hasUserConsent,
      shopId,
      storefrontId,
      currency,
      acceptedLanguage,
      shopifySalesChannel: ShopifySalesChannel.headless,
      analyticsAllowed: hasUserConsent,
      marketingAllowed: false,
      saleOfDataAllowed: false,
      canonicalUrl: window.location.href,
      pageType: SHOPIFY_PAGE_TYPES[getPageType(pathname)],
    };

    sendShopifyAnalytics(
      {
        eventName: AnalyticsEventName.PAGE_VIEW,
        payload,
      },
      shopDomain
    ).catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("Shopify analytics page view failed", error);
      }
    });
  }, [pathname, search]);

  return null;
}
