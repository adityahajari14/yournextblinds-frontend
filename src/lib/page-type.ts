// Shared page classification. Shopify's analytics needs its own enum values
// (see AnalyticsPageType in ShopifyAnalytics), so this returns plain strings and
// the Shopify component maps them onto its enum.
export type PageType =
  | "home"
  | "cart"
  | "customersAccount"
  | "customersLogin"
  | "collection"
  | "product"
  | "policy"
  | "page";

export function getPageType(pathname: string): PageType {
  if (pathname === "/") return "home";
  if (pathname === "/cart") return "cart";
  if (pathname === "/account") return "customersAccount";
  if (pathname === "/login") return "customersLogin";
  if (pathname === "/collections" || pathname.startsWith("/collections/")) {
    return "collection";
  }
  if (pathname.startsWith("/product/")) return "product";
  if (pathname.endsWith("-policy") || pathname.startsWith("/terms")) {
    return "policy";
  }

  return "page";
}
