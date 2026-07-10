import Image from 'next/image';

interface CategoryHeroProps {
  title: string;
  description: string;
  productCount: number;
}

// Category images mapping. Keys are the display titles from COLLECTION_DISPLAY_NAMES
// (src/data/navigation.ts) — they must match exactly or the hero falls back to the default.
// Kept in sync with IMAGE_MAP in the home "Shop by Category" grid
// (src/components/home/CategoryGrid.tsx), which is keyed by collection href instead.
const categoryImages: Record<string, string> = {
  'Light filtering roller Shades': '/home/categories/light-filtering-roller-shades.webp',
  'Blackout roller Shades': '/home/categories/blackout-roller-shades.webp',
  'Waterproof Blackout roller Shades': '/home/categories/Waterproof%20Blackout%20roller%20Shades.png',
  'Dual zebra Shades': '/home/categories/dual-zebra-shades.webp',
  'Light filtering Vertical blinds': '/home/categories/light%20filtering%20vertical%20blinds.png',
  'Blackout vertical blinds': '/home/categories/blackout%20vertical%20blinds.png',
  'Waterproof Blackout vertical blinds': '/home/categories/water%20proof%20vertical%20blinds.png',
  'Motorised roller shades': '/home/categories/Motorised%20roller%20shades.png',
  'Motorised Dual zebra shades': '/home/categories/motorised%20zebra%20dual%20shades.png',
  'Motorised EclipseCore': '/home/categories/motorised%20eclipsecore.png',
  'Roller Shades': '/home/categories/blackout-roller-shades.webp',
  'Dual zebra shades': '/home/categories/Dual%20zebra%20Shades.png',
  'Vertical blinds': '/home/categories/blackout%20vertical%20blinds.png',
  'EclipseCore shades': '/home/categories/eclipse%20core%20shades.png',
};

export default function CategoryHero({ title, description, productCount }: CategoryHeroProps) {
  const image = categoryImages[title] || '/home/products/blinds.jpeg';
  const isComingSoon = productCount === 0;

  return (
    <section className="relative bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 md:w-72 md:h-72 bg-[#00473c]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-[#00473c]/3 rounded-full blur-3xl" />
      
      <div className="max-w-[1400px] mx-auto relative">
        <div className="grid lg:grid-cols-2 min-h-[350px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px]">
          <div className="flex items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 py-8 sm:py-10 md:py-12 lg:py-16">
            <div className="max-w-xl space-y-4 sm:space-y-5 md:space-y-6">
              <div className="inline-block">
                {isComingSoon ? (
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-amber-600 font-semibold bg-amber-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    Coming Soon
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-[#00473c] font-semibold bg-[#00473c]/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    {productCount} {productCount === 1 ? 'Product' : 'Products'} Available
                  </span>
                )}
              </div>
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-black leading-tight">
                  {title}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                  {description}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 sm:gap-6 pt-2 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#00473c]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#00473c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Free Samples</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#00473c]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#00473c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Fast Delivery</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-[250px] sm:h-[300px] md:h-[400px] lg:h-full">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
