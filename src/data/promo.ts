// ============================================
// Site-wide promotional configuration
// ============================================
// Single source of truth for the active offer so the coupon code, discount, and
// sale framing read identically across the announcement bar, home sections, product
// pages, and FAQ. The FINAL10 code must also exist as a real discount in Shopify.

/** The customer-facing coupon code (must match the Shopify discount exactly). */
export const PROMO_CODE = 'FINAL10';

/** Newsletter signup popup coupon code (must also exist as a real discount in Shopify). */
export const SUBSCRIBE_POPUP_CODE = 'SUBSCRIBE10';

/** Discount the subscribe popup code applies, as a percentage. */
export const SUBSCRIBE_POPUP_PERCENT = 10;

/** Extra discount the code applies, as a percentage. */
export const PROMO_CODE_PERCENT = 10;

/** Headline "up to" sale depth used in banner/section copy. */
export const SALE_MAX_PERCENT = 60;

/** Short reusable copy fragments. */
export const PROMO_HEADLINE = `Up to ${SALE_MAX_PERCENT}% Off`;
export const PROMO_CODE_LINE = `Extra ${PROMO_CODE_PERCENT}% off with code ${PROMO_CODE}`;
export const PROMO_FULL_LINE = `${PROMO_HEADLINE} + Extra ${PROMO_CODE_PERCENT}% off with code ${PROMO_CODE}`;

/**
 * Countdown deadline. The offer does not truly expire — this returns the upcoming
 * local midnight so the timer always shows "time left today" and resets each day,
 * creating recurring urgency without a dishonest fixed end date.
 */
export function getNextMidnight(now: Date = new Date()): Date {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0); // rolls to 00:00:00 tomorrow
  return next;
}
