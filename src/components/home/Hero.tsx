'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { REGULAR_HERO_SLIDES } from '@/data/hero';
import { PROMO_CODE, PROMO_CODE_PERCENT } from '@/data/promo';
import { SEASONAL_SALE } from '@/data/seasonal';

const slides = [...(SEASONAL_SALE?.heroSlides ?? []), ...REGULAR_HERO_SLIDES];
const INTERVAL_MS = 7000;

const Arrow = ({ previous = false }: { previous?: boolean }) => (
  <svg className={previous ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!autoPlay || isHovered || hasFocus || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setCurrent(value => (value + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [autoPlay, isHovered, hasFocus]);

  const goToPrevious = () => setCurrent(value => (value - 1 + slides.length) % slides.length);
  const goToNext = () => setCurrent(value => (value + 1) % slides.length);
  const copyCode = async () => {
    try {
      if (!navigator.clipboard) return;
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      className="storefront-hero relative h-[min(420px,calc(100svh-13rem))] min-h-[340px] w-full overflow-hidden bg-[#f7f4ec] md:h-[min(480px,max(360px,34vw),calc(100svh-11rem))] md:min-h-0"
      aria-label="Featured offers"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false);
      }}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          goToPrevious();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          goToNext();
        }
      }}
    >
      <h1 className="sr-only">Made-to-Measure Blinds and Shades, Manufactured in Texas — Your Next Blinds</h1>

      {slides.map((slide, index) => {
        const active = current === index;
        return (
          <article
            key={slide.id}
            id={`hero-slide-${slide.id}`}
            className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${active ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
            aria-hidden={!active}
            aria-label={`Slide ${index + 1} of ${slides.length}`}
            aria-roledescription="slide"
          >
            <Link href={slide.href} tabIndex={-1} aria-hidden="true" className="hero-visual absolute inset-0 md:left-[43%]">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(min-width: 768px) 57vw, 100vw"
                priority={index === 0}
                className="object-cover"
                style={{ objectPosition: slide.imagePosition ?? 'center 42%' }}
              />
            </Link>
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,38,31,0.9),rgba(0,38,31,0.6)_65%,rgba(0,38,31,0.35))] md:bg-[linear-gradient(90deg,#f7f4ec_0%,#f7f4ec_42%,rgba(247,244,236,0.95)_45%,transparent_61%)]"
              aria-hidden="true"
            />
            <div className="pointer-events-none relative mx-auto flex h-full max-w-[1440px] items-center px-6 sm:px-10 md:px-14 lg:px-20">
              <div className="hero-copy pointer-events-auto flex w-full max-w-[420px] flex-col items-start gap-3 pb-16 pt-10 md:w-[46%] md:max-w-none md:gap-4 md:pb-12 md:pt-6">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-[11px] ${slide.seasonal ? 'bg-[#f4d488]/15 text-[#f4d488] md:bg-[#e8c579]/20 md:text-[#795c23]' : 'bg-white/10 text-white/90 md:bg-[#00473c]/5 md:text-[#00473c]'}`}>
                  {slide.seasonal && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
                  {slide.eyebrow}
                </span>
                <h2 className="hero-title font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-[40px] md:text-[34px] md:text-[#192c28] lg:text-[44px] xl:text-[50px]">
                  <span className="block">{slide.headline}</span>
                  <span className="mt-1 block text-[#d5ebd9] md:text-[#00473c]">{slide.highlight}</span>
                </h2>
                <p className="hero-description max-w-[340px] text-sm leading-relaxed text-white/80 md:text-[#59645d] lg:text-[15px]">{slide.description}</p>
                <div className="hero-actions flex flex-col items-start gap-3 md:gap-4">
                  <div className="flex items-center gap-2 text-xs text-white/85 md:text-[#47564d] lg:text-sm">
                    <span>Extra {PROMO_CODE_PERCENT}% off with</span>
                    <button
                      type="button"
                      tabIndex={active ? 0 : -1}
                      onClick={copyCode}
                      aria-label={copied ? 'Discount code copied' : `Copy code ${PROMO_CODE}`}
                      className="rounded border border-white/30 bg-white/10 px-2 py-1 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-white/20 md:border-[#00473c]/20 md:bg-[#00473c]/5 md:text-[#00473c] md:hover:bg-[#00473c]/10"
                    >
                      {copied ? 'Copied!' : PROMO_CODE}
                    </button>
                  </div>
                  <Link
                    href={slide.href}
                    tabIndex={active ? 0 : -1}
                    className={`hero-cta inline-flex min-h-11 items-center justify-center gap-3 rounded-md px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4ae62] ${slide.seasonal ? 'bg-[#edcb7d] text-[#173f35] hover:bg-[#f5db9f]' : 'bg-white text-[#00473c] hover:bg-[#eef4ef] md:bg-[#00473c] md:text-white md:hover:bg-[#00382f]'}`}
                  >
                    {slide.ctaLabel}
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path d="M4 12h16m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}

      <button type="button" onClick={goToPrevious} aria-label="Previous slide" className="absolute left-3 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#00473c] shadow-sm transition-colors hover:bg-white md:top-1/2 md:-translate-y-1/2">
        <Arrow previous />
      </button>
      <button type="button" onClick={goToNext} aria-label="Next slide" className="absolute right-3 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#00473c] shadow-sm transition-colors hover:bg-white md:top-1/2 md:-translate-y-1/2">
        <Arrow />
      </button>

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-black/20 px-2 backdrop-blur-sm">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={current === index ? 'true' : undefined}
            aria-controls={`hero-slide-${slide.id}`}
            className="flex h-7 w-6 items-center justify-center"
          >
            <span className={`h-1.5 rounded-full transition-all ${current === index ? 'w-4 bg-[#edcb7d]' : 'w-1.5 bg-white/60'}`} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAutoPlay(value => !value)}
          aria-label={autoPlay ? 'Pause slideshow' : 'Play slideshow'}
          className="ml-1 flex h-7 w-7 items-center justify-center border-l border-white/25 text-white"
        >
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            {autoPlay ? <path d="M4 3h3v10H4zm5 0h3v10H9z" /> : <path d="m5 2 8 6-8 6z" />}
          </svg>
        </button>
      </div>
    </section>
  );
}
