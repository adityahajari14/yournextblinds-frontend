# Your Next Blinds — Complete CRO Audit & Implementation Plan

**Date:** July 2026 · **Scope:** full codebase + every page · **Baseline:** ~3,600 visitors, 0 sales
**Stack:** Next.js 16 (App Router, ISR), React 19, Tailwind 4, Shopify Storefront + Admin APIs, local pricing engine (`src/data/pricing/pricing-data.json`), localStorage cart, Shopify draft-order checkout (confirmed working).

Every finding below cites the file and line it was observed in. Nothing here is generic advice.

---

# Part 1 — Executive Summary

## Scores

| Dimension | Score | Notes |
|---|---|---|
| **Overall website** | **4.5 / 10** | Solid engineering foundations (ISR, server components, real pricing engine, real policies/guides) undermined by landing-page, performance, and visibility gaps |
| **Conversion readiness** | **3 / 10** | The funnel works mechanically, but the site gives visitors little reason, proof, or guidance to complete a high-consideration purchase |
| Design/UX craft | 6 / 10 | Clean Tailwind implementation, good mobile nav, responsive layouts |
| Trust | 3.5 / 10 | Real contact info and policies exist but are invisible at the point of decision |
| Performance | 2 / 10 | `images.unoptimized: true` + 195 MB of assets; 5–8 MB hero images |
| Measurability | 1 / 10 | No third-party analytics; `begin_checkout` and `purchase` never tracked anywhere |

## The five biggest conversion blockers (in order of likely impact)

1. **Page weight makes mobile unusable.** `next.config.ts:30` sets `images.unoptimized: true`, so every `next/image` serves the raw file. The homepage hero slides are 5.7–6.9 MB each (`public/home/hero/`), `craftsmanship-bg.jpg` is 8.6 MB, and the public folder totals 195 MB. A first mobile paint can require 25–40 MB. Most of the 3,600 visitors likely bounced before the page finished rendering. **Estimated impact of fixing: +30–50% of visitors actually see the site; largest single lever available.**
2. **The landing page's value proposition is trapped inside bitmaps.** The hero (`src/components/home/Hero.tsx`) carries its headline, subheadline, coupon, and CTA *baked into the images themselves* ("Light, Your Way." etc.) — sighted visitors see copy, but there is no HTML headline (no H1 on the page), no machine-readable value proposition for search engines, no screen-reader access beyond alt text, and the "CTA" is a whole-slide link rather than a button. Category tiles render images with no text labels (`CategoryGrid.tsx:62-71`). **Estimated impact: moderate direct, high for SEO/accessibility; fix is cheap.**
3. **The configurator silently blocks purchases.** Add-to-Cart starts disabled and never explains why (`ProductPage.tsx:713,1731-1740`) even though `getMissingRequiredCustomizations` already computes the exact reasons. No price appears until both dimensions are entered; before that the button is a dead grey rectangle. **Estimated impact: +15–30% of PDP visitors reaching the cart.**
4. **Zero funnel visibility.** The only tracking is Shopify Hydrogen's first-party events (page view, product view, add-to-cart). `begin_checkout` is never fired (`cart/page.tsx:120-126`), and the `orders-paid` webhook only `console.log`s (`api/webhooks/shopify/orders-paid/route.ts:12`). You cannot currently know *where* visitors drop off. **Impact: enables every future decision; prerequisite for all other measurement.**
5. **Discovery dead-ends.** A top-level "Shop by" menu whose children have no `href` (`navigation.ts:54-60`), a search suggestion pointing to a non-existent Roman Blinds collection (`search/page.tsx:144-156`), "Coming Soon" traps for unmatched categories (`collections/[category]/page.tsx:134`), and a bare default Next.js 404 (no `not-found.tsx` exists). **Estimated impact: +5–10% session depth.**

## Highest-ROI improvements (effort vs impact)

| Fix | Effort | Impact | Priority |
|---|---|---|---|
| Re-enable image optimization + compress heroes | Low | Very high | **Critical** |
| Hero headline + CTA overlay | Low | High | **Critical** |
| Explain disabled Add-to-Cart | Low | High | **Critical** |
| First-party analytics + funnel dashboard | Medium | High (indirect) | **Critical** |
| Buy Now button + sticky mobile CTA | Medium | High | **High** |
| Checkout resilience (cart preservation, price-mismatch recovery) | Medium | Medium | **High** |
| SEO foundation (sitemap, robots, OG, schema) | Low | Medium (compounding) | **High** |
| 404/error pages, dead-link fixes, category labels | Low | Medium | **High** |
| US locale consistency (dates, copy, phone) | Low | Medium | **Medium** |
| PDP trust content (metafields, guides, delivery/returns) | Medium | High | **Medium** (Phase 2) |
| Mini-cart drawer, zoom, cross-sell, filters | High | Medium | **Low** (Phases 2–3) |

## Priority matrix

- **Critical:** image weight, hero value proposition, configurator feedback, analytics pipeline.
- **High:** Buy Now/sticky CTA, checkout resilience, SEO foundation, 404/dead links.
- **Medium:** locale cleanup, PDP content depth, delivery-promise consistency, contact form.
- **Low:** mini-cart, zoom/lightbox, filter overhaul, bundle slimming.

---

# Part 2 — Complete Page-by-Page CRO Audit

## Home (`src/app/page.tsx`)

Render order (`page.tsx:29-40`): Hero → CategoryGrid → BestSelling → Craftsmanship → FreeSamples → FlashSale → FAQ. `TopBar`, `WindowTypes`, `Categories`, `Installation` are commented out.

- **First impression:** a full-width image carousel whose copy (headline, subhead, FINAL10 coupon, "Shop …" link) is rendered inside the image files, not as HTML. Visually acceptable — but the text cannot reflow on small screens, is invisible to search engines, and can't be A/B tested or updated without regenerating imagery.
- **Information hierarchy:** no HTML H1 anywhere on the page. The first real heading is "Shop by Category" (`CategoryGrid.tsx:46`) — but the tiles below it show **unlabeled images** (`cat.label` is never rendered, `CategoryGrid.tsx:62-71`), so the category grid depends on image legibility alone.
- **CTA placement:** each hero slide is one whole-slide `<Link>`; the "Shop Dual Zebra Shades →" affordance is painted pixels, not a focusable button. No real HTML CTA exists above the fold.
- **Trust:** zero trust elements on the entire page — no testimonials, no review counts, no payment icons, no guarantee, no delivery promise. The existing `CustomerReviewsSection` component renders only on product pages.
- **Clarity/consistency:** the home FAQ says delivery takes "5-7 business days" (`FAQ.tsx:26`); the shipping policy says 3-5 days manufacturing plus transit; the product page computes "today + 12 days" (`ProductPage.tsx:1064-1072`). Three different answers to the customer's #1 question.
- **Distraction:** `BestSelling` is simply the first 5 products from the API (`fetchProducts({limit:5})`) — fine visually, but the label overpromises.
- **Copy quality:** "Fast, Free Samples … First in your Letterbox" (`FreeSamples.tsx:5`) — British idiom on a US store (see Part 9 locale section).

## Collections (`src/app/collections/page.tsx`, `[category]/page.tsx`)

- 16 nav slugs map to backend categories/tags (`navigation.ts:131-173`). Anything unmatched or empty renders `ComingSoon` (`[category]/page.tsx:134,165`) — a hard dead-end reachable from the promoted main menu. `CategoryHero` also shows a second "Coming Soon" badge at zero products (`CategoryHero.tsx:44-47`).
- **Filters are name-substring matches.** Color and Pattern filters work by searching the product *title* (`ProductGridWithFilters.tsx:76-87`) — a "grey" filter misses any grey blind without "grey" in its name. There are no price, material, opacity, room, or motorized filters — the four attributes a blinds shopper actually filters by.
- **Sort "Best Selling" is a no-op** (`ProductGridWithFilters.tsx:289-293`) — it keeps API order.
- Product cards show a fixed price with **no "from $X" qualifier** — on made-to-measure products the configured price will differ, creating a mismatch-surprise later. The card's "Add to Cart" button actually routes to the customizer (`ProductCard.tsx:64`) — reasonable behavior, misleading label ("Customize" would set expectations).
- Good: empty-filter state with Clear All (`ProductGridWithFilters.tsx:299-316`), Load-More at 24.

## Product page (`src/app/product/[slug]/page.tsx` + `src/components/product/ProductPage.tsx`)

Covered in depth in Part 4. Headline issues: unexplained disabled CTA, no price until both dimensions entered, silent min/max clamping of typed measurements, rich Shopify metafields fetched but never rendered, no zoom, no persistent mobile CTA (a `StickyBottomBar` component exists but is never mounted).

## Cart (`src/app/cart/page.tsx`)

- localStorage-only (by design, `docs/pricing-data-workflow.md`).
- **Cart is cleared before the checkout redirect resolves** (`cart/page.tsx:122-126`: `clearCart()` then `window.location.href`). If the redirect fails, is blocked, or the user presses Back, a fully configured multi-item order is unrecoverable. For a product that takes minutes to configure, this is the most punishing failure mode in the funnel.
- **Price-mismatch dead end:** the server rejects checkout if its recalculated price differs from the submitted price by more than $0.50 (`order.service.ts:278-285`), and the UI prints the raw technical string ("Price mismatch for … submitted $X, calculated $Y", `cart/page.tsx:541-545`). No "prices were updated — continue?" path; the buyer is simply stuck.
- **Contradictory shipping messaging:** "Calculated at checkout" (`cart/page.tsx:530`) vs "Free delivery on every order" (`cart/page.tsx:584`) on the same screen.
- The "Customization Costs" breakdown (`cart/page.tsx:221-325`) re-derives prices from static option data instead of the actual band-dependent server price — motorization is hardcoded to +$95 (`:311`) regardless of the selected motor.
- No cross-sell ("add another room") despite blinds being an inherently multi-window purchase.
- Good: sticky order summary (`:520`), sample CTA (`:565`), responsive layout.

## Checkout

Shopify draft-order flow via `/api/orders/create-checkout` → `order.service.ts` → redirect to the order's invoice URL. **The flow itself is confirmed working.** Remaining issues are resilience-related (cart clearing, mismatch recovery, generic "Internal server error" on 500 with no retry or support fallback — `create-checkout/route.ts:34-38`, `cart/page.tsx:127-133`).

## About (`src/app/about/page.tsx`)

Genuinely good: real story since 2008, clear structure, "Designed for Light. Built for Life." No customer proof, team photos, or press — but as a supporting page it is above average.

## Contact (`src/app/contact/page.tsx`)

Real phone, email, and street address (`:31-54`) — but **no contact form**, no business hours, no map, no live chat. Visitors who won't phone a stranger have no low-friction way to ask a pre-purchase question.

## Guides (`src/app/guides/page.tsx`)

The strongest trust asset on the site: real downloadable measuring and installation PDFs per product family, in English and Spanish (`:9-105`). **But it is only reachable from a nav item and the footer** — never surfaced on the product page, where measuring anxiety actually kills sales.

## Policies

- **Shipping** (`shipping-policy/page.tsx`): real and detailed; conflicts with home FAQ timings; uses "working days" (UK phrasing).
- **Refund** (`refund-policy/page.tsx`): real; includes a **5-year warranty** (`:64`) — a major trust asset that is buried in a policy page and mentioned nowhere else on the site.
- **Terms** (`terms-and-conditions/page.tsx`): thorough, but clause numbering is visibly broken (§3 starts at "2.1", §4 at "3.1", etc. — `:22` onward), and **§30 states production facilities in Texas, Leeds (UK), and Guangzhou (China)** (`:146`), directly contradicting the site-wide "Proudly Made in Texas" positioning (`Craftsmanship.tsx:21-22`, Footer, About). Any customer who reads both loses trust. *(Requires a business decision — flagged, not auto-fixed.)*
- **Privacy** (`privacy-policy/page.tsx`): comprehensive; contains UK/EEA GDPR transfer language (`:90`) odd for a US-positioned store.

## Search (`src/app/search/page.tsx`)

Works (client-side query → `fetchProducts({search})`), decent empty state. But the no-query state suggests **"Roman Blinds" → `/collections/roman-blinds`**, a collection that doesn't exist in `ALL_COLLECTION_SLUGS` (`navigation.ts:73-90`) — a suggested link that dead-ends. No autocomplete, no popular searches.

## Navigation & Header (`Header.tsx`, `NavBar.tsx`, `navigation.ts`)

- "Shop by" menu children ("Shop by Feature", "Shop by room") have **no `href`** and render as dead text (`navigation.ts:54-60`, `Header.tsx:80-84`).
- No phone number in the header — `TopBar` (which had one) is disabled everywhere except `/samples`, and the one it shows is a leftover **Indian toll-free "1800 245 2525"** (`TopBar.tsx:6`, live at `samples/page.tsx:148`) that contradicts the US +1 number in the footer.
- Search is a link to a separate page, not an inline box. Mobile hamburger drawer is well built (overlay, accordions, aria-labels — `NavBar.tsx:98-128`).

## Footer (`Footer.tsx`)

Real US contact details (+1 832-670-6705, Cypress TX — `:37-40`). Missing: payment-method icons, security badge, social links, newsletter field (signup exists only as a timed popup), and any reference to the 5-year warranty.

## 404 / error pages

**None exist.** No `not-found.tsx`, `error.tsx`, `global-error.tsx`, or `loading.tsx` anywhere in `src/app`. `notFound()` calls (`product/[slug]/page.tsx:64`, `collections/[category]/page.tsx:99`) land on Next.js's unstyled default with no nav or recovery path. Production data errors are swallowed (`console.error` gated to development, e.g. `product/[slug]/page.tsx:61`), so a backend outage renders empty pages or "Coming Soon" with no signal to anyone.

---

# Part 3 — UX Audit

**Navigation / IA:** two-level nav is sensible (Blinds / Shades / Motorization / Blackout), but the broken "Shop by" branch, unlabeled category tiles, and Coming-Soon traps mean the *implemented* IA is less complete than the *designed* IA. Search page suggestion links bypass the nav slug system entirely (backend slugs vs nav slugs — `search/page.tsx:144-156` vs `navigation.ts:131-173`), producing inconsistent destinations.

**Visual hierarchy & typography:** Inter + Montserrat via `next/font` (good, no FOUT). Landing page hierarchy is inverted — imagery is maximal, words minimal; the buyer's first actionable text arrives ~2 screens down.

**Buttons & CTAs:** the primary conversion button on the PDP can be disabled with no explanation (Part 4). The product card CTA is mislabeled ("Add to Cart" → customizer). The hero has no button at all.

**Forms:** measurement inputs clamp out-of-range values on blur, silently replacing what the user typed (`SizeSelector.tsx:64-105`) — a user who types 60" into a 48"-max blind gets 48" with only a subtle hint, and may order the wrong size or distrust the tool.

**Error states:** raw technical strings at checkout (`cart/page.tsx:541-545`), generic "Internal server error" on 500s, silent empty-render on data failures, default 404. There is effectively no designed error experience anywhere.

**Loading states:** a single inline `<Suspense fallback="Loading...">` on the PDP (`product/[slug]/page.tsx:155`); no route-level `loading.tsx`; collections show nothing while ISR resolves.

**Consistency:** three different delivery promises; "Calculated at checkout" vs "Free delivery" on the same cart screen; `en-GB` date formatting (`ProductPage.tsx:1065`) on a US store; trailing-period nav labels ("About.", "Shop.") as a deliberate quirk.

**Accessibility:** decent baseline (aria-labels in nav/drawer, alt text everywhere — ironically the hero's *only* copy). Header icon targets ~24px, below the 44px touch guideline (`Header.tsx:111-167`). The value-prop-in-alt-text pattern means screen-reader users ironically get a *better* hero than sighted users.

**Dev debris:** leftover `console.log`s in production paths (`ProductPage.tsx:672`, `SizeSelector.tsx:114,132`).

---

# Part 4 — Product Page Audit

**Configuration flow (`ProductPage.tsx`, 2,222 lines):**

- **No price until both width and height are entered** (`priceCalculation` returns null otherwise, `:743`), and the total silently falls back to the minimum "from" price (`:765-771`). A user who has entered only width sees a price that is *wrong* with no indication it's incomplete. If the price matrix fails to load, add-to-cart proceeds on the fallback price — which the server then rejects at checkout with the $0.50 mismatch rule. Failure surfaces at the *worst possible moment*.
- **Disabled Add-to-Cart with no explanation** (`isAddToCartDisabled`, `:713`; button `:1731-1740`). `getMissingRequiredCustomizations` (`product-customization-validation.ts`) already produces a human-readable list of what's missing — it is never rendered. This is the single cheapest high-impact fix on the site.
- **Multi-table products** (Roller Band F, Day & Night Band H) deliberately don't preselect a color (`:445`), and size limits are wrong until one is picked — with no prompt telling the user to pick one.
- **Silent clamping** of typed measurements on blur (`SizeSelector.tsx:64-105`).

**Content & trust on the PDP:**

- Shopify metafields for product details, specifications, measuring & installation, and delivery & returns are **fetched but never rendered** (`shopify.ts:166-180,373-376`). The purchase decision screen answers almost none of: How do I measure? What's the fabric like? What if it doesn't fit? When will it arrive? What's the warranty?
- Delivery estimate is invented client-side (today + 12 days, `:1064-1072`); a dead stale constant `'22 December 2025'` remains in `types/index.ts:363`.
- The 5-year warranty (refund policy `:64`) — the strongest guarantee the store offers — is never mentioned on the PDP.
- **No image zoom or lightbox** (`ProductGallery.tsx` has no zoom handlers) for a product bought on fabric texture.
- **No free-sample module** near the color selector — only a small link that appears after samples are already in the basket (`:858-865`). Samples are the industry's #1 risk-reversal tool and the PDP barely mentions them.
- **No Buy Now path and no sticky CTA:** `StickyBottomBar.tsx` (with a Buy Now button) exists in the codebase but is never imported by `ProductPage` — mobile users scrolling the long configurator lose sight of price and CTA entirely.
- Cross-sell: related products render at the very bottom (`:2210`); nothing in cart.

**Unanswered customer questions on the PDP** (each one a reason to leave): How do I measure my window? What happens if I measure wrong? How long until it ships/arrives? What is the return policy for custom goods? Is there a warranty? What is the fabric made of / how thick? Can I see it before buying (samples)? How does it mount — inside or outside? Is installation hard?

---

# Part 5 — Conversion Psychology Audit

| Trigger | Status | Evidence |
|---|---|---|
| Trust | Weak | Real policies/contact exist but are invisible at decision points; payment icons only on cart |
| Authority | Weak | "Since 2008", "Made in Texas" claimed but undermined by T&C §30 contradiction |
| Social proof | Absent on landing | No testimonials/review counts on home; `CustomerReviewsSection` only on PDP |
| Urgency | Present but risky | "Today Only" + a countdown that resets every midnight (`promo.ts:36-40`); "OUR BIGGEST FLASH SALE EVER" (`FlashSale.tsx:33`) |
| Scarcity | "Whilst Stock Lasts" on PromoBar — odd for made-to-measure goods | `PromoBar.tsx` |
| Risk reversal | Hidden | 5-year warranty + free samples exist but are buried; samples require a checkout-like flow |
| Value proposition | Not stated | No hero headline; no USP bar |
| Purchase confidence | Low | No measurement reassurance, no "wrong-size protection" messaging, no delivery certainty |

**Documented risk (per owner decision, no code change planned):** the strike-through price is computed as `displayPrice / (1 − 50/100)` (`ProductCard.tsx:54`, `promo.ts:24`) — i.e., the "original price" is synthesized by doubling the real price — and the "Today Only" countdown resets nightly. Under FTC deceptive-pricing rules (16 CFR §233, former-price comparisons must be genuine) this pattern carries legal exposure and, if noticed by shoppers or competitors, reputational cost. The `FINAL10` code must also exist as a real Shopify discount or it will fail at payment (`promo.ts` note). **Recommendation on record: replace with a genuine, dated promotion; decision deferred by owner.**

**Missing levers to add (phased):** USP strip under the hero (free samples · 5-year warranty · free US delivery · made in Texas), warranty callout on PDP and cart, sample CTA beside the color picker, "measured wrong? we'll help" reassurance, real testimonials on home, delivery-date certainty.

---

# Part 6 — Performance Audit

1. **`images.unoptimized: true`** (`next.config.ts:30`) disables Next.js resizing/format conversion for every image on the site. Combined with the asset inventory below, this is the dominant performance problem and plausibly the largest single conversion killer:
   - `public/home/craftsmanship-bg.jpg` — 8.6 MB
   - `public/home/hero/hero-roller.png` — 6.9 MB; `hero-zebra.png` 6.7 MB; `hero-vertical.png` 5.9 MB; `hero-background.jpg` 5.7 MB
   - `public/home/installation.jpg` — 5.8 MB; ~40 product-option PNGs at 1–4 MB; category tiles ~2 MB
   - `public/` total: **195 MB**
   - **LCP:** the hero image is the LCP element and can take 10–60s on 4G. **Fix:** remove the flag, compress/resize assets to WebP at display dimensions, add `priority` + proper `sizes` to the first hero slide.
2. **Hydration weight:** 60 of 63 components are `'use client'`, including the 2,222-line `ProductPage`. Route entries are server components with ISR (`revalidate = 3600`) — good — but nearly the whole tree ships as client JS. Phase-4 work: split static PDP sections out of the client bundle.
3. **CLS risk:** hero/category images without reserved aspect boxes on slow loads; countdown/promo bars mount client-side. Minor relative to items 1–2.
4. Fonts are done right (`next/font`, Inter + Montserrat, `layout.tsx:2,11-19`). No third-party blocking scripts. No raw `<img>` tags anywhere — re-enabling the optimizer benefits the whole site at once.
5. `pricing-data.json` (~38,700 lines) is imported via server-only modules — keep it that way; never import it into a client component.

---

# Part 7 — SEO & Discoverability Audit

| Item | Status |
|---|---|
| `sitemap.ts` / sitemap.xml | **Missing** |
| `robots.ts` / robots.txt | **Missing** |
| JSON-LD (Product, Organization, BreadcrumbList, FAQPage) | **None on the entire site** |
| Canonical URLs | **Missing** |
| Open Graph / Twitter cards | **Missing** |
| `metadataBase` | **Missing** (relative OG URLs would malform) |
| Title/description | Present: root (`layout.tsx:21-27`), product + collection `generateMetadata` (`product/[slug]/page.tsx:34-50`, `collections/[category]/page.tsx:36-61`) |
| Image alt text | Present throughout |
| Heading hierarchy | Home page lacks a visible H1 |

Consequences: Google has no crawl map and no product rich-result eligibility (price/availability snippets); shared links render with no preview card. For a store with no paid acquisition, organic + social discoverability is effectively switched off.
Also: product meta descriptions reuse the raw product description (`product/[slug]/page.tsx:43`) — dedupe/trim in Phase 2.

---

# Part 8 — Mobile Experience Audit

- **Weight first:** everything in Part 6 lands hardest on mobile. This is the mobile experience problem.
- **No persistent CTA on the PDP:** the configurator is several screens tall; price and Add-to-Cart scroll away. `StickyBottomBar` exists precisely for this and is unmounted.
- Sticky stack (PromoBar + header) consumes meaningful vertical space on small screens; acceptable, monitor after adding sticky CTA.
- Header icon tap targets ~24px (`Header.tsx:111-167`) — below the 44px guideline; padding can fix without redesign.
- Good: hamburger drawer (`NavBar.tsx:98-128`), responsive cart (`flex-col lg:flex-row`, `cart/page.tsx:381`), no horizontal-scroll breakage found, no fixed-width traps.
- Forms: numeric measurement inputs work on mobile keyboards; the silent blur-clamping (Part 3) is worse on mobile where the hint text is easier to miss.

---

# Part 9 — Trust Audit

**What a first-time visitor can verify:** a US phone number, email, and street address in the footer (`Footer.tsx:37-40`); real, detailed policies; real measuring guides (EN/ES PDFs); an LLC name in the terms (`terms-and-conditions/page.tsx:14`). That is a genuinely above-average base — **almost none of it is surfaced where buying decisions happen.**

**Trust gaps:**
- No payment icons or security reassurance in the footer or PDP (cart shows 6 payment icons, `cart/page.tsx:591-597`).
- The 5-year warranty appears once, inside the refund policy.
- No guarantee/returns messaging on the PDP or cart.
- No delivery-date certainty; three conflicting delivery claims (home FAQ vs shipping policy vs PDP estimate).
- **Locale schizophrenia reads as fake to attentive US shoppers:** British "letterbox"/"colour"/"working days" (`FreeSamples.tsx:5`, `samples/page.tsx:161-162`, policy pages), `en-GB` date rendering (`ProductPage.tsx:1065`), an Indian toll-free number on the samples page (`TopBar.tsx:6`), and T&C §30's Texas/Leeds/Guangzhou admission vs "Made in Texas" everywhere else. Any one of these can read as "drop-shipping front" to a suspicious visitor.
- Samples flow promises "no payment, no signature required" (`SampleBrowser.tsx:334`) then routes through an address/checkout flow — a promise the next screen appears to break.

**First-time trustworthiness estimate: 3.5/10** — not because trust assets are missing, but because they're unfindable and the locale inconsistencies actively signal risk.

---

# Part 10 — Funnel Analysis

| Stage | What happens | Friction / drop-off causes | Tracking today |
|---|---|---|---|
| Visitor → Landing | 5–8 MB hero begins loading | Page weight (mobile), no headline/CTA, no trust strip | Shopify PAGE_VIEW only |
| Landing → Browsing | Unlabeled category tiles; nav | Dead "Shop by" items; Coming-Soon traps | Nothing (no select_item/collection view) |
| Browsing → Product view | Card → customizer (label says "Add to Cart") | No "from $" price expectation-setting | Shopify PRODUCT_VIEW |
| Product → Add to Cart | Enter dims, pick options | No price until both dims; disabled CTA unexplained; silent clamping; color-first requirement on multi-table products | Shopify ADD_TO_CART |
| Add to Cart → Cart | Forced redirect to /cart | Kills multi-room shopping; no mini-cart | Nothing (no view_cart) |
| Cart → Checkout | POST create-checkout → redirect to Shopify invoice | Cart cleared pre-redirect; $0.50 mismatch dead-end; generic 500s; contradictory shipping copy | **Nothing (no begin_checkout)** |
| Payment → Purchase | Shopify-hosted (works) | Wallet availability per Shopify config | **Nothing (webhook only console.logs)** |

The defining fact: **from cart onward, the funnel is completely unobserved.** With 3,600 visitors, even coarse instrumentation would already have shown which of the above stages is the cliff.

---

# Part 11 — Analytics Audit

**Current implementation:** `@shopify/hydrogen-react` analytics only. `ShopifyAnalytics.tsx` fires PAGE_VIEW on route change (`:86-96`); `trackShopifyProductView` / `trackShopifyAddToCart` (`shopify-analytics.ts:92,114`) fire from PDP and CartContext. Data goes only to Shopify's headless analytics. Silent no-op if `NEXT_PUBLIC_SHOPIFY_SHOP_ID` is unset (`shopify-analytics.ts:56`) — **verify this env var in production**; `marketingAllowed: false` is hardcoded (`:67-68`).

**Event coverage:**

| Event | Tracked? |
|---|---|
| page_view | Shopify only |
| view_item | Shopify only |
| collection view / view_item_list | No |
| search / filter_used / sort_used | No |
| add_to_cart | Shopify only |
| remove_from_cart / view_cart | No |
| **begin_checkout** | **No** |
| shipping/payment info | No (Shopify-hosted; recoverable only via webhooks) |
| **purchase** | **No** (`orders-paid/route.ts` logs and exits; also lacks HMAC verification) |
| refund | No (`refunds-create` webhook exists, unused for analytics) |
| coupon applied / banner click / scroll depth / exit intent | No |
| sample_request / newsletter_signup | No |

**Impact:** every question that matters — "do visitors reach product pages?", "do they start configuring?", "does anyone click checkout?" — is currently unanswerable. Marketing spend, copy tests, and UX fixes cannot be evaluated. The 0-sales problem cannot even be localized to a funnel stage.

---

# Part 12 — Analytics & Dashboard Plan (custom first-party — per owner decision)

## Architecture

- **Client:** `src/lib/track.ts` — `track(event, params)`; anonymous `visitor_id` (localStorage UUID) + `session_id` (sessionStorage, 30-min idle rotation); auto-captured context: path, referrer, UTM params (persisted for the session), device class (UA + viewport), timestamp. Delivery via `navigator.sendBeacon` with `fetch` keepalive fallback. No cookies, no PII → minimal consent surface.
- **Ingest:** `src/app/api/track/route.ts` — validates event name against the taxonomy, caps payload size, writes to Postgres (Neon serverless driver, `DATABASE_URL`). Batched inserts; fire-and-forget from the client.
- **Server events:** `purchase` and `refund` recorded directly in the Shopify webhooks (`orders-paid`, `refunds-create`) with HMAC verification added — server-side purchase recording is immune to ad-blockers and client failures.
- **Storage:** single `events` table — `id, ts, visitor_id, session_id, event, path, referrer, utm_source/medium/campaign, device, params jsonb`. Indexes on `(event, ts)` and `(session_id)`.
- **Dashboard:** `/admin/analytics` (token-gated via `ANALYTICS_DASHBOARD_TOKEN`) — funnel, KPIs, breakdowns.

## Event taxonomy

| Event | Trigger | Key params |
|---|---|---|
| `page_view` | route change | path, title |
| `view_item` | PDP mount | product_handle, price_min |
| `view_item_list` | collection render | collection, product_count |
| `select_item` | product card click | product_handle, position, list |
| `search` | search executed | query, result_count |
| `filter_used` / `sort_used` | filter/sort change | type, value |
| `price_calculated` | both dims valid, price computed | product_handle, width, height, price |
| `add_to_cart` | CartContext.addToCart | product_handle, price, config summary |
| `remove_from_cart` | cart item removed | product_handle, price |
| `view_cart` | /cart mount | item_count, cart_value |
| `begin_checkout` | checkout button click, pre-request | item_count, cart_value |
| `buy_now_click` | PDP Buy Now click | product_handle, price |
| `checkout_error` | create-checkout 4xx/5xx | code, message_class (mismatch/server) |
| `sample_request` | sample submit | sample_count |
| `newsletter_signup` | popup/API success | source |
| `purchase` (server) | orders-paid webhook | order_id, value, item_count |
| `refund` (server) | refunds-create webhook | order_id, value |

## Dashboard structure

- **Funnel (headline view):** visitors → view_item → add_to_cart → view_cart → begin_checkout → purchase, with stage-to-stage conversion % and day/week range picker.
- **Daily KPIs:** visitors, sessions, PDP views, add-to-cart rate, begin-checkout rate, purchases, revenue, checkout_error count.
- **Weekly KPIs:** the above aggregated + top products viewed vs added, search terms with zero results, sample requests.
- **Monthly KPIs:** conversion rate trend, AOV, returning-visitor share, revenue by UTM source.
- **Segmentation:** device (mobile/desktop), source/medium (UTM + referrer), new vs returning (first-seen visitor_id).
- **Recovery view:** sessions with `begin_checkout` and no `purchase` in 24h (checkout abandonment), sessions with `add_to_cart` and no `begin_checkout` (cart abandonment) — counts + associated cart values.
- **Alerting (later phase):** daily job — alert if checkout_error > N, purchases = 0 with begin_checkout > M, or event volume drops >50% day-over-day.
- **Validation:** dev-mode console echo of every tracked event; a seed script replaying a synthetic session; row counts vs Shopify dashboard for page/product views during the first week.

---

# Part 13 — Implementation Roadmap

## Phase 1 — Critical fixes *(implemented alongside this report — see Part 14 batches)*
Image optimization; hero headline/CTA; configurator feedback; checkout resilience; error/404/loading pages; US locale cleanup; custom analytics + dashboard; SEO foundation; nav dead-link fixes; **Buy Now button + sticky mobile CTA** (owner-requested).

## Phase 2 — Conversion improvements
Render fetched Shopify metafields (specs, measuring, delivery/returns) as PDP tabs/accordions; warranty + free-samples modules on PDP; "from $X" pricing on cards; delivery-promise unification with a stated dispatch window; contact form; standalone /faq assembled from existing content; guides surfaced on PDP.

## Phase 3 — Trust & UX enhancements
Mini-cart drawer (remove forced /cart redirect); image zoom/lightbox; cart cross-sell ("add another room"); measurement-confidence messaging ("we'll help if you measure wrong" — requires a business policy decision); testimonials on home; payment icons + warranty in footer; samples flow simplified to a plain address form (business decision: keep Shopify order trail vs lower friction).

## Phase 4 — Performance optimizations
Split `ProductPage.tsx` into server-rendered content + client configurator island; audit client bundle; compress remaining `public/` assets beyond the Phase-1 top offenders; add `loading.tsx` skeletons to all data routes.

## Phase 5 — Analytics & tracking maturation
Scroll depth, exit intent, time-on-PDP; alerting job; abandonment recovery email hook (needs email provider decision); A/B scaffold for hero copy.

## Phase 6 — Polish
Filter system on real product attributes (requires Shopify metafield/tag work); autocomplete search; T&C renumbering + manufacturing-claims reconciliation (business decision); accessibility pass (tap targets, focus states); `ComingSoon` replaced with nearest-match redirects.

Ordering minimizes conflicts: Phase 1 touches config/new files and isolated component fixes; Phase 2+ build on the analytics and PDP structures Phase 1 introduces.

---

# Part 14 — Implementation Batches (Phase 1)

| # | Batch | Scope | Files | Acceptance criteria | Risk |
|---|---|---|---|---|---|
| B1 | Checkout resilience | Cart snapshot + restore; price-mismatch recovery UI; friendly failure UI | `cart/page.tsx`, `order.service.ts`, `create-checkout/route.ts`, `CartContext.tsx` | Cart survives failed redirect; mismatch shows "update & continue"; 500 shows support fallback | Medium — touches order flow; test add→checkout in dev |
| B2 | Configurator feedback | Show missing-requirement list under CTA; remove dev logs | `ProductPage.tsx`, `SizeSelector.tsx` | Disabled button always accompanied by the reason(s) | Low |
| B3 | Error/404/loading | `not-found.tsx`, `error.tsx`, `global-error.tsx`, route `loading.tsx` | `src/app/*` (new files) | Bad URL shows branded 404 with nav + links; thrown errors show branded recovery page | Low |
| B4 | US locale cleanup | en-US dates; letterbox/colour/working-days; remove Indian toll-free; unify delivery copy; fix cart shipping contradiction; drop dead constant | `ProductPage.tsx`, `FreeSamples.tsx`, `samples/page.tsx`, `TopBar.tsx`, `FAQ.tsx`, `cart/page.tsx`, `types/index.ts`, policy pages | No British/Indian residue; one delivery promise everywhere | Low |
| B5 | Images | Remove `unoptimized`; compress top offenders to sized WebP; `priority`+`sizes` on hero | `next.config.ts`, `public/home/*`, `Hero.tsx`, `CategoryGrid.tsx` | Hero slide < 300 KB; Lighthouse LCP green on dev | Medium — visual regression check |
| B6 | Analytics | track lib, ingest API, DB schema, event wiring, webhooks, dashboard | new `lib/track.ts`, `api/track/`, `admin/analytics/`, webhooks, cart/PDP wiring | Events visible in dashboard after a dev walkthrough; purchase recorded from webhook test | Medium — new infra; degrade gracefully without `DATABASE_URL` |
| B7 | SEO | `sitemap.ts`, `robots.ts`, `metadataBase`, OG/Twitter, Product+Org+Breadcrumb JSON-LD, canonicals | `src/app/sitemap.ts`, `robots.ts`, `layout.tsx`, `product/[slug]/page.tsx` | Valid sitemap.xml/robots.txt; JSON-LD passes Rich Results test | Low |
| B8 | Landing/nav | Hero H1+CTA overlay; category labels; fix/remove dead "Shop by"; remove Roman Blinds suggestion | `Hero.tsx`, `CategoryGrid.tsx`, `navigation.ts`, `search/page.tsx` | Hero shows headline + button; every nav item navigates | Low |
| B9 | Buy Now | Buy Now button on PDP → direct draft-order checkout for the configured item; mount `StickyBottomBar` on mobile | `ProductPage.tsx`, `StickyBottomBar.tsx`, `cart or checkout helper` | Buy Now creates checkout + redirects without touching cart; sticky bar on mobile scroll | Medium — shares validation with add-to-cart |

Dependencies: B6 before/with B1+B9 (events fired from those paths); B5 independent; B7 independent; B2/B3/B4/B8 independent.

---

# Part 15 — Prioritized Backlog

**P0 (Phase 1 — implemented):**
1. Re-enable image optimization + compress heroes (B5) — *very high impact, low complexity*
2. Hero headline/subhead/CTA (B8) — *high, low*
3. Disabled-CTA explanations (B2) — *high, low*
4. First-party analytics + dashboard (B6) — *high enabling, medium*
5. Buy Now + sticky mobile CTA (B9) — *high, medium*
6. Checkout resilience (B1) — *medium, medium*
7. SEO foundation (B7) — *medium compounding, low*
8. 404/error/loading pages (B3) — *medium, low*
9. Nav dead links, category labels, search suggestion (B8) — *medium, low*
10. US locale cleanup (B4) — *medium, low*

**P1 (Phase 2):** PDP metafield content tabs; warranty + sample modules on PDP; "from $X" card pricing; delivery-promise unification (one number everywhere); contact form; /faq page; guides linked from PDP.

**P2 (Phase 3):** mini-cart drawer; zoom/lightbox; cart cross-sell; home testimonials; footer payment icons; samples-flow simplification; measurement-guarantee messaging *(business decision)*.

**P3 (Phases 4–6):** PDP server/client split; remaining asset compression; scroll/exit tracking + alerting; attribute-based filters; search autocomplete; T&C renumbering + manufacturing-claims reconciliation *(business decision)*; accessibility pass.

**Owner actions (not code):** verify `NEXT_PUBLIC_SHOPIFY_SHOP_ID` + `DATABASE_URL` in production env; confirm `FINAL10` exists as a Shopify discount; confirm `free-sample` tags on products intended for sampling; decide on promo-mechanics replacement (documented risk, Part 5); reconcile T&C §30 vs "Made in Texas"; begin collecting genuine customer reviews for Phase 2/3 display.

---

# Part 16 — Final Report

## Executive CRO Report

**Summary.** The store is mechanically capable of taking an order — checkout works, pricing is rigorous, policies and guides are real — but almost nothing about the visitor-facing experience *asks for the sale*. Visitors land on a multi-megabyte wordless slideshow, browse unlabeled categories, meet a configurator that goes silent when it needs input, and buy — if at all — without ever being shown the warranty, the samples, or a delivery date. Meanwhile the funnel is unmeasured from cart onward, so none of this was visible in data.

**Key findings & evidence.** (1) Catastrophic image weight from `images.unoptimized: true` + 5–8 MB heroes (`next.config.ts:30`, `public/home/`). (2) No stated value proposition — hero copy exists only as alt text (`Hero.tsx:11-29`). (3) Configurator blocks silently (`ProductPage.tsx:713`). (4) No begin_checkout/purchase tracking (`cart/page.tsx:120-126`, `orders-paid/route.ts:12`). (5) Discovery dead-ends (`navigation.ts:54-60`, `search/page.tsx:144-156`, no `not-found.tsx`). (6) Trust assets exist but are invisible at decision points; locale inconsistencies (British/Indian residue) undercut the US brand story. (7) Promo mechanics carry documented legal/trust risk (owner-acknowledged, unchanged).

**Expected business impact of Phase 1.** Realistic path from 0% to a measurable baseline: page-weight + hero + configurator fixes should get meaningfully more visitors to configured products; Buy Now + sticky CTA shortens the path to payment; analytics makes week-two iteration possible. A 1–2% conversion rate on current traffic (~36–72 orders per 3,600 visitors) is a reasonable 60–90-day target after Phases 1–2, assuming traffic quality is sound — which the new UTM/source reporting will verify.

## Implementation Plan

Phases 1–6 (Part 13), batches B1–B9 (Part 14), backlog P0–P3 (Part 15).

**Validation checklist:** `npm run lint` + `npm run build` green; dev walkthrough home → collection → PDP → configure → Buy Now/checkout redirect; branded 404; sitemap.xml + robots.txt served; JSON-LD passes Rich Results; events land in `/admin/analytics`; no copy/locale regressions on samples and policy pages.

**Success metrics (dashboard, weekly):** visitor→PDP rate, PDP→add-to-cart rate, add-to-cart→begin-checkout rate, begin-checkout→purchase rate, checkout_error count (target 0), LCP on home/PDP (target < 2.5s mobile), organic impressions (Search Console, post-sitemap).
