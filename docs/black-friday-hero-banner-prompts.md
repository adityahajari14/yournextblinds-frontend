# Home Carousel Photography and Black Friday Banner Guide

Updated November 6, 2026. The home carousel now renders all seven slides with a shared compact responsive layout. Banner copy is HTML rather than lettering baked into artwork, so it remains readable when the carousel is made smaller.

## Active photographs

The built-in image generation tool was used in edit mode to turn the existing product banners into clean room photographs. All output PNGs remain in the image generation library. Production WebP assets (Sharp, quality 86) are saved in `public/home/hero/`:

| File | Size | Used by |
|---|---|---|
| `room-zebra.webp` | 1536×1024 | Black Friday main, Made to Fit, Dual Zebra Shades |
| `room-blackout.webp` | 1536×1024 | Black Friday blackout, Blackout Roller Shades |
| `room-vertical.webp` | 1536×1024 | Vertical Blinds |
| `room-honeycomb.webp` | 1536×1024 | Honeycomb Shades |

Earlier raster banner variants remain on disk but are not active. Photographs contain no promotional lettering, logos, buttons or badges.

## Layout and copy

- `src/data/hero.ts` defines the shared slide content model, five regular slides and destinations.
- `src/data/seasonal.ts` defines the two Black Friday slides, headline percentages and campaign deadline. Offer values still come from `src/data/promo.ts`.
- `src/components/home/Hero.tsx` renders accessible text, coupon-copy buttons, one CTA per slide and navigation.
- Every slide shares a full-width frame: up to 480px on desktop, 420px on phones, with viewport limits for short screens. Tablet widths and small phones use smaller type and adjusted sizing.
- Desktop combines a cream content area and room photograph; mobile uses a subtle dark-green overlay on the photograph. Green typography and a restrained gold Black Friday accent keep the campaign prominent without extra badges or oversized lettering.
- Only the photographs crop; headline, offer, coupon and CTA remain responsive HTML. No blank side gutters and no height changes between slides.
- The former seasonal heatwave wording has been replaced with evergreen Honeycomb Shades copy.
- Autoplay is seven seconds with hover/focus pause, an explicit pause/play control, keyboard arrows and reduced-motion support.

For future visual changes, edit the content or CSS instead of regenerating text-filled posters. Generate a new photograph only when the room or product image needs changing. Check every slide at phone, tablet, desktop and short landscape sizes.

## Exact final photography prompts

### Zebra-shade living room

Edit the supplied existing zebra-shade banner into a clean PHOTOGRAPH ONLY for a responsive website carousel. Preserve the source's realistic bright neutral living room, cream sofa, grey dual zebra roller shades, natural light, oak floor and overall product look. Remove ALL lettering, sale badges, coupon graphics, buttons, underlines, flat cream text panel and graphic overlays. Reconstruct the room naturally across the whole frame so the result is a full-width realistic interior photograph, not a split banner. Landscape 3:2 composition, approximately 1800x1200, with the large window and correctly fitted zebra shades centered in the upper-middle, sofa toward the lower-right, warm modern styling and restrained greenery. Window and blind are the hero. Frame with a little breathing room around the window to allow responsive crops. Straight realistic geometry, high quality editorial interior photography, natural material textures. No text of any kind, no logos, no marketing graphics, no people, no watermarks, no distorted slats. Save final image and report local path.

### Blackout-shade bedroom

Edit the supplied existing blackout roller shade banner into a clean PHOTOGRAPH ONLY for a compact responsive website hero. Preserve the original realistic neutral bedroom, correctly fitted fully lowered matte charcoal blackout roller shade, linen bed, wood nightstand and soft warm lamp. Remove ALL lettering, icons, promotional badges, coupons, buttons, flat graphic panel and marketing overlays. Reconstruct a natural complete bedroom photograph across the full frame, not a split banner. Landscape 3:2, approximately 1800x1200. Large straight window with the blackout roller shade centered in the upper-middle, bed in lower-right, lamp and nightstand to the left; a professional, calm, warm editorial interior photograph with depth and tasteful contrast. Keep the actual product geometry and appearance faithful to the source, with breathing room around the window for responsive crops. No text anywhere, no logos, no people, no circles, no graphics or watermark. Photorealistic material textures, no artificial render look. Save final image and report local path.

### Vertical-blind living room

Edit the supplied vertical-blinds banner into a clean PHOTOGRAPH ONLY. Preserve the existing photorealistic bright modern living room with large correctly fitted white vertical blinds across the tall windows, neutral upholstered chair, wood floor, low table and tasteful green houseplants. Remove ALL text, flat text panel, badges, buttons, coupon graphics, logos and overlays. Reconstruct the room across the entire frame as a natural complete interior photograph, not a split graphic. Landscape 3:2, approximately 1800x1200. The straight vertical-blind window should dominate the upper-middle with evenly spaced slats, chair and low table below and to one side, soft daylight and refined cream/wood/green colors. Keep breathing room around the window for cropping in a responsive website image panel. Professional editorial photography, realistic materials, clean and minimal. No text, no logos, no graphics, no people, no watermark. Save final photograph and report local path.

### Honeycomb-shade room

Edit the supplied honeycomb-shade sale banner into a clean PHOTOGRAPH ONLY. Preserve the actual charcoal pleated honeycomb cellular shade and its realistic evenly spaced pleats, correctly fitted in the window, with the neutral upholstered chair, natural wood, plant and warm room lighting. Remove ALL lettering, slogans, coupon boxes, buttons, flat cream text panel, sun icons, orange discount badges and other graphics. Reconstruct a complete calm contemporary room photograph across the full frame, not a split banner. Landscape 3:2, approximately 1800x1200. Large straight window and honeycomb shade centered in the upper-middle, shade lowered two-thirds with softly lit outdoors below, chair in lower-right, small plant to one side. Sophisticated warm afternoon light and natural neutral material textures, subtle depth, muted colors, premium editorial interior photography. Keep enough space around the window for responsive image crops. No text, no logos, no decorative overlays, no people, no watermark, no distorted product. Save final photograph and report local path.

See [black-friday-sale-theme.md](black-friday-sale-theme.md) for the campaign deadline and rollback procedure.
