# Black Friday Sale Theme — How It Works and How to Remove It

Updated November 2026, replacing the Halloween theme. This temporary re-skin uses
charcoal (`#18181b`), gold (`#f2c75c`), sale tags, sparkles and diagonal corner lines.
Halloween wording, decorations and carousel references are removed from the storefront.

Discount codes (`FINAL10`, `SUBSCRIBE10`), percentages, pricing, the daily countdown
and checkout still come from `src/data/promo.ts` and have not changed. Black Friday
does not introduce an additional discount or a fixed sale deadline.

## Turning it off

In `src/data/seasonal.ts`, change:

```ts
export const SEASONAL_SALE_ENABLED = true;
```

to:

```ts
export const SEASONAL_SALE_ENABLED = false;
```

Commit and deploy. Every seasonal surface returns to the regular green styling and
original wording. No Shopify change is needed. The theme does not turn itself off
on a date; it stays on until this switch is changed and the site is redeployed.

## What to check after turning it off

| Where | It should be back to |
|---|---|
| Top bar | Green, regular tag icon, "UP TO 60% OFF", white Shop Now button |
| Under the header | No gold accent line |
| Home hero | Regular first slide; no seasonal slides |
| Sale section on home, collection and product pages | Green, "OUR BIGGEST FLASH SALE EVER", "Shop the Sale" |
| Product cards | Green "50% Off" badge |
| Product page price | Green "50% Off Flash Sale" badge |
| Product side tab and coupon popup | Green tab; popup says "Limited-time saving" |
| Newsletter popup after 10 seconds | No gold strip or Black Friday Sale label |
| Cart | No seasonal banner above the cart |
| Footer | No decorative diagonal corner lines |
| Home FAQ discount-code answer | Ends with "any current sale pricing" |
| Chat assistant knowledge | No Black Friday sale name |

## Hero banners and the two switches

Both switches live in `src/data/seasonal.ts`:

| Switch | Purpose |
|---|---|
| `SEASONAL_SALE_ENABLED` | Main switch; `false` disables the entire theme, including hero slides. |
| `SEASONAL_HERO_BANNERS_READY` | Only enables the two seasonal hero slides. Currently `true`; all four optimized WebP files are present. |

The two Black Friday slides now lead the carousel, followed by the five regular
slides. All four WebP files are in `public/home/hero/`:

- `hero-black-friday.webp`
- `hero-black-friday-mobile.webp`
- `hero-black-friday-blackout.webp`
- `hero-black-friday-blackout-mobile.webp`

Artwork and generation prompts are documented in
[black-friday-hero-banner-prompts.md](black-friday-hero-banner-prompts.md).
For future replacements, check every image's text, dimensions, desktop/mobile layout
and destination before enabling the banner switch. Set it to `false` while artwork
is incomplete; the rest of the sale theme works while banners are disabled.

## Carousel size

`src/components/home/Hero.tsx` displays each banner at full width with automatic
height, preserving the artwork's natural proportions without cropping or padding.
The active slide determines the carousel height; there is no fixed or viewport
height cap. Black Friday artwork dimensions are recorded in `src/data/seasonal.ts`;
other slides use the regular 2752×1536 desktop and 1792×2400 mobile dimensions.
The original side arrows and white dots remain over the artwork.

Old `hero-halloween*.webp` files are unused and can remain on disk. Turning the main
switch off also hides Black Friday slides, regardless of banner readiness.

## Where the theme lives

| File | Themed part |
|---|---|
| `src/data/seasonal.ts` | Switches, sale name, section heading and hero slides |
| `src/app/globals.css` | `--color-seasonal-dark` and `--color-seasonal-accent` |
| `src/components/seasonal/` | `SaleTagIcon`, `SparkleIcon` and `SaleCorner` |
| `src/components/layout/PromoBar.tsx` | Top bar |
| `src/components/layout/NavBar.tsx` | Gold header accent line |
| `src/components/layout/Footer.tsx` | Decorative corner lines |
| `src/components/layout/SubscribePopup.tsx` | Newsletter strip and sale label |
| `src/components/home/Hero.tsx` | Seasonal hero slides |
| `src/components/home/FlashSale.tsx` | Sale section |
| `src/components/home/FAQ.tsx` | Discount-code answer |
| `src/components/common/CountdownTimer.tsx` | Boxed countdown colors |
| `src/components/product/ProductCard.tsx` | Discount badge colors |
| `src/components/product/ProductPage.tsx` | Price badge, side tab and coupon popup |
| `src/app/cart/page.tsx` | Cart banner |
| `src/lib/server/chat/knowledge.ts` | Sale name supplied to the assistant |

Search for `SEASONAL_SALE` to find all consumers. Each retains its regular branch.

## Deleting the theme completely (optional)

Disabling the main switch is sufficient and preserves the setup for the next sale.
For complete removal:

1. In each consumer above, remove the seasonal import and retain only the regular
   branch. Remove decorative icon imports and seasonal-only elements.
2. Delete `src/data/seasonal.ts` and `src/components/seasonal/`.
3. Remove the two seasonal color definitions from `src/app/globals.css`.
4. Remove unused seasonal hero artwork and the two Black Friday documentation files.
5. Run `npx tsc --noEmit` and `npm run build` to check for remaining references.

## Reusing it for the next sale

Update the sale name, heading and banner list in `src/data/seasonal.ts`, set banner
readiness to `false` until replacement images exist, then adjust the two CSS colors
and decorative icons as needed. Set the main switch to `true` and deploy. Update
this guide and the banner prompts to match the new season.
