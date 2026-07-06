import { TopBar, Header, NavBar, Footer } from '@/components';
import { fetchProductsByCategory, transformProduct } from '@/lib/api';
import { isSampleEligible, getVariantColorOption } from '@/data/samples';
import {
  COLLECTION_DISPLAY_NAMES,
  NAVIGATION_SLUG_MAPPING,
  NAVIGATION_TAG_FILTERS,
  NAVIGATION_CATEGORY_FILTERS,
} from '@/data/navigation';
import { Product, SampleCategory, SampleProduct, SampleVariantOption } from '@/types';
import SampleBrowser from '@/components/samples/SampleBrowser';

export const metadata = {
  title: 'Order Free Fabric Samples | Your Next Blinds',
  description:
    'Order up to 10 free fabric samples, delivered straight through your letterbox. See how our colours look in your home before you buy.',
};

export const revalidate = 3_600;

/**
 * The website's own browsable collections (from the NavBar) that we group samples
 * under — NOT the raw Shopify product categories. Each entry maps to a
 * /collections/[slug] page, and products are matched with the exact same
 * category+tag logic those pages use. "Shop by feature/room" are filtered views
 * rather than real collections, so they are intentionally excluded.
 */
const SAMPLE_COLLECTION_SLUGS = [
  'light-filtering-vertical-blinds',
  'blackout-vertical-blinds',
  'waterproof-blackout-vertical-blinds',
  'light-filtering-roller-shades',
  'blackout-roller-shades',
  'waterproof-blackout-roller-shades',
  'dual-zebra-shades',
  'motorised-roller-shades',
  'motorised-dual-zebra-shades',
] as const;

/**
 * Shopify gives a product with no real options a single variant literally titled
 * "Default Title". Such a variant is not a real colour choice — we surface it as a
 * single "whole product" sample using the PRODUCT name instead (fixing the bug
 * where the swatch showed "Default Title").
 */
function isDefaultTitle(value: string | null | undefined): boolean {
  return !value || value.trim().toLowerCase() === 'default title';
}

/** Build a single SampleProduct (with its swatches) from a transformed product. */
function toSampleProduct(product: Product, categoryName: string): SampleProduct | null {
  const allVariants = product.variants ?? [];
  const productImage = product.images[0] ?? null;

  // Real colour variants: have a swatch image and a non-"Default Title" name.
  const realVariants: SampleVariantOption[] = [];
  const seen = new Set<string>();
  for (const variant of allVariants) {
    const option = getVariantColorOption(variant);
    if (isDefaultTitle(variant.title) && isDefaultTitle(option.value)) continue;
    if (!variant.image) continue;
    if (seen.has(variant.id)) continue;
    seen.add(variant.id);
    realVariants.push({
      variantId: variant.id,
      label: option.value,
      image: variant.image ?? null,
    });
  }

  if (realVariants.length > 0) {
    return {
      handle: product.slug,
      title: product.name,
      category: categoryName,
      image: realVariants[0].image ?? productImage,
      hasVariants: true,
      variants: realVariants,
    };
  }

  // No real variants — offer a single whole-product sample. Shopify still has one
  // variant (the "Default Title" one); use its GID but the product name.
  const soleVariant = allVariants[0];
  if (!soleVariant) return null; // nothing orderable
  return {
    handle: product.slug,
    title: product.name,
    category: categoryName,
    image: soleVariant.image ?? productImage,
    hasVariants: false,
    variants: [
      {
        variantId: soleVariant.id,
        label: product.name,
        image: soleVariant.image ?? productImage,
      },
    ],
  };
}

/**
 * Group sample-eligible products under the website's own collections, matching
 * products the same way each /collections/[slug] page does.
 */
async function buildCategories(): Promise<SampleCategory[]> {
  const categories = await Promise.all(
    SAMPLE_COLLECTION_SLUGS.map(async (slug) => {
      const backendSlug = NAVIGATION_SLUG_MAPPING[slug] ?? slug;
      const requiredTags = NAVIGATION_TAG_FILTERS[slug];
      const requiredCategories = NAVIGATION_CATEGORY_FILTERS[slug];
      const name = COLLECTION_DISPLAY_NAMES[slug] ?? slug;

      let apiProducts: Awaited<ReturnType<typeof fetchProductsByCategory>> = [];
      try {
        apiProducts = await fetchProductsByCategory(backendSlug, requiredTags, requiredCategories);
      } catch (error) {
        console.error(`Error fetching sample products for "${slug}":`, error);
      }

      const products = apiProducts
        .map(transformProduct)
        .filter(isSampleEligible)
        .map((product) => toSampleProduct(product, name))
        .filter((p): p is SampleProduct => p !== null)
        .sort((a, b) => a.title.localeCompare(b.title));

      return { name, productCount: products.length, products } satisfies SampleCategory;
    })
  );

  // Drop empty collections so the picker only shows categories with samples.
  return categories.filter((category) => category.productCount > 0);
}

export default async function SamplesPage() {
  let categories: SampleCategory[] = [];

  try {
    categories = await buildCategories();
  } catch (error) {
    console.error('Error building sample categories:', error);
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <TopBar />
        <Header />
        <NavBar />
      </header>

      <main className="px-4 py-8 md:px-6 md:py-12 lg:px-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 max-w-2xl">
            <h1 className="text-2xl font-medium tracking-tight text-[#3a3a3a] md:text-3xl lg:text-4xl">
              Order Free Fabric Samples
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#484848] md:text-base">
              Feel the quality and see the true colour before you buy. Choose up to 10 free
              swatches and we&apos;ll post them straight through your letterbox — completely free.
            </p>
          </div>

          {categories.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              Free samples aren&apos;t available right now. Please check back soon.
            </p>
          ) : (
            <SampleBrowser categories={categories} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
