'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import StarRating from './StarRating';
import { formatPriceWithCurrency } from '@/lib/api';

interface RelatedProductsProps {
  products: Product[];
}

const RelatedProducts = ({ products }: RelatedProductsProps) => {
  if (products.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <h2 className="text-xl md:text-2xl font-medium text-[#3a3a3a] mb-6 md:mb-8">Related Products</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.map((product) => (
          <div key={product.id} className="flex flex-col">
            {/* Product Image */}
            <Link href={`/product/${product.slug}`} className="group">
              <div className="relative aspect-[4/5] md:h-[291px] bg-gray-100 overflow-hidden">
                <Image
                  src={product.images[0] || '/home/products/vertical-blinds-1.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </Link>
            
            {/* Product Info */}
            <div className="bg-white p-2 md:p-4 flex flex-col md:flex-row md:items-end md:justify-between gap-2 md:gap-0">
              <div className="flex flex-col gap-1 md:gap-2">
                {/* Name & Price */}
                <div className="flex flex-col gap-0.5">
                  <Link href={`/product/${product.slug}`}>
                    <h3 className="text-sm md:text-lg font-normal text-black capitalize line-clamp-2">{product.name}</h3>
                  </Link>
                  <div className="flex items-end gap-1 md:gap-3">
                    <span className="text-base md:text-[21px] font-bold text-black">
                      {formatPriceWithCurrency(product.price, product.currency)}
                    </span>
                  </div>
                </div>
                {/* Stars */}
                <StarRating rating={product.rating} size="sm" filledColor="text-[#e7b66b]" />
              </div>
              
              {/* Add to Cart Button - Hidden on mobile */}
              <button 
                onClick={(e) => e.stopPropagation()}
                className="hidden md:block px-2.5 py-2.5 border border-black bg-white text-base text-black hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
