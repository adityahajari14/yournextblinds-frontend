# Halloween Hero Banner Prompts

Two banners, each in a desktop and a mobile size, matching the layout of the existing
hero slides (`public/home/hero/hero-roller.webp`, `hero-sale.webp`). The existing slides
stay in the carousel; these two are added in front of them.

| Banner | Desktop file (2752×1536) | Mobile file (1792×2400) | Links to |
|---|---|---|---|
| 1. Halloween Sale | `hero-halloween.webp` | `hero-halloween-mobile.webp` | `/collections` |
| 2. Halloween Blackout | `hero-halloween-blackout.webp` | `hero-halloween-blackout-mobile.webp` | `/collections/blackout-roller-shades` |

Save all four as WebP in `public/home/hero/` with exactly these names, then set
`SEASONAL_HERO_BANNERS_READY` to `true` in `src/data/seasonal.ts`.

Tip: attach an existing slide (e.g. `hero-roller.webp` for desktop, `hero-sale-mobile.webp`
for mobile) as a style/layout reference image if your generator supports it.

## Rules for every banner

- The offer text must read exactly: **Use code FINAL10 for 10% off**. Do not add any other
  percentage, price, date or "ends" wording to the artwork.
- Check the spelling of every word in the output before saving (generators often garble
  small text) and regenerate if anything is off.
- Tasteful and cozy, not horror: no blood, gore, skulls, zombies or scary faces. No people.
- The blind/shade must look like a real product: straight, evenly spaced, correctly fitted
  inside the window frame.

## Style baseline (include in every prompt)

Clean modern e-commerce hero banner for a premium made-to-measure blinds brand. Flat
graphic text panel combined with a photorealistic interior photograph. Typography: bold
geometric sans-serif (like Poppins / Inter Bold), tight letter spacing, crisp and perfectly
spelled. Colour palette: warm cream `#f7f1e6` panel background, deep brand green `#00473c`,
midnight aubergine `#1a1023`, pumpkin orange `#ff7a1a`. Rounded pill-shaped labels and
buttons, thin dashed outline around the coupon line, small simple line icons. Halloween
accents are small and tasteful: a few tiny flat bat silhouettes, one small flat
jack-o'-lantern icon, a thin cobweb line drawing in one corner. Photograph: cozy modern
home interior at dusk in late October, warm lamp light, soft shadows, shot on a full-frame
camera with a 35mm lens, shallow depth of field. High resolution, sharp, no watermark, no
brand logos.

Negative prompt (all): blood, gore, skull, zombie, scary face, people, hands, misspelled
text, extra text, watermark, logo, cartoon style photo, 3d render look, distorted window
frame, crooked blinds, oversaturated colors, cluttered layout

---

## 1. Halloween Sale — desktop (2752×1536, 16:9 landscape)

Save as `hero-halloween.webp`

> Wide 16:9 landscape hero banner, split layout. LEFT 50%: flat warm cream panel with
> left-aligned text stacked top to bottom with generous margins: a huge two-line headline,
> line one "The Halloween" in midnight aubergine, line two "Sale" in deep brand green; under
> it a midnight-aubergine rounded pill label with a small orange jack-o'-lantern icon and
> white text "Made-to-Measure Blinds & Shades"; under it a small round pale-orange icon
> badge with a bat icon next to two lines of deep green bold text "Frightfully Good Prices /
> On Every Window"; under it a dashed-outline rounded box reading "Use code" then a deep
> green pill with white text "FINAL10" then "for 10% off"; at the bottom a deep green
> rounded button with a shopping-bag icon and white text "Shop Now →". A thin cobweb line
> drawing in the top-left corner of the panel and three tiny bat silhouettes near the
> headline. RIGHT 50%: photorealistic cozy living room at dusk, one large window fitted
> with a charcoal dual zebra roller shade lowered two-thirds, deep purple-orange twilight
> sky visible below it, two carved glowing pumpkins and a small lantern on the windowsill,
> a linen sofa corner with a rust-orange throw in soft focus, warm lamp glow. Where the two
> halves meet, a round pumpkin-orange badge overlapping the seam with white bold text
> "SPOOKY SEASON. / SERIOUS SAVINGS." [+ style baseline]

## 2. Halloween Sale — mobile (1792×2400, 3:4 portrait)

Save as `hero-halloween-mobile.webp`

> Tall 3:4 portrait hero banner. The photograph fills the whole frame: a cozy living room
> at dusk with one large window in the upper two-thirds, fitted with a charcoal dual zebra
> roller shade lowered two-thirds, purple-orange twilight sky below it, two carved glowing
> pumpkins and a small lantern on the windowsill, sofa corner with a rust-orange throw at
> the bottom right. The left side and lower half fade into a soft warm cream gradient so
> text is easy to read. Text is left-aligned in the lower half with wide margins, stacked
> top to bottom: huge two-line headline "The Halloween" in midnight aubergine and "Sale" in
> deep brand green; a midnight-aubergine rounded pill label with a small orange
> jack-o'-lantern icon and white text "Made-to-Measure Blinds & Shades"; a bat icon next to
> two lines of deep green bold text "Frightfully Good Prices / On Every Window"; a
> dashed-outline rounded box reading "Use code FINAL10 for 10% off" with FINAL10 in bold;
> a deep green rounded button with a shopping-bag icon and white text "Shop Now ›". On the
> right edge, level with the bottom of the shade, a round pumpkin-orange badge with white
> bold text "SPOOKY SEASON. / SERIOUS SAVINGS." and a tiny bat icon. Keep all text clear of
> the outer 6% of the frame. [+ style baseline]

## 3. Halloween Blackout — desktop (2752×1536, 16:9 landscape)

Save as `hero-halloween-blackout.webp`

> Wide 16:9 landscape hero banner, split layout. LEFT 50%: flat warm cream panel with
> left-aligned text stacked top to bottom with generous margins: a huge two-line headline,
> line one "Dark Nights," in midnight aubergine, line two "Sweet Dreams" in deep brand
> green; under it a midnight-aubergine rounded pill label with a small crescent-moon icon
> and white text "Blackout Roller Shades"; under it a small round pale-orange icon badge
> with a bat icon next to two lines of deep green bold text "Block 100% of Light / This
> Halloween"; under it a dashed-outline rounded box reading "Use code" then a deep green
> pill with white text "FINAL10" then "for 10% off"; at the bottom a deep green rounded
> button with a shopping-bag icon and white text "Shop Now →". Three tiny bat silhouettes
> near the headline. RIGHT 50%: photorealistic calm bedroom at night, one large window
> fitted with a matte charcoal blackout roller shade fully lowered, only a faint glow of a
> full moon at the very edges of the frame, a wooden nightstand with one small glowing
> jack-o'-lantern and a warm bedside lamp, a made bed with linen bedding in soft focus.
> Where the two halves meet, a round midnight-aubergine badge overlapping the seam with
> white bold text "100% BLACKOUT. / NO TRICKS." [+ style baseline]

## 4. Halloween Blackout — mobile (1792×2400, 3:4 portrait)

Save as `hero-halloween-blackout-mobile.webp`

> Tall 3:4 portrait hero banner. The photograph fills the whole frame: a calm bedroom at
> night with one large window in the upper two-thirds, fitted with a matte charcoal
> blackout roller shade fully lowered, a faint full-moon glow at the very edges of the
> window frame, a wooden nightstand with one small glowing jack-o'-lantern and a warm
> bedside lamp at the bottom right, linen bedding in soft focus. The left side and lower
> half fade into a soft warm cream gradient so text is easy to read. Text is left-aligned
> in the lower half with wide margins, stacked top to bottom: huge two-line headline "Dark
> Nights," in midnight aubergine and "Sweet Dreams" in deep brand green; a
> midnight-aubergine rounded pill label with a small crescent-moon icon and white text
> "Blackout Roller Shades"; a bat icon next to two lines of deep green bold text "Block
> 100% of Light / This Halloween"; a dashed-outline rounded box reading "Use code FINAL10
> for 10% off" with FINAL10 in bold; a deep green rounded button with a shopping-bag icon
> and white text "Shop Now ›". On the right edge, level with the bottom of the shade, a
> round midnight-aubergine badge with white bold text "100% BLACKOUT. / NO TRICKS." Keep
> all text clear of the outer 6% of the frame. [+ style baseline]
