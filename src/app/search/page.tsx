'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TopBar, Header, NavBar, Footer } from '@/components';
import { transformProduct, extractFilterOptions } from '@/lib/api';
import { Product, ApiProduct } from '@/types';
import CategoryHero from '@/components/collection/CategoryHero';
import ProductGridWithFilters from '@/components/collection/ProductGridWithFilters';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ colors: string[]; patterns: string[] }>({ colors: [], patterns: [] });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setProducts([]);
        setFilterOptions({ colors: [], patterns: [] });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Use fetch directly for client-side search
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const queryParams = new URLSearchParams();
        queryParams.append('limit', '500');
        queryParams.append('search', query);
        
        const response = await fetch(`${API_BASE_URL}/api/products?${queryParams.toString()}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        let apiProducts = data.data || [];
        
        // If backend doesn't support search, filter client-side
        const queryLower = query.toLowerCase();
        const filteredProducts = apiProducts.filter((product: ApiProduct) => {
          const titleMatch = product.title.toLowerCase().includes(queryLower);
          const descriptionMatch = product.description?.toLowerCase().includes(queryLower);
          const categoryMatch = product.categories.some(cat => 
            cat.name.toLowerCase().includes(queryLower) || 
            cat.slug.toLowerCase().includes(queryLower)
          );
          const tagMatch = product.tags.some(tag => 
            tag.name.toLowerCase().includes(queryLower) || 
            tag.slug.toLowerCase().includes(queryLower)
          );
          return titleMatch || descriptionMatch || categoryMatch || tagMatch;
        });
        
        const transformedProducts = filteredProducts.map(transformProduct);
        setProducts(transformedProducts);
        setFilterOptions(extractFilterOptions(filteredProducts));
      } catch (error) {
        console.error('Error searching products:', error);
        setProducts([]);
        setFilterOptions({ colors: [], patterns: [] });
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <TopBar />
        <Header />
        <NavBar />
      </header>

      <main>
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-20 py-6 md:py-8">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search for blinds, colors, styles..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-[#00473c] focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#00473c] text-white rounded-md font-medium hover:bg-[#003830] transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {query && (
          <>
            <CategoryHero
              title={`Search Results for "${query}"`}
              description={loading ? 'Searching...' : `Found ${products.length} product${products.length !== 1 ? 's' : ''}`}
              productCount={products.length}
            />

            <div className="px-4 md:px-6 lg:px-20 py-8 md:py-12">
              <div className="max-w-[1400px] mx-auto">
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00473c]"></div>
                    <p className="mt-4 text-gray-600">Searching products...</p>
                  </div>
                ) : products.length > 0 ? (
                  <ProductGridWithFilters
                    products={products}
                    filterOptions={filterOptions}
                    categoryName={`Search: ${query}`}
                  />
                ) : (
                  <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">Try searching with different keywords or browse our collections.</p>
                    <a
                      href="/collections"
                      className="inline-block px-4 py-2 bg-[#00473c] text-white rounded-md text-sm font-medium hover:bg-[#003830]"
                    >
                      Browse All Products
                    </a>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!query && (
          <div className="px-4 md:px-6 lg:px-20 py-16">
            <div className="max-w-[1400px] mx-auto text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Search Products</h2>
              <p className="text-gray-600 mb-8">Enter a search term above to find the perfect blinds for your home.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <a href="/collections/vertical-blinds" className="p-4 bg-white rounded-lg border border-gray-200 hover:border-[#00473c] transition-colors">
                  <p className="text-sm font-medium text-gray-900">Vertical Blinds</p>
                </a>
                <a href="/collections/roller-blinds" className="p-4 bg-white rounded-lg border border-gray-200 hover:border-[#00473c] transition-colors">
                  <p className="text-sm font-medium text-gray-900">Roller Blinds</p>
                </a>
                <a href="/collections/roman-blinds" className="p-4 bg-white rounded-lg border border-gray-200 hover:border-[#00473c] transition-colors">
                  <p className="text-sm font-medium text-gray-900">Roman Blinds</p>
                </a>
                <a href="/collections" className="p-4 bg-white rounded-lg border border-gray-200 hover:border-[#00473c] transition-colors">
                  <p className="text-sm font-medium text-gray-900">All Products</p>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00473c]"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

