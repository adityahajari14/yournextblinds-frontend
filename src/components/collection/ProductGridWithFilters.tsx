'use client';

import { useState, useMemo } from 'react';
import { Product } from '@/types';
import { ProductCard } from '@/components/product';
import type { CollectionContext } from '@/components/product/ProductCard';
import SubCategoryCards from './SubCategoryCards';
import { FitGuaranteeBadge } from '@/components/fit-guarantee';
import type { HoneycombSubCategoryCard } from '@/data/honeycombCellularCatalog';

interface FilterOptions {
  colors: string[];
  patterns: string[];
}

interface ProductGridWithFiltersProps {
  products: Product[];
  filterOptions: FilterOptions;
  categoryName: string;
  preselectedMotorization?: boolean;
  /** Passed through to each ProductCard as the pre-selected control option (e.g. 'hc-cordless'). */
  preselectedControlOption?: string;
  /** Honeycomb Cellular only: pre-check the "Upgrade to No Drill System" option on each ProductCard. */
  preselectedNoDrillUpgrade?: boolean;
  collectionContext?: CollectionContext;
  /**
   * Optional sub-category cards shown above the grid. Each card links to its own
   * standalone collection page — `products` is already narrowed to the active
   * sub-category server-side, so these no longer filter the grid in place.
   */
  subCategories?: HoneycombSubCategoryCard[];
  /** Sub-category id of the page being viewed, used only to highlight its card. */
  activeSubCategoryId?: string;
}

type SortOption = 'best-selling' | 'price-low' | 'price-high' | 'name-az' | 'name-za';

// Opacity/light-control isn't tagged on products (color/pattern come from
// tags via extractFilterOptions), but it's reliably in the product name for
// every collection that has more than one — e.g. "Lumina Room Darkening
// Cellular Honeycomb Shade", "Blackout Roller Shade". Computed from the
// products actually in this collection rather than hardcoded, so a phrase
// only shows up as a filter when it would actually narrow something down.
const OPACITY_PHRASES = ['Light Filtering', 'Room Darkening', 'Blackout'];

// Colour filter taxonomy. Product colours live in the variant option values
// (e.g. "Lumina Warm Taupe", "Lumina Navy Charcoal Blackout"), not in tags, so
// the filter groups those free-text names into a handful of families. A single
// name can land in more than one family ("Navy Charcoal" → Blue + Charcoal) —
// that's intentional, it just makes the product show under both filters.
const COLOR_FAMILY_ORDER = [
  'White', 'Cream', 'Beige', 'Taupe', 'Greige', 'Gold', 'Yellow', 'Orange',
  'Red', 'Pink', 'Purple', 'Blue', 'Green', 'Grey', 'Brown', 'Charcoal', 'Black',
] as const;

const COLOR_FAMILY_HEX: Record<string, string> = {
  White: '#FFFFFF', Cream: '#EFE9D8', Beige: '#D9C6A3', Taupe: '#B29B84',
  Greige: '#A99E8D', Gold: '#C8A24A', Yellow: '#FCD34D', Orange: '#F97316',
  Red: '#C0392B', Pink: '#EC4899', Purple: '#8B5CF6', Blue: '#3B6EA5',
  Green: '#6B8E5A', Grey: '#9AA0A6', Brown: '#7A5230', Charcoal: '#454545',
  Black: '#1A1A1A',
};

const COLOR_FAMILY_KEYWORDS: Record<string, string[]> = {
  White: ['white', 'snow', 'chalk', 'arctic', 'cloud', 'paper', 'frost'],
  Cream: ['cream', 'buttercream', 'ivory', 'vanilla', 'linen', 'eggshell', 'pearl', 'alabaster', 'almond', 'buttermilk'],
  Beige: ['beige', 'sand', 'sandstone', 'tan', 'wheat', 'camel', 'oat', 'oatmeal', 'natural', 'khaki', 'driftwood', 'biscuit', 'parchment', 'putty'],
  Taupe: ['taupe', 'mushroom'],
  Greige: ['greige'],
  Gold: ['gold', 'brass'],
  Yellow: ['yellow', 'mustard', 'lemon'],
  Orange: ['orange', 'terracotta', 'rust', 'amber', 'apricot'],
  Red: ['red', 'crimson', 'burgundy', 'wine', 'ruby', 'scarlet'],
  Pink: ['pink', 'rose', 'blush', 'mauve'],
  Purple: ['purple', 'violet', 'plum', 'lavender', 'aubergine', 'eggplant'],
  Blue: ['blue', 'navy', 'indigo', 'denim', 'teal', 'azure', 'cobalt'],
  Green: ['green', 'sage', 'olive', 'moss', 'fern', 'forest', 'mint', 'eucalyptus', 'meadow'],
  Grey: ['grey', 'gray', 'silver', 'pewter', 'ash', 'slate', 'granite', 'fog', 'pebble', 'smoke', 'nickel', 'steel'],
  Brown: ['brown', 'walnut', 'oak', 'chestnut', 'espresso', 'mocha', 'coffee', 'cocoa', 'chocolate', 'mahogany', 'cinnamon', 'hazel', 'cognac', 'caramel', 'rustic', 'bronze', 'nutmeg', 'toffee'],
  Charcoal: ['charcoal', 'graphite', 'anthracite', 'gunmetal'],
  Black: ['black', 'onyx', 'ebony', 'jet', 'noir'],
};

// Match keywords on whole-word boundaries so "honey" doesn't match "honeycomb",
// "tan" doesn't match "metropolitan", etc.
const COLOR_FAMILY_MATCHERS: Array<{ family: string; re: RegExp }> = COLOR_FAMILY_ORDER.map(
  (family) => ({
    family,
    re: new RegExp(`\\b(${COLOR_FAMILY_KEYWORDS[family].join('|')})\\b`, 'i'),
  })
);

/** Every colour family a free-text colour string belongs to. */
function colorFamiliesOf(text: string): string[] {
  return COLOR_FAMILY_MATCHERS.filter((m) => m.re.test(text)).map((m) => m.family);
}

export default function ProductGridWithFilters({
  products,
  filterOptions,
  categoryName,
  preselectedMotorization = false,
  preselectedControlOption,
  preselectedNoDrillUpgrade = false,
  collectionContext,
  subCategories,
  activeSubCategoryId,
}: ProductGridWithFiltersProps) {
  // Filter state
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [selectedOpacities, setSelectedOpacities] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('best-selling');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  // Only surfaced when a collection actually has more than one opacity —
  // otherwise every product would match and the filter narrows nothing.
  const opacityOptions = useMemo(() => {
    const found = OPACITY_PHRASES.filter((phrase) =>
      products.some((product) => product.name.toLowerCase().includes(phrase.toLowerCase()))
    );
    return found.length > 1 ? found : [];
  }, [products]);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((product) => product.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  // Colour families present in this collection, derived from each product's
  // variant colour options (plus its name/tags for older tag-driven collections).
  const productColorFamilies = useMemo(() => {
    const byProductId = new Map<string, Set<string>>();
    for (const product of products) {
      const families = new Set<string>();
      const add = (text: string) => {
        for (const family of colorFamiliesOf(text)) families.add(family);
      };
      add(product.name);
      product.tags.forEach(add);
      for (const variant of product.variants ?? []) {
        const colorOption = variant.selectedOptions.find((o) => /colou?r/i.test(o.name));
        if (colorOption) add(colorOption.value);
      }
      byProductId.set(product.id, families);
    }
    return byProductId;
  }, [products]);

  const availableColors = useMemo(() => {
    const present = new Set<string>();
    for (const families of productColorFamilies.values()) {
      families.forEach((f) => present.add(f));
    }
    return COLOR_FAMILY_ORDER.filter((f) => present.has(f));
  }, [productColorFamilies]);

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

    // Filter by colour family (matches a product that has any variant in that family)
    if (selectedColors.length > 0) {
      result = result.filter((product) => {
        const families = productColorFamilies.get(product.id);
        return !!families && selectedColors.some((color) => families.has(color));
      });
    }

    // Filter by patterns (check product name for pattern keywords)
    if (selectedPatterns.length > 0) {
      result = result.filter((product) => {
        const productName = product.name.toLowerCase();
        return selectedPatterns.some((pattern) => productName.includes(pattern));
      });
    }

    // Filter by opacity/light control (check product name for the phrase)
    if (selectedOpacities.length > 0) {
      result = result.filter((product) => {
        const productName = product.name.toLowerCase();
        return selectedOpacities.some((opacity) => productName.includes(opacity.toLowerCase()));
      });
    }

    // Filter by price range
    const minPrice = priceMin ? parseFloat(priceMin) : null;
    const maxPrice = priceMax ? parseFloat(priceMax) : null;
    if (minPrice !== null && !Number.isNaN(minPrice)) {
      result = result.filter((product) => product.price >= minPrice);
    }
    if (maxPrice !== null && !Number.isNaN(maxPrice)) {
      result = result.filter((product) => product.price <= maxPrice);
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
  }, [
    products,
    productColorFamilies,
    selectedColors,
    selectedPatterns,
    selectedOpacities,
    priceMin,
    priceMax,
    sortBy,
  ]);

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

  const toggleOpacity = (opacity: string) => {
    setSelectedOpacities((prev) =>
      prev.includes(opacity) ? prev.filter((o) => o !== opacity) : [...prev, opacity]
    );
    setVisibleCount(24);
  };

  const clearAllFilters = () => {
    setSelectedColors([]);
    setSelectedPatterns([]);
    setSelectedOpacities([]);
    setPriceMin('');
    setPriceMax('');
    setVisibleCount(24);
  };

  const activeFilterCount =
    selectedColors.length +
    selectedPatterns.length +
    selectedOpacities.length +
    (priceMin !== '' || priceMax !== '' ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

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
                <span>{color}</span>
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
            {selectedOpacities.map((opacity) => (
              <button
                key={opacity}
                onClick={() => toggleOpacity(opacity)}
                className="flex items-center gap-1 px-2 py-1 bg-[#00473c]/10 text-[#00473c] text-xs rounded-full"
              >
                <span>{opacity}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
            {(priceMin !== '' || priceMax !== '') && (
              <button
                onClick={() => {
                  setPriceMin('');
                  setPriceMax('');
                }}
                className="flex items-center gap-1 px-2 py-1 bg-[#00473c]/10 text-[#00473c] text-xs rounded-full"
              >
                <span>
                  {priceMin || priceBounds.min} – {priceMax || priceBounds.max}
                </span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Color Filter */}
      {availableColors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Color</h3>
          <div className="space-y-2">
            {availableColors.map((color) => {
              const isSelected = selectedColors.includes(color);
              return (
                <button
                  key={color}
                  onClick={() => toggleColor(color)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <span
                    className={`w-4 h-4 rounded-full shrink-0 border transition-all ${
                      isSelected ? 'ring-2 ring-[#00473c] ring-offset-1 border-transparent' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: COLOR_FAMILY_HEX[color] ?? '#ccc' }}
                  />
                  <span className="text-sm text-gray-700">{color}</span>
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

      {/* Opacity Filter */}
      {opacityOptions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Light Control</h3>
          <div className="space-y-2">
            {opacityOptions.map((opacity) => {
              const isSelected = selectedOpacities.includes(opacity);
              return (
                <button
                  key={opacity}
                  onClick={() => toggleOpacity(opacity)}
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
                  <span className="text-sm text-gray-700">{opacity}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      {priceBounds.max > priceBounds.min && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Price</h3>
          <div className="flex items-center gap-2">
            {/* FilterContent renders twice (desktop sidebar + mobile drawer), so
                these use aria-label rather than a label[for] + id pair — a
                static id would collide between the two copies in the DOM. */}
            <div className="flex-1">
              <input
                type="number"
                inputMode="decimal"
                aria-label="Minimum price"
                min={priceBounds.min}
                max={priceBounds.max}
                placeholder={`$${priceBounds.min}`}
                value={priceMin}
                onChange={(e) => {
                  setPriceMin(e.target.value);
                  setVisibleCount(24);
                }}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00473c]"
              />
            </div>
            <span className="text-gray-400">–</span>
            <div className="flex-1">
              <input
                type="number"
                inputMode="decimal"
                aria-label="Maximum price"
                min={priceBounds.min}
                max={priceBounds.max}
                placeholder={`$${priceBounds.max}`}
                value={priceMax}
                onChange={(e) => {
                  setPriceMax(e.target.value);
                  setVisibleCount(24);
                }}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00473c]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {subCategories && subCategories.length > 0 && (
        <SubCategoryCards
          cards={subCategories}
          activeId={activeSubCategoryId ?? 'all'}
        />
      )}

      <FitGuaranteeBadge variant="strip" />

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
                {activeFilterCount}
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
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
              }}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 md:gap-6">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    image: product.images[0],
                  }}
                  preselectedMotorization={preselectedMotorization}
                  preselectedControlOption={preselectedControlOption}
                  preselectedNoDrillUpgrade={preselectedNoDrillUpgrade}
                  collectionContext={collectionContext}
                  layout="grid"
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
    </div>
  );
}
