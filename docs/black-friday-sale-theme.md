# Black Friday Sale Theme — How It Works and How to Remove It

Updated November 2026, replacing the Halloween theme. This temporary re-skin uses
charcoal (`#18181b`), gold (`#f2c75c`), sale tags, sparkles and diagonal corner lines.
Halloween wording, decorations and carousel references are removed from the storefront.

All seven hero slides share a compact responsive layout with clean room photographs,
live text, consistent typography and one CTA. Black Friday uses a restrained gold
accent within the brand's green-and-cream palette. Reassurance remains below the hero.

Discount codes (`FINAL10`, `SUBSCRIBE10`), percentages, pricing and checkout still
come from `src/data/promo.ts` and have not changed. The campaign now leads with the
existing savings and uses a fixed November 30 deadline instead of a daily countdown.

## Campaign messaging

- Main banner: "Better windows. Up to 60% off.", plus an extra 10% with `FINAL10`.
- Blackout banner: "Blackout comfort. 50% off.", plus the same extra 10% code.
- Sale section: "Your window upgrade starts here." and "Find Your Blinds".
- Reassurance: Made to Measure, Manufactured in Texas, Fit Guarantee (subject to terms).
- Product cards and price sections retain the existing sale and compare-at prices,
  without a separate dollar-savings line. Product pages retain the extra-discount prompt.
- The cart's "Apply FINAL10" button uses the existing discount validation and total
  calculation. It only appears when no code is applied and does not stack codes.
- Newsletter signup retains `SUBSCRIBE10`; it is an alternative to `FINAL10`, not
  another stackable discount. All surfaces state one code per order.

## Campaign deadline

`BLACK_FRIDAY_SALE.endsAt` in `src/data/seasonal.ts` is `2026-11-30T23:59:59`:
November 30, 2026 at 11:59:59 PM in each visitor's local time, matching the related
Blackout Blinds campaign's convention. There is intentionally no UTC offset.

The inline and boxed timers display days, hours, minutes and seconds. They do not
reset overnight. Once the deadline is reached, the timer and its label disappear.
The theme, artwork and discount codes are not automatically disabled; turn the
theme switch off and manage Shopify discounts separately when ending the offer.
With the seasonal theme disabled, the regular midnight countdown resumes.

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
| Product cards | Green "50% Off" badge; regular Add to Cart wording; no seasonal dollar-savings line |
| Product page price | Green "50% Off Flash Sale" badge |
| Product side tab and coupon popup | Green tab; popup says "Limited-time saving" |
| Newsletter popup after 10 seconds | No gold strip or Black Friday Sale label |
| Cart | No seasonal banner above the cart |
| Footer | No decorative diagonal corner lines |
| Home FAQ discount-code answer | Regular checkout instructions and "any current sale pricing" |
| Chat assistant knowledge | No Black Friday sale name |

## Hero banners and the two switches

Both switches live in `src/data/seasonal.ts`:

| Switch | Purpose |
|---|---|
| `SEASONAL_SALE_ENABLED` | Main switch; `false` disables the entire theme, including hero slides. |
| `SEASONAL_HERO_BANNERS_READY` | Enables the two seasonal hero slides. Currently `true`; they reuse the regular carousel's clean room photographs. |

The two Black Friday slides lead the five regular slides. All slides use these
text-free WebP photographs in `public/home/hero/`:

- `room-zebra.webp`
- `room-blackout.webp`
- `room-vertical.webp`
- `room-honeycomb.webp`

Regular copy and destinations live in `src/data/hero.ts`; seasonal copy lives in
`src/data/seasonal.ts`. Headings, discounts, coupon codes and CTAs are rendered as
responsive text by `Hero.tsx`, not embedded in photographs. Original raster banners
remain on disk but are no longer used by the carousel.

Artwork and generation prompts are documented in
[black-friday-hero-banner-prompts.md](black-friday-hero-banner-prompts.md).
For future replacements, check image composition, copy, responsive layout and link
destinations. Set banner readiness to `false` while seasonal artwork is incomplete;
the rest of the campaign works while seasonal hero slides are disabled.

## Carousel size

`src/components/home/Hero.tsx` uses one full-width frame for all slides, capped at
480px on desktop and 420px on mobile. Small phones and short landscape screens
use a viewport-height limit. Tablet layouts have a 360px preferred minimum before
the viewport limit applies. `src/app/globals.css` reduces headline size and hides
secondary descriptions on short landscape screens.

Desktop places readable content beside the photo; mobile uses a dark green overlay
on the full-frame photograph. Only photographs crop with `object-cover`; all text
remains independent and responsive. The frame height does not change between slides.
Side arrows remain over the photographs, with compact dot indicators and a pause/play
button. Autoplay runs every seven seconds, pauses on hover/focus and respects reduced
motion preferences. Left/right arrow keys navigate the carousel. Coupon buttons copy
`FINAL10` and show confirmation only after a successful copy.

Old `hero-halloween*.webp` files are unused and can remain on disk. Turning the main
switch off also hides Black Friday slides, regardless of banner readiness.

## Where the theme lives

| File | Themed part |
|---|---|
| `src/data/seasonal.ts` | Switches, deadline, sale copy and hero slides |
| `src/data/hero.ts` | Shared slide content model and regular carousel content |
| `src/app/globals.css` | `--color-seasonal-dark` and `--color-seasonal-accent` |
| `src/components/seasonal/` | `SaleTagIcon`, `SparkleIcon` and `SaleCorner` |
| `src/components/layout/PromoBar.tsx` | Top bar |
| `src/components/layout/NavBar.tsx` | Gold header accent line |
| `src/components/layout/Footer.tsx` | Decorative corner lines |
| `src/components/layout/SubscribePopup.tsx` | Newsletter strip and sale label |
| `src/components/home/Hero.tsx` | Shared compact carousel, live copy, navigation and seasonal slides |
| `src/components/home/FlashSale.tsx` | Sale section |
| `src/components/home/FAQ.tsx` | Discount-code answer |
| `src/components/common/CountdownTimer.tsx` | Fixed-date seasonal timer, expiry and label ownership; regular countdown fallback |
| `src/components/product/ProductCard.tsx` | Discount badge and Customize & Save wording |
| `src/components/product/ProductPage.tsx` | Price badge, code prompt, side tab and coupon popup |
| `src/app/cart/page.tsx` | Cart banner and one-click code application |
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
   Keep `src/data/hero.ts` and the `room-*.webp` photographs: the regular carousel
   uses them when the seasonal campaign is disabled.
5. Run `npx tsc --noEmit` and `npm run build` to check for remaining references.

## Reusing it for the next sale

Update the sale name, heading and banner list in `src/data/seasonal.ts`, set banner
readiness to `false` until replacement images exist, then adjust the two CSS colors
and decorative icons as needed. Set the main switch to `true` and deploy. Update
this guide and the banner prompts to match the new season.
