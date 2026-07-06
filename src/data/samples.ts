import type { Product, ProductVariant } from '@/types';

/**
 * Maximum number of free fabric samples a customer can request at once.
 * Matches the "Order up to 10 FREE fabric samples" copy in the home section.
 */
export const MAX_FREE_SAMPLES = 10;

/**
 * Shopify tag that marks a product as offering free fabric samples. Add this tag
 * in Shopify admin to any product whose colour swatches should be sample-eligible.
 */
export const FREE_SAMPLE_TAG = 'free-sample';

/**
 * localStorage key for the (analytics-free) sample basket. Kept fully separate from
 * the priced cart ('cart') so the two flows never cross-contaminate.
 */
export const SAMPLE_STORAGE_KEY = 'sample-basket';

/**
 * Whether a product offers free samples. Derived from Shopify tags, which are
 * already carried through to the client `Product` (see `transformProduct`).
 */
export function isSampleEligible(product: Pick<Product, 'tags'>): boolean {
  return product.tags.some((tag) => tag.toLowerCase() === FREE_SAMPLE_TAG);
}

/**
 * Resolve the colour option (name + value) from a variant, preferring an option
 * literally named "Color"/"Colour" and falling back to the first option/title.
 */
export function getVariantColorOption(variant: ProductVariant): { name: string; value: string } {
  const colorOption =
    variant.selectedOptions.find((option) => /colou?r/i.test(option.name)) ??
    variant.selectedOptions[0];

  return {
    name: colorOption?.name ?? 'Color',
    value: colorOption?.value ?? variant.title,
  };
}
