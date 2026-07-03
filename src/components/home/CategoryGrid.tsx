import Link from 'next/link';
import Image from 'next/image';
import { navigationData } from '@/data/navigation';

const EXCLUDED_LABELS = new Set(['All blinds and shades', 'Roller Shades', 'Vertical blinds']);

// Map each collection href to its category image
const IMAGE_MAP: Record<string, string> = {
  '/collections/light-filtering-roller-shades':      '/home/categories/light-filtering-roller-shades.webp',
  '/collections/blackout-roller-shades':             '/home/categories/blackout-roller-shades.webp',
  '/collections/waterproof-blackout-roller-shades':  '/home/categories/Waterproof%20Blackout%20roller%20Shades.png',
  '/collections/dual-zebra-shades':                  '/home/categories/dual-zebra-shades.webp',
  '/collections/light-filtering-vertical-blinds':    '/home/categories/light%20filtering%20vertical%20blinds.png',
  '/collections/blackout-vertical-blinds':           '/home/categories/blackout%20vertical%20blinds.png',
  '/collections/waterproof-blackout-vertical-blinds':'/home/categories/water%20proof%20vertical%20blinds.png',
  '/collections/motorised-roller-shades':            '/home/categories/Motorised%20roller%20shades.png',
  '/collections/motorised-dual-zebra-shades':        '/home/categories/motorised%20zebra%20dual%20shades.png',
  '/collections/motorised-eclipsecore':              '/home/categories/motorised%20eclipsecore.png',
  '/product/non-driii-honeycomb-blackout-blinds?motorized=true': '/home/categories/motorised%20eclipsecore.png',
  '/collections/blackout-roller-shades-category':    '/home/categories/blackout-roller-shades.webp',
  '/collections/blackout-dual-zebra-shades':         '/home/categories/Dual%20zebra%20Shades.png',
  '/collections/blackout-vertical-blinds-category':  '/home/categories/blackout%20vertical%20blinds.png',
  '/collections/eclipsecore-shades':                 '/home/categories/eclipse%20core%20shades.png',
  '/product/non-driii-honeycomb-blackout-blinds':    '/home/categories/eclipse%20core%20shades.png',
};

const categoryItems = navigationData
  .filter((item) => item.submenu)
  .flatMap((item) =>
    (item.submenu ?? [])
      .filter((sub) => sub.href && !EXCLUDED_LABELS.has(sub.label))
      .map((sub) => ({
        label: sub.label,
        href: sub.href!,
        image: IMAGE_MAP[sub.href!] ?? null,
      }))
  );

const CategoryGrid = () => {
  return (
    <section className="bg-neutral-50 py-12 md:py-16 lg:py-20 border-y border-[#e8e8e8]">
      <div className="px-4 md:px-6 lg:px-20">
        {/* Heading */}
        <div className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl lg:text-[32px] font-medium text-[#3a3a3a] tracking-tight">
            Shop by Category
          </h2>
          <p className="mt-2 text-sm md:text-base text-[#6b6b6b]">
            Browse our full range of made-to-measure window coverings
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {categoryItems.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group flex flex-col bg-white border border-[#e8e8e8] rounded-sm overflow-hidden hover:border-[#00473c] hover:shadow-md transition-all duration-200"
            >
              {/* Image */}
              {cat.image && (
                <div className="relative w-full aspect-4/3 overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}

            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
