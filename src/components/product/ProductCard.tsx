'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StarRating } from '@/components/product';
import { formatPrice, formatPriceWithCurrency } from '@/lib/api';
import { ROLLER_BAND_F_ROOM_DARKENING_OPTIONS } from '@/data/rollerBandF';
import { FLASH_SALE_DISCOUNT_PERCENT } from '@/data/promo';

export type CollectionContext = 'light-filtering' | 'blackout' | undefined;

const BLACKOUT_ROOM_DARKENING_SURCHARGE =
  ROLLER_BAND_F_ROOM_DARKENING_OPTIONS.find((option) => option.id === 'blackout')?.price ?? 0;

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    currency?: string;
    rating: number;
    image?: string;
    images?: string[];
    tags?: string[];
  };
  className?: string;
  preselectedMotorization?: boolean;
  collectionContext?: CollectionContext;
}

const ROLLER_BAND_F_TAG_CLIENT = 'roller-band-f';

export default function ProductCard({ product, className = '', preselectedMotorization = false, collectionContext }: ProductCardProps) {
  const router = useRouter();
  const imageUrl = product.image || product.images?.[0] || '';
  const currency = product.currency || 'USD';
  const motorizedParam = preselectedMotorization ? '&motorized=true' : '';

  const isBandF = product.tags?.includes(ROLLER_BAND_F_TAG_CLIENT);
  const contextParam = isBandF && collectionContext ? `collectionContext=${collectionContext}` : '';
  const displayPrice =
    isBandF && collectionContext === 'blackout'
      ? product.price + BLACKOUT_ROOM_DARKENING_SURCHARGE
      : product.price;

  const displayName = isBandF && collectionContext === 'light-filtering'
    ? `Light Filtering ${product.name}`
    : isBandF && collectionContext === 'blackout'
    ? `Blackout ${product.name}`
    : product.name;

  const compareAtPrice = formatPrice(displayPrice / (1 - FLASH_SALE_DISCOUNT_PERCENT / 100));

  function buildUrl(base: string, extraParams: string): string {
    if (!extraParams) return base;
    return base.includes('?') ? `${base}&${extraParams}` : `${base}?${extraParams}`;
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(buildUrl(`/product/${product.slug}?customize=true${motorizedParam}`, contextParam));
  };

  return (
    <Link
      href={buildUrl(`/product/${product.slug}${preselectedMotorization ? '?motorized=true' : ''}`, contextParam)}
      className={`flex flex-col group w-full h-full ${className}`}
    >
      {/* Image */}
      <div className="relative h-[220px] md:h-[250px] lg:h-[291px] overflow-hidden shrink-0">
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info */}
      <div className="bg-white pt-3 md:pt-4 pb-1 flex items-end justify-between gap-2 flex-1">
        <div className="flex flex-col gap-1.5 md:gap-2 flex-1 min-w-0">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base md:text-lg font-normal text-black capitalize line-clamp-2">
              {displayName}
            </h3>
            <StarRating rating={product.rating} size="sm" filledColor="text-[#00473c]" />
          </div>
          <div className="flex flex-wrap gap-1.5 md:gap-2 items-baseline">
            <span className="text-xs md:text-sm font-medium text-gray-400 line-through">
              {formatPriceWithCurrency(compareAtPrice, currency)}
            </span>
            <span className="text-lg md:text-xl font-bold text-black">
              {formatPriceWithCurrency(displayPrice, currency)}
            </span>
            <span className="rounded-md bg-[#00473c] px-1.5 py-0.5 text-[10px] md:text-xs font-semibold text-white">
              {FLASH_SALE_DISCOUNT_PERCENT}% Off
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleAddToCart}
          className="border border-black bg-white px-2.5 py-2.5 text-base text-black hover:bg-black hover:text-white transition-colors shrink-0"
        >
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
