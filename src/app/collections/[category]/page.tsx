import { notFound } from 'next/navigation';
import { TopBar, Header, NavBar, Footer, FlashSale, FAQ } from '@/components';
import { fetchCategories, fetchProductsByCategory, transformProduct, extractFilterOptions } from '@/lib/api';
import { Product, ApiProduct } from '@/types';
import CategoryHero from '@/components/collection/CategoryHero';
import ProductGridWithFilters from '@/components/collection/ProductGridWithFilters';
import ComingSoon from '@/components/collection/ComingSoon';
import { ALL_COLLECTION_SLUGS, COLLECTION_DISPLAY_NAMES, NAVIGATION_SLUG_MAPPING } from '@/data/navigation';

interface PageProps {
  params: Promise<{ category: string }>;
}

// Generate static params from all possible collection slugs
export async function generateStaticParams() {
  // Combine backend categories with frontend-defined slugs
  const slugs = new Set(ALL_COLLECTION_SLUGS);

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

    // Then apply backend slug conversions (e.g., day-and-night-blinds -> day-night-blinds)
    const backendSlugMap: Record<string, string> = {
      'day-and-night-blinds': 'day-night-blinds', // Backend uses different format
    };
    
    return backendSlugMap[mappedSlug] || mappedSlug;
  };

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
  if (!isValidSlug && !backendCategory) {
    notFound();
  }

  // Get display name (use custom name from COLLECTION_DISPLAY_NAMES if available)
  const categoryName = COLLECTION_DISPLAY_NAMES[categorySlug] || backendCategory?.name ||
    categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const categoryDescription = backendCategory?.description ||
    `Explore our beautiful collection of ${categoryName.toLowerCase()} for your home.`;

  // Fetch products if we have a backend category
  let apiProducts: ApiProduct[] = [];
  let products: Product[] = [];

  if (backendCategory) {
    try {
      apiProducts = await fetchProductsByCategory(backendSlug);
      products = apiProducts.map(transformProduct);
    } catch (error) {
      // Silently fail during build - backend may be unavailable
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching products:', error);
      }
    }
  }

  // Extract filter options from products
  const filterOptions = extractFilterOptions(apiProducts);

  // Check if we should show coming soon (no backend category or no products)
  const showComingSoon = !backendCategory || products.length === 0;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <TopBar />
        <Header />
        <NavBar />
      </header>

      <main>
        <CategoryHero
          title={categoryName}
          description={categoryDescription}
          productCount={products.length}
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
