import { TopBar, Header, NavBar, Footer } from '@/components';
import { CategoryHero, CollectionFilters, CollectionProductGrid } from '@/components/collection';
import { fetchAllProducts } from '@/lib/api';
import { mapProductDataToProduct } from '@/lib/productMapper';
import { mapFilterToTagSlugs } from '@/lib/tagMapper';
import { getAllFrontendCategories, getFrontendCategoryBySlug, mapDbCategoryToFrontend } from '@/lib/categoryMapper';
import { Product } from '@/types/product';

export async function generateStaticParams() {
  const frontendCategories = getAllFrontendCategories();
  return frontendCategories.map((category) => ({
    category: category.slug,
  }));
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category } = await params;
  const filters = await searchParams;

  const frontendCategory = getFrontendCategoryBySlug(category);
  const categoryName = frontendCategory?.name || category;

  const pattern = filters.pattern;
  const color = filters.color;
  const window = filters.window;
  const room = filters.room;
  const solution = filters.solution;

  const tagSlugs: string[] = [];
  
  if (pattern && typeof pattern === 'string') {
    tagSlugs.push(...mapFilterToTagSlugs('pattern', pattern));
  }
  if (color && typeof color === 'string') {
    tagSlugs.push(...mapFilterToTagSlugs('color', color));
  }
  if (window && typeof window === 'string') {
    tagSlugs.push(...mapFilterToTagSlugs('window', window));
  }
  if (room && typeof room === 'string') {
    tagSlugs.push(...mapFilterToTagSlugs('room', room));
  }
  if (solution && typeof solution === 'string') {
    tagSlugs.push(...mapFilterToTagSlugs('solution', solution));
  }

  const uniqueTagSlugs = [...new Set(tagSlugs)];

  let filteredProducts: Product[] = [];
  try {
    const response = await fetchAllProducts({ 
      limit: 1000,
      tags: uniqueTagSlugs.length > 0 ? uniqueTagSlugs : undefined,
    });
    
    if (frontendCategory) {
      filteredProducts = response.data
        .filter((data) => {
          return data.categories.some((dbCategory) => {
            const mappedSlug = mapDbCategoryToFrontend(dbCategory.name, dbCategory.slug);
            return mappedSlug === frontendCategory.slug;
          });
        })
        .map((data) => mapProductDataToProduct(data));
    } else {
      filteredProducts = response.data.map((data) => mapProductDataToProduct(data));
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    filteredProducts = [];
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <TopBar />
        <Header />
        <NavBar />
      </header>

      {/* Hero Section */}
      <CategoryHero category={categoryName || category} productCount={filteredProducts.length} />

      {/* Main Collection Page */}
      <div className="min-h-screen bg-gray-50">
        {/* Main Content Area */}
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8">
            {/* Left Sidebar - Filters (Desktop) */}
            <aside className="w-full lg:w-72 shrink-0 hidden lg:block">
              <div className="sticky top-24">
                <CollectionFilters 
                  currentCategory={category}
                  activeFilters={{
                    pattern: typeof pattern === 'string' ? pattern : undefined,
                    color: typeof color === 'string' ? color : undefined,
                    window: typeof window === 'string' ? window : undefined,
                    room: typeof room === 'string' ? room : undefined,
                    solution: typeof solution === 'string' ? solution : undefined,
                  }}
                />
              </div>
            </aside>

            {/* Right Content - Products */}
            <main className="flex-1 min-w-0">
              <CollectionProductGrid 
                products={filteredProducts}
                currentCategory={category}
                activeFilters={{
                  pattern: typeof pattern === 'string' ? pattern : undefined,
                  color: typeof color === 'string' ? color : undefined,
                }}
              />
            </main>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}
