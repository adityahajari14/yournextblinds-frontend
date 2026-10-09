import { notFound } from 'next/navigation';
import { TopBar, Header, NavBar, Footer, FlashSale, FAQ } from '@/components';
import { fetchCategories, fetchProductsByCategory, fetchProductsForCuratedCollection, transformProduct, extractFilterOptions, isRealBuildPhase } from '@/lib/api';
import { Product, ApiProduct } from '@/types';
import CategoryHero from '@/components/collection/CategoryHero';
import ProductGridWithFilters from '@/components/collection/ProductGridWithFilters';
import ComingSoon from '@/components/collection/ComingSoon';
import { ALL_COLLECTION_SLUGS, COLLECTION_DISPLAY_NAMES, COLLECTION_DESCRIPTIONS, NAVIGATION_SLUG_MAPPING, NAVIGATION_TAG_FILTERS, NAVIGATION_CATEGORY_FILTERS } from '@/data/navigation';
import { CURATED_COLLECTION_SLUGS, getCuratedCollection } from '@/data/curatedCollections';
import { HONEYCOMB_CELLULAR_COLLECTION_SLUG } from '@/data/honeycombCellular';
import {
  HONEYCOMB_SUBCATEGORY_CARDS,
  HONEYCOMB_SUBCATEGORIES_BY_HANDLE,
} from '@/data/honeycombCellularCatalog';
import {
  HONEYCOMB_SUB_COLLECTION_SLUGS,
  getHoneycombSubCollection,
} from '@/data/honeycombSubCollections';
import type { CollectionContext } from '@/components/product/ProductCard';

interface PageProps {
  params: Promise<{ category: string }>;
}

export const revalidate = 3_600;

// Generate static params from all possible collection slugs
export async function generateStaticParams() {
  // Combine backend categories with frontend-defined slugs
  const slugs = new Set([
    ...ALL_COLLECTION_SLUGS,
    ...CURATED_COLLECTION_SLUGS,
    ...HONEYCOMB_SUB_COLLECTION_SLUGS,
  ]);

  try {
    const categories = await fetchCategories();
    categories.forEach((cat) => slugs.add(cat.slug));
  } catch (error) {
    // Silently fail during build - backend may be unavailable
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching categories for static params:', error);
    }
  }

  return Array.from(slugs).map((category) => ({ category }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { category } = await params;

  // Honeycomb / Cellular sub-collections (light filtering, blackout, cordless …)
  // own their copy just like curated collections.
  const honeycombSub = getHoneycombSubCollection(category);
  if (honeycombSub) {
    return {
      title: `${honeycombSub.title} | Your Next Blinds`,
      description: honeycombSub.description,
    };
  }

  // Curated collections own their copy and take precedence over the backend
  // category of the same handle (e.g. the empty `no-drill-blinds` collection).
  const curated = getCuratedCollection(category);
  if (curated) {
    return {
      title: `${curated.title} | Your Next Blinds`,
      description: curated.description,
    };
  }

  // Try to get name from backend categories first
  try {
    const categories = await fetchCategories();
    const categoryData = categories.find((c) => c.slug === category);

    if (categoryData) {
      return {
        title: `${categoryData.name} | Your Next Blinds`,
        description: categoryData.description || `Browse our collection of ${categoryData.name.toLowerCase()}. Find the perfect blinds for your home.`,
      };
    }
  } catch {
    // Fall through to use display names
  }

  // Use frontend display names
  const displayName = COLLECTION_DISPLAY_NAMES[category] || category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    title: `${displayName} | Your Next Blinds`,
    description: `Browse our collection of ${displayName.toLowerCase()}. Find the perfect blinds for your home.`,
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { category: categorySlug } = await params;

  // Map frontend slug to backend slug if needed
  const mapCategorySlug = (slug: string): string => {
    let mappedSlug = slug;
    
    // First, check if this is a custom navigation slug
    if (NAVIGATION_SLUG_MAPPING[slug]) {
      mappedSlug = NAVIGATION_SLUG_MAPPING[slug];
    }

    // Backend uses 'day-and-night-blinds' (with 'and'), no conversion needed
    return mappedSlug;
  };

  // Honeycomb / Cellular sub-collections (light filtering, blackout, cordless …)
  // are standalone pages carved out of the honeycomb family. Membership isn't in
  // Shopify tags, so they fetch the whole family via the parent curated
  // collection and are narrowed to `subCategoryId` below.
  const honeycombSub = getHoneycombSubCollection(categorySlug);

  // Curated collections (window type / feature / room) select products across
  // several Shopify collections at once, so they bypass the single-category
  // lookup below entirely — including where a same-named but empty backend
  // collection exists (`no-drill-blinds`).
  const curated = getCuratedCollection(categorySlug);

  // Which curated definition actually drives the product fetch — the honeycomb
  // parent for a sub-collection, otherwise this page's own curated collection.
  const productCurated = honeycombSub
    ? getCuratedCollection(HONEYCOMB_CELLULAR_COLLECTION_SLUG)
    : curated;

  // Validate the slug exists in our defined collections
  const isValidSlug = ALL_COLLECTION_SLUGS.includes(categorySlug);

  // Fetch categories from backend
  let backendCategories: Awaited<ReturnType<typeof fetchCategories>> = [];
  try {
    backendCategories = await fetchCategories();
  } catch (error) {
    // Silently fail during build - backend may be unavailable
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching categories:', error);
    }
  }

  // Find matching backend category using mapped slug
  const backendSlug = mapCategorySlug(categorySlug);
  const backendCategory = backendCategories.find((c) => c.slug === backendSlug);

  // If slug is not in our defined list AND not in backend, show 404
  if (!honeycombSub && !curated && !isValidSlug && !backendCategory) {
    notFound();
  }

  // Get display name (use custom name from COLLECTION_DISPLAY_NAMES if available)
  const categoryName = honeycombSub?.title || curated?.title || COLLECTION_DISPLAY_NAMES[categorySlug] || backendCategory?.name ||
    categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const categoryDescription = honeycombSub?.description
    ?? curated?.description
    ?? COLLECTION_DESCRIPTIONS[categorySlug]
    ?? backendCategory?.description
    ?? `Explore our beautiful collection of ${categoryName.toLowerCase()} for your home.`;

  // Fetch products if we have a backend category
  let apiProducts: ApiProduct[] = [];
  let products: Product[] = [];

  if (productCurated) {
    try {
      apiProducts = await fetchProductsForCuratedCollection(productCurated);

      // Narrow the honeycomb family down to this sub-collection. Membership is
      // in the generated catalogue, not Shopify tags.
      if (honeycombSub) {
        apiProducts = apiProducts.filter((p) =>
          HONEYCOMB_SUBCATEGORIES_BY_HANDLE[p.slug]?.includes(honeycombSub.subCategoryId)
        );
      }

      products = apiProducts.map(transformProduct);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching curated collection products:', error);
      }
      if (!isRealBuildPhase()) {
        throw error;
      }
    }
  } else if (backendCategory) {
    try {
      // Get required tags and categories for this navigation slug
      const requiredTags = NAVIGATION_TAG_FILTERS[categorySlug];
      const requiredCategories = NAVIGATION_CATEGORY_FILTERS[categorySlug];
      
      apiProducts = await fetchProductsByCategory(backendSlug, requiredTags, requiredCategories);
      products = apiProducts.map(transformProduct);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching products:', error);
      }
      // During the actual build compile, tolerate the failure and render an
      // empty page (ISR will regenerate it later). During runtime ISR, rethrow
      // so Next.js aborts and retries instead of caching a broken/empty page
      // (or one with $0 prices) for the whole revalidate window.
      if (!isRealBuildPhase()) {
        throw error;
      }
    }
  }

  // Extract filter options from products
  const filterOptions = extractFilterOptions(apiProducts);

  // Check if we should show coming soon (no backend category or no products)
  const showComingSoon = (!productCurated && !backendCategory) || products.length === 0;

  // Window-type and feature collections span several product families, so no
  // single photo represents them — they omit `heroImage` and `null` renders a
  // text-only hero. `undefined` keeps the existing title-lookup fallback.
  const heroImage = honeycombSub
    ? honeycombSub.heroImage
    : curated
      ? (curated.heroImage ?? null)
      : undefined;

  // Pre-select motorization when browsing motorised collections
  const preselectedMotorization =
    categorySlug === 'motorised-roller-shades' ||
    categorySlug === 'motorised-dual-zebra-shades' ||
    categorySlug === 'motorised-eclipsecore' ||
    honeycombSub?.card.preselect === 'motorized';

  // The cordless honeycomb sub-collection carries its control choice through to the PDP.
  const preselectedControlOption =
    honeycombSub?.card.preselect === 'cordless' ? 'hc-cordless' : undefined;

  // The No Drill honeycomb sub-collection pre-checks the "Upgrade to No Drill System" option.
  const preselectedNoDrillUpgrade = honeycombSub?.subCategoryId === 'no-drill';

  // Collection context for Band F roller shades: controls name prefix and room darkening preselection
  const collectionContext: CollectionContext =
    categorySlug === 'light-filtering-roller-shades' ? 'light-filtering' :
    categorySlug === 'blackout-roller-shades' || categorySlug === 'blackout-roller-shades-category' ? 'blackout' :
    undefined;

  // The "Shop by type" cards appear only on the honeycomb family page and link
  // out to the standalone sub-collection pages. They are NOT shown on the
  // sub-collection pages themselves. The parent "all" card is dropped — this
  // family page is itself the "all" view.
  const subCategories =
    categorySlug === HONEYCOMB_CELLULAR_COLLECTION_SLUG
      ? HONEYCOMB_SUBCATEGORY_CARDS.filter((c) => c.id !== 'all')
      : undefined;
  const activeSubCategoryId = honeycombSub?.subCategoryId ?? 'all';

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        {/* <TopBar /> */}
        <Header />
        <NavBar />
      </header>

      <main>
        <CategoryHero
          title={categoryName}
          description={categoryDescription}
          productCount={products.length}
          image={heroImage}
        />

        <div className="px-4 md:px-6 lg:px-20 py-8 md:py-12">
          <div className="max-w-[1400px] mx-auto">
            {showComingSoon ? (
              <ComingSoon categoryName={categoryName} />
            ) : (
              <ProductGridWithFilters
                products={products}
                filterOptions={filterOptions}
                categoryName={categoryName}
                preselectedMotorization={preselectedMotorization}
                preselectedControlOption={preselectedControlOption}
                preselectedNoDrillUpgrade={preselectedNoDrillUpgrade}
                collectionContext={collectionContext}
                subCategories={subCategories}
                activeSubCategoryId={activeSubCategoryId}
              />
            )}
          </div>
        </div>

        <FlashSale />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
