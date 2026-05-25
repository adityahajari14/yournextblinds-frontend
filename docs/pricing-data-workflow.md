# Pricing Data Workflow

Runtime pricing reads from `src/data/pricing/pricing-data.json`. Neon and Prisma are not required by the live app.

## Runtime

- Runtime pricing reads from `src/data/pricing/pricing-data.json`.
- The app does not need `DATABASE_URL`, Prisma, Neon, or `PRICING_SOURCE`.
- Server-side checkout still recalculates prices before creating a Shopify draft order.
- Shopify product data still needs Shopify credentials, including `SHOPIFY_ADMIN_ACCESS_TOKEN` for product-to-price-band metadata.
- Shopify catalog data uses a 1-hour cache by default to reduce Vercel usage. Redeploy after urgent Shopify catalog edits, or lower `SHOPIFY_CACHE_REVALIDATE_SECONDS`, `SHOPIFY_ADMIN_PRODUCT_CACHE_REVALIDATE_SECONDS`, and `SERVER_API_CACHE_REVALIDATE_SECONDS` if fresher reads matter more than usage.

## Updating Pricing Data

1. Update `src/data/pricing/pricing-data.json`.
2. Run `npm run pricing:validate`.
3. Run `npm run pricing:validate:shopify` when Shopify product metafields may have changed.
4. Commit `src/data/pricing/pricing-data.json` and `src/data/pricing/pricing-report.json`.
5. Deploy and spot-check affected products.

## Shopify Reference Validation

Run this when Shopify `custom.price_band_name` metafields may have changed:

```bash
npm run pricing:validate:shopify
```

## Product CSV Export

Run this when you need a catalog CSV:

```bash
npm run export:products
```

The export reads base prices from `src/data/pricing/pricing-data.json`, not from Neon.

## Cart Behavior

Carts are local-browser only. They persist on the same device/browser using `localStorage`, including for signed-in users. Cross-device cart sync is intentionally removed to avoid runtime database usage.
