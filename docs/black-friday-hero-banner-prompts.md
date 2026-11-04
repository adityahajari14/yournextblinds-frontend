# Black Friday Hero Banner Artwork and Prompts

Generated with the built-in image generation tool and converted to WebP with Sharp
(quality 87). The original generated PNGs are preserved outside the repository.
The four production WebP files are in `public/home/hero/` and are enabled through
`SEASONAL_HERO_BANNERS_READY = true` in `src/data/seasonal.ts`.

| Banner | Desktop (1983×793) | Mobile (1182×1330) | Destination |
|---|---|---|---|
| Black Friday Sale | `hero-black-friday.webp` | `hero-black-friday-mobile.webp` | `/collections` |
| Black Friday Blackout | `hero-black-friday-blackout.webp` | `hero-black-friday-blackout-mobile.webp` | `/collections/blackout-roller-shades` |

The compact desktop artwork is approximately 5:2; mobile artwork is approximately
8:9. Each banner fills the width and uses automatic height at its natural aspect
ratio, without cropping, padding or a height cap. The active image sets the height.
Navigation retains the original side arrows and white dots over the artwork.

## Shared generation specification

Use case: ads-marketing. Final raster ecommerce homepage hero artwork, not a website
screenshot. A premium modern interiors campaign for a made-to-measure blinds brand.
Charcoal `#18181b`, gold `#f2c75c` and warm cream `#f7f1e6`. Geometric sans-serif
headlines, crisp accurate typography, a dashed coupon box, gold rounded CTA, one
small gold sale-tag icon and restrained diagonal corner lines. Use realistic
interior photography with straight, correctly fitted blinds. Keep important text
inside roughly 9–10% safe margins. Spell every word correctly. No dates, deadlines,
extra percentages, 100% claims, people, logos, Halloween objects or watermarks.

The offer line is always exactly: **Use code FINAL10 for 10% off**.
Generator target sizes were 2400×960 and 1200×1350; the delivered sizes are listed
above. Preserve aspect ratios when preparing future replacements.

## 1. Black Friday Sale — desktop

> Wide panoramic landscape, 5:2. Left 52% clean warm cream flat graphic panel; right
> 48% photorealistic upscale living room, large straight window fitted with charcoal
> dual zebra roller shades lowered two-thirds, linen sofa, natural oak and warm
> daylight. Large geometric sans-serif typography on the left with generous spacing.
> Exact text: small uppercase eyebrow "MADE TO MEASURE. MADE FOR YOU."; enormous
> two-line charcoal headline "Black Friday" / "Sale"; supporting line "Beautiful
> windows. Serious savings."; thin dashed coupon box "Use code FINAL10 for 10% off"
> with FINAL10 bold; gold rounded CTA "Shop the Sale →". Keep all offer text legible
> and clear of the edges. Apply the shared specification.

Save as `hero-black-friday.webp`.

## 2. Black Friday Sale — mobile

> Compact portrait, 8:9. Upper 42% photorealistic warm modern living room with a
> correctly fitted charcoal dual zebra roller shade lowered two-thirds, linen sofa,
> natural oak table and natural daylight. Lower 58% warm cream graphic panel blending
> into the photo. Left-aligned text with 11% side margins. Exact text: small uppercase
> "MADE TO MEASURE"; bold charcoal two-line headline "Black Friday" / "Sale";
> supporting line "Beautiful windows. Serious savings."; dashed coupon box "Use
> code FINAL10 for 10% off" with FINAL10 bold; gold rounded CTA "Shop the Sale →".
> Small gold sale-tag icon by headline and fine diagonal corner accents. Prioritize
> readability at phone size. Apply the shared specification.

Save as `hero-black-friday-mobile.webp`.

## 3. Black Friday Blackout — desktop

> Wide panoramic landscape, 5:2. Left 52% warm cream flat panel; right 48%
> photorealistic tranquil upscale bedroom with large straight window fitted with a
> matte charcoal blackout roller shade fully lowered, natural oak nightstand, small
> warm brass lamp and cream linen bedding in warm evening light. Left-side text:
> small charcoal pill with gold lettering "BLACK FRIDAY SALE"; enormous two-line
> headline "Dark nights." / "Sweet dreams."; supporting text "Blackout Roller
> Shades"; dashed coupon box "Use code FINAL10 for 10% off" with FINAL10 bold;
> gold rounded CTA "Shop Blackout Shades →". Small gold sale-tag line icon and fine
> diagonal corner lines. Apply the shared specification.

Save as `hero-black-friday-blackout.webp`.

## 4. Black Friday Blackout — mobile

> Compact portrait, 8:9. Upper 43% photorealistic upscale bedroom, correctly fitted
> matte charcoal blackout roller shade fully lowered, natural oak nightstand with
> warm brass bedside lamp and cream linen bedding. Lower 57% warm cream panel blending
> into the photo. Left-aligned geometric sans-serif text with 10% side margins:
> charcoal pill with gold lettering "BLACK FRIDAY SALE"; bold two-line charcoal
> headline "Dark nights." / "Sweet dreams."; supporting text "Blackout Roller
> Shades"; dashed coupon box "Use code FINAL10 for 10% off" with FINAL10 bold;
> gold rounded CTA "Shop Blackout Shades →". Keep coupon and CTA legible on a phone,
> without overlapping typography. Small sale-tag icon and fine diagonal corners.
> Apply the shared specification.

Save as `hero-black-friday-blackout-mobile.webp`.

For a future artwork refresh, disable the banner readiness switch until all four
replacement files have been checked. For the full rollback procedure, see
[black-friday-sale-theme.md](black-friday-sale-theme.md).
