'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const slides = [
  {
    src: '/home/hero/hero-zebra.webp',
    mobileSrc: '/home/hero/hero-zebra-mobile.webp',
    alt: 'Dual Zebra Shades — Light, Your Way',
    href: '/collections/dual-zebra-shades',
  },
  {
    src: '/home/hero/hero-roller.webp',
    mobileSrc: '/home/hero/hero-roller-mobile.webp',
    alt: 'Blackout Roller Shades — Sleep in Total Dark',
    href: '/collections/blackout-roller-shades',
  },
  {
    src: '/home/hero/hero-vertical.webp',
    mobileSrc: '/home/hero/hero-vertical-mobile.webp',
    alt: 'Vertical Blinds — Made to Fit, Made for You',
    href: '/collections/light-filtering-vertical-blinds',
  },
  {
    src: '/home/hero/hero-sale.webp',
    mobileSrc: '/home/hero/hero-sale-mobile.webp',
    alt: 'Beat the Heatwave — 10% off with code FINAL10',
    href: '/product/non-driii-honeycomb-blackout-blinds',
  },
];

const INTERVAL_MS = 5000;

const Hero = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const goToPrev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  const goToNext = () => setCurrent((prev) => (prev + 1) % slides.length);

  return (
    <section className="relative aspect-[1792/2400] sm:aspect-[2752/1536] w-full overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === current ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={index !== current}
        >
          <Link href={slide.href} className="block h-full w-full" tabIndex={index === current ? 0 : -1}>
            {/* Mobile: 3:4 portrait art-directed image */}
            <Image
              src={slide.mobileSrc}
              alt={slide.alt}
              fill
              sizes="100vw"
              className="object-cover sm:hidden"
              priority={index === 0}
            />
            {/* Desktop/tablet: wide landscape image */}
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="100vw"
              className="hidden object-cover sm:block"
              priority={index === 0}
            />
          </Link>
        </div>
      ))}

      {/* Prev/Next navigation */}
      <button
        type="button"
        onClick={goToPrev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-full bg-white/80 text-[#00473c] shadow-md transition-colors hover:bg-white"
      >
        <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={goToNext}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-full bg-white/80 text-[#00473c] shadow-md transition-colors hover:bg-white"
      >
        <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
              index === current ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
