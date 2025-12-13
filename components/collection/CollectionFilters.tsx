'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchAllProducts } from '@/lib/api';
import { getAllFrontendCategories, FrontendCategory, mapDbCategoryToFrontend } from '@/lib/categoryMapper';

interface CategoryWithCount extends FrontendCategory {
  count: number;
}

interface CollectionFiltersProps {
  currentCategory: string;
  activeFilters: {
    pattern?: string;
    color?: string;
    window?: string;
    room?: string;
    solution?: string;
  };
}

export default function CollectionFilters({ currentCategory, activeFilters }: CollectionFiltersProps) {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategoryCounts = async () => {
      try {
        const response = await fetchAllProducts({ limit: 1000 });
        const frontendCategories = getAllFrontendCategories();
        
        const categoryCounts: Record<string, number> = {};
        frontendCategories.forEach(cat => {
          categoryCounts[cat.slug] = 0;
        });

        response.data.forEach((product) => {
          product.categories.forEach((dbCategory) => {
            const frontendSlug = mapDbCategoryToFrontend(dbCategory.name, dbCategory.slug);
            if (frontendSlug && categoryCounts[frontendSlug] !== undefined) {
              categoryCounts[frontendSlug]++;
            }
          });
        });

        const categoriesWithCounts: CategoryWithCount[] = frontendCategories.map(cat => ({
          ...cat,
          count: categoryCounts[cat.slug] || 0,
        }));

        setCategories(categoriesWithCounts);
      } catch (error) {
        console.error('Error fetching category counts:', error);
        setCategories(getAllFrontendCategories().map(cat => ({ ...cat, count: 0 })));
      } finally {
        setLoading(false);
      }
    };

    loadCategoryCounts();
  }, []);

  const buildFilterUrl = (filterType: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValue = params.get(filterType);
    
    if (currentValue === value) {
      params.delete(filterType);
    } else {
      params.set(filterType, value);
    }
    
    return `/collections/${currentCategory}${params.toString() ? `?${params.toString()}` : ''}`;
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('pattern');
    params.delete('color');
    params.delete('window');
    params.delete('room');
    params.delete('solution');
    return `/collections/${currentCategory}${params.toString() ? `?${params.toString()}` : ''}`;
  };

  const patterns = [
    'Abstract',
    'Animal',
    'Geometric',
    'Striped',
    'Medium Wood',
    'Light Wood',
  ];

  const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Yellow', hex: '#FCD34D' },
    { name: 'Gold', hex: '#D97706' },
    { name: 'Grey', hex: '#6B7280' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Pink', hex: '#EC4899' },
  ];

  return (
    <div className="space-y-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      {/* Category Filter */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Category</h3>
        {loading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-gray-100 animate-pulse rounded"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {categories.map((category) => {
              const isActive = currentCategory === category.slug;
              return (
                <Link
                  key={category.slug}
                  href={`/collections/${category.slug}`}
                  className={`flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-xs text-gray-400">
                    {category.count}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Pattern Filter */}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Pattern</h3>
        <div className="space-y-1">
          {patterns.map((pattern) => {
            const slug = pattern.toLowerCase().replace(/ /g, '-');
            const isActive = activeFilters.pattern === slug;
            return (
              <Link
                key={pattern}
                href={buildFilterUrl('pattern', slug)}
                className="flex items-center gap-2 px-2 py-1 rounded text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-3 h-3 rounded border transition-colors ${
                  isActive ? 'bg-[#00473c] border-[#00473c]' : 'border-gray-300'
                }`}>
                  {isActive && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>{pattern}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Color Filter */}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Color</h3>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => {
            const slug = color.name.toLowerCase();
            const isActive = activeFilters.color === slug;
            return (
              <Link
                key={color.name}
                href={buildFilterUrl('color', slug)}
                className="group relative"
                title={color.name}
              >
                <div
                  className={`w-8 h-8 rounded-full transition-all ${
                    isActive ? 'ring-2 ring-[#00473c] ring-offset-1 scale-110' : 'hover:scale-105'
                  } ${color.hex === '#FFFFFF' ? 'border border-gray-200' : ''}`}
                  style={{ backgroundColor: color.hex }}
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Clear All Filters */}
      {(activeFilters.pattern || activeFilters.color || activeFilters.window || activeFilters.room || activeFilters.solution) && (
        <div className="pt-4 border-t border-gray-100">
          <Link
            href={clearFilters()}
            className="block w-full text-center py-1.5 px-3 text-gray-600 hover:text-gray-900 text-xs font-medium hover:bg-gray-50 transition-colors rounded"
          >
            Clear Filters
          </Link>
        </div>
      )}
    </div>
  );
}