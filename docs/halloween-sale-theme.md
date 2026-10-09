# Halloween Sale Theme — How It Works and How to Remove It

Added October 2026. The Halloween theme is a temporary re-skin of the existing sale. It
changes colours, wording and decorations only. The discount codes (`FINAL10`,
`SUBSCRIBE10`), the percentages, the pricing, the countdown and the checkout are exactly
what they were before and still come from `src/data/promo.ts`.

## Turning it off (the normal way to end the sale)

1. Open `src/data/seasonal.ts`.
2. Change this line:

   ```ts
   export const SEASONAL_SALE_ENABLED = true;
   ```

   to:

   ```ts
   export const SEASONAL_SALE_ENABLED = false;
   ```

3. Commit and deploy.

That is the whole removal. Every themed surface reads this one switch and goes back to
the regular green styling and the original wording. No other file needs to change, and
nothing in Shopify needs to change.

The theme does not switch itself off on a date. It stays on until this line is changed
and the site is redeployed.

## What to check after turning it off

| Where | It should be back to |
|---|---|
| Top bar on any page | Green bar, tag icon, "UP TO 60% OFF", white Shop Now button |
| Under the header | No orange line |
| Home page hero | Starts on the regular first slide; no Halloween banners |
| Sale section (home, collections, product pages) | Green, "OUR BIGGEST FLASH SALE EVER", "Shop the Sale" |
| Product cards | Green "50% Off" badge |
| Product page price | Green "50% Off Flash Sale" badge |
| Product page side tab and coupon popup | Green tab; popup header says "Limited-time saving" |
| Newsletter popup (appears after 10 seconds) | No orange strip, no "Halloween Sale" label |
| Cart page | No Halloween banner above the cart |
| Footer | No cobweb in the top-right corner |
| Home FAQ, "How do I use my 10% off discount code?" | Ends with "any current sale pricing" |

The chat assistant also stops calling the offer the Halloween Sale; that needs no check
beyond the deploy.

## The two switches

Both are in `src/data/seasonal.ts`.

| Switch | What it does |
|---|---|
| `SEASONAL_SALE_ENABLED` | The main switch. `false` turns the whole theme off, including the hero banners. |
| `SEASONAL_HERO_BANNERS_READY` | Only controls the two Halloween hero banners. Keep it `false` until the four image files exist, otherwise the carousel shows broken images. |

## Hero banners

The Halloween banners are extra slides placed in front of the regular five. The regular
slides are never removed.

- Prompts and exact file names: `docs/halloween-hero-banner-prompts.md`
- Files go in `public/home/hero/`:
  `hero-halloween.webp`, `hero-halloween-mobile.webp`,
  `hero-halloween-blackout.webp`, `hero-halloween-blackout-mobile.webp`
- Once all four are there, set `SEASONAL_HERO_BANNERS_READY` to `true`.

When the main switch is turned off, the banners disappear from the carousel on their
own. The image files can stay in `public/home/hero/`; they are simply not used.

## Where the theme lives

Useful if something needs adjusting while the sale is running.

| File | What it holds |
|---|---|
| `src/data/seasonal.ts` | The switches, the sale name ("Halloween Sale"), the section heading, the hero banner list |
| `src/app/globals.css` | The two theme colours: `--color-seasonal-dark` (`#1a1023`) and `--color-seasonal-accent` (`#ff7a1a`) |
| `src/components/seasonal/` | The pumpkin, bat and cobweb drawings |

Files that read the switch and show the themed version:

| File | Themed part |
|---|---|
| `src/components/layout/PromoBar.tsx` | Top bar |
| `src/components/layout/NavBar.tsx` | Orange line under the header |
| `src/components/layout/Footer.tsx` | Cobweb corner |
| `src/components/layout/SubscribePopup.tsx` | Newsletter popup strip and label |
| `src/components/home/Hero.tsx` | Halloween hero slides |
| `src/components/home/FlashSale.tsx` | Sale section |
| `src/components/home/FAQ.tsx` | Discount-code answer wording |
| `src/components/common/CountdownTimer.tsx` | Countdown box colours in the sale section |
| `src/components/product/ProductCard.tsx` | "50% Off" badge colour |
| `src/components/product/ProductPage.tsx` | Price badge, side tab, coupon popup header |
| `src/app/cart/page.tsx` | Cart banner |
| `src/lib/server/chat/knowledge.ts` | Sale name given to the chat assistant |

In each of these, the themed code sits next to the original and is chosen by
`SEASONAL_SALE`. Searching the project for `SEASONAL_SALE` finds every place.

## Deleting the code completely (optional)

Turning the switch off is enough, and leaving the code in place means the same setup can
be reused for the next seasonal sale. Delete it only if it will never be used again.

If the Halloween work went in as its own commit, the cleanest way is to revert that
commit:

```
git revert <commit-hash>
```

Otherwise, by hand:

1. In each file in the "Files that read the switch" table, remove the `SEASONAL_SALE`
   import and keep only the non-seasonal branch of each condition (the green classes and
   the original wording).
2. Delete `src/data/seasonal.ts` and the `src/components/seasonal/` folder.
3. Remove the two `--color-seasonal-*` lines from `src/app/globals.css`.
4. Delete the four `hero-halloween*.webp` files from `public/home/hero/`, if they were added.
5. Delete `docs/halloween-hero-banner-prompts.md` and this file.
6. Run `npx tsc --noEmit` and `npm run build` to confirm nothing still refers to the
   removed files.

## Reusing it for another season

1. In `src/data/seasonal.ts`, change the sale name, the section heading and the hero
   banner list.
2. In `src/app/globals.css`, change the two `--color-seasonal-*` colours.
3. In `src/components/seasonal/SeasonalIcons.tsx`, replace the pumpkin, bat and cobweb
   drawings with ones that suit the season.
4. Set `SEASONAL_SALE_ENABLED` to `true` and deploy.
