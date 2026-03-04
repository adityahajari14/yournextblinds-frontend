'use client';

import { useState, useMemo } from 'react';
import { Product } from '@/types';
import { ProductCard } from '@/components/product';

interface FilterOptions {
  colors: string[];
  patterns: string[];
}

interface ProductGridWithFiltersProps {
  products: Product[];
  filterOptions: FilterOptions;
  categoryName: string;
  preselectedMotorization?: boolean;
}

type SortOption = 'best-selling' | 'price-low' | 'price-high' | 'name-az' | 'name-za';

export default function ProductGridWithFilters({ 
  products, 
  filterOptions,
  categoryName,
  preselectedMotorization = false,
}: ProductGridWithFiltersProps) {
  // Filter state
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('best-selling');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  // Color display names with hex values
  const colorMap: Record<string, { name: string; hex: string }> = {
    white: { name: 'White', hex: '#FFFFFF' },
    black: { name: 'Black', hex: '#1a1a1a' },
    grey: { name: 'Grey', hex: '#808080' },
    gray: { name: 'Grey', hex: '#808080' },
    blue: { name: 'Blue', hex: '#3B82F6' },
    red: { name: 'Red', hex: '#EF4444' },
    green: { name: 'Green', hex: '#10B981' },
    yellow: { name: 'Yellow', hex: '#FCD34D' },
    orange: { name: 'Orange', hex: '#F97316' },
    pink: { name: 'Pink', hex: '#EC4899' },
    purple: { name: 'Purple', hex: '#8B5CF6' },
    brown: { name: 'Brown', hex: '#8B4513' },
    beige: { name: 'Beige', hex: '#F5F5DC' },
    cream: { name: 'Cream', hex: '#FFFDD0' },
    ivory: { name: 'Ivory', hex: '#FFFFF0' },
    silver: { name: 'Silver', hex: '#C0C0C0' },
    gold: { name: 'Gold', hex: '#FFD700' },
  };

  // Pattern display names
  const patternMap: Record<string, string> = {
    floral: 'Floral',
    striped: 'Striped',
    geometric: 'Geometric',
    abstract: 'Abstract',
    animal: 'Animal',
    wood: 'Wood Finish',
    plain: 'Plain',
    solid: 'Solid',
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by colors (check product name for color keywords)
    if (selectedColors.length > 0) {
      result = result.filter((product) => {
        const productName = product.name.toLowerCase();
        return selectedColors.some((color) => productName.includes(color));
      });
    }

    // Filter by patterns (check product name for pattern keywords)
    if (selectedPatterns.length > 0) {
      result = result.filter((product) => {
        const productName = product.name.toLowerCase();
        return selectedPatterns.some((pattern) => productName.includes(pattern));
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // best-selling - keep original order
        break;
    }

    return result;
  }, [products, selectedColors, selectedPatterns, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
    setVisibleCount(24);
  };

  const togglePattern = (pattern: string) => {
    setSelectedPatterns((prev) =>
      prev.includes(pattern) ? prev.filter((p) => p !== pattern) : [...prev, pattern]
    );
    setVisibleCount(24);
  };

  const clearAllFilters = () => {
    setSelectedColors([]);
    setSelectedPatterns([]);
    setVisibleCount(24);
  };

  const hasActiveFilters = selectedColors.length > 0 || selectedPatterns.length > 0;

  // Filter sidebar content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Active Filters</h3>
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#00473c] hover:underline"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedColors.map((color) => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                className="flex items-center gap-1 px-2 py-1 bg-[#00473c]/10 text-[#00473c] text-xs rounded-full"
              >
                <span>{colorMap[color]?.name || color}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
            {selectedPatterns.map((pattern) => (
              <button
                key={pattern}
                onClick={() => togglePattern(pattern)}
                className="flex items-center gap-1 px-2 py-1 bg-[#00473c]/10 text-[#00473c] text-xs rounded-full"
              >
                <span>{patternMap[pattern] || pattern}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Filter */}
      {filterOptions.colors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Color</h3>
          <div className="grid grid-cols-5 gap-2">
            {filterOptions.colors.map((color) => {
              const colorInfo = colorMap[color];
              const isSelected = selectedColors.includes(color);
              return (
                <button
                  key={color}
                  onClick={() => toggleColor(color)}
                  className="group relative"
                  title={colorInfo?.name || color}
                >
                  <div
                    className={`w-8 h-8 rounded-full transition-all border ${
                      isSelected 
                        ? 'ring-2 ring-[#00473c] ring-offset-1 scale-110' 
                        : 'hover:scale-105 border-gray-200'
                    }`}
                    style={{ backgroundColor: colorInfo?.hex || '#ccc' }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pattern Filter */}
      {filterOptions.patterns.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pattern</h3>
          <div className="space-y-2">
            {filterOptions.patterns.map((pattern) => {
              const isSelected = selectedPatterns.includes(pattern);
              return (
                <button
                  key={pattern}
                  onClick={() => togglePattern(pattern)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <div className={`w-4 h-4 rounded border transition-colors ${
                    isSelected ? 'bg-[#00473c] border-[#00473c]' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{patternMap[pattern] || pattern}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="bg-white p-4 rounded-lg border border-gray-200 sticky top-24">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <FilterContent />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Toolbar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 mb-6">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 bg-[#00473c] text-white rounded-md text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-white text-[#00473c] text-xs font-bold px-1.5 py-0.5 rounded-full">
                {selectedColors.length + selectedPatterns.length}
              </span>
            )}
          </button>

          {/* Results count - hidden on mobile when filter button is shown */}
          <div className="hidden lg:block text-sm text-gray-600">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-600 hidden sm:block">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00473c]"
            >
              <option value="best-selling">Best Selling</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-az">Name: A to Z</option>
              <option value="name-za">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {displayedProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters to find what you're looking for.</p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-[#00473c] text-white rounded-md text-sm font-medium hover:bg-[#003830]"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    image: product.images[0],
                  }}
                  preselectedMotorization={preselectedMotorization}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 24)}
                  className="px-8 py-3 bg-white border-2 border-[#00473c] text-[#00473c] rounded-md font-medium hover:bg-[#00473c] hover:text-white transition-colors"
                >
                  Load More Products
                </button>
              </div>
            )}

            {/* Results Info */}
            <div className="text-center text-sm text-gray-600 mt-4">
              Showing {displayedProducts.length} of {filteredProducts.length} products
            </div>
          </>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-white z-50 overflow-y-auto lg:hidden shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <FilterContent />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-[#00473c] text-white rounded-md font-medium"
              >
                Show {filteredProducts.length} Products
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
