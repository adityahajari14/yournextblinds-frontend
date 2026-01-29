'use client';

import { useRef, useEffect, useState } from 'react';
import { ProductCard } from '@/components/product';
import { fetchProducts, transformProduct } from '@/lib/api';

interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency?: string;
  rating: number;
  image?: string;
  images?: string[];
}

const BestSelling = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetchProducts({ limit: 5 });
        const mappedProducts = response.data.slice(0, 5).map((productData) => {
          const product = transformProduct(productData);
          return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            currency: product.currency,
            rating: product.rating,
            image: product.images[0],
            images: product.images,
          };
        });
        setProducts(mappedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -327 : 327,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-12 md:py-16 lg:py-24 overflow-hidden">
        <div className="flex flex-col gap-6 md:gap-6 lg:gap-8">
          <div className="px-4 md:px-6 lg:px-20">
            <h2 className="text-xl md:text-2xl lg:text-[32px] font-medium text-[#3a3a3a]">
              Best Selling Products
            </h2>
          </div>
          <div className="flex gap-4 pl-4 md:pl-6 lg:pl-20">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="shrink-0 w-[250px] md:w-[280px] lg:w-[311px] h-[350px] bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-12 md:py-16 lg:py-24 overflow-hidden">
      <div className="flex flex-col gap-6 md:gap-6 lg:gap-8">
        <div className="flex items-center justify-between px-4 md:px-6 lg:px-20">
          <h2 className="text-xl md:text-2xl lg:text-[32px] font-medium text-[#3a3a3a]">
            Best Selling Products
          </h2>
          <div className="hidden lg:flex gap-3">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="w-10 h-10 rounded-full border border-[#3a3a3a] flex items-center justify-center hover:bg-[#00473c] hover:border-[#00473c] hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="w-10 h-10 rounded-full border border-[#3a3a3a] flex items-center justify-center hover:bg-[#00473c] hover:border-[#00473c] hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div ref={scrollRef} className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pl-4 md:pl-6 lg:pl-20">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                className="shrink-0 w-[250px] md:w-[280px] lg:w-[311px]"
              />
            ))}
            <div className="shrink-0 w-4 md:w-6 lg:w-12 h-px" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BestSelling;
