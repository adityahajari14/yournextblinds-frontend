'use client';

import { useState } from 'react';
import Image from 'next/image';
import categoryContent from '@/data/categoryContent';
import { NAVIGATION_SLUG_MAPPING, NAVIGATION_TAG_FILTERS } from '@/data/navigation';

interface CategoryInfoSectionProps {
  categorySlug: string;
  /** Product tag slugs — used on product pages to resolve the most specific content */
  productTags?: string[];
}

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

function AccordionRow({ item, isOpen, onToggle }: { item: AccordionItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 md:py-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm md:text-base font-semibold text-[#1a1a1a]">{item.title}</span>
        <span className="ml-4 shrink-0 text-gray-500 text-xl leading-none">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && (
        <div className="pb-5 text-sm text-[#484848] leading-relaxed">
          {item.content}
        </div>
      )}
    </div>
  );
}

/**
 * Given a backend category slug and the product's tag slugs, find the most
 * specific content key.  e.g. category "vertical-blinds" + tags ["blackout"]
 * → "blackout-vertical-blinds" content (if it exists).
 */
function resolveContentSlug(categorySlug: string, tags: string[]): string {
  // Build a list of candidate nav slugs that map to the same backend category
  const candidates: { slug: string; matchCount: number }[] = [];

  for (const [navSlug, requiredTags] of Object.entries(NAVIGATION_TAG_FILTERS)) {
    const backendSlug = NAVIGATION_SLUG_MAPPING[navSlug];
    if (backendSlug !== categorySlug) continue;

    // Check if the product has ALL tags required by this nav slug
    const allMatch = requiredTags.every(t => tags.includes(t));
    if (allMatch) {
      candidates.push({ slug: navSlug, matchCount: requiredTags.length });
    }
  }

  // Pick the most specific match (most tags matched)
  candidates.sort((a, b) => b.matchCount - a.matchCount);

  for (const c of candidates) {
    if (categoryContent[c.slug]) return c.slug;
  }

  return categorySlug;
}

export default function CategoryInfoSection({ categorySlug, productTags }: CategoryInfoSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  // On product pages productTags is provided — resolve the most specific content.
  // On collection pages the slug is already the nav slug — try it directly,
  // then fall back through the mapping.
  let resolvedSlug = categorySlug;
  if (productTags) {
    // Product page: category is a backend slug like "vertical-blinds"
    resolvedSlug = resolveContentSlug(categorySlug, productTags);
  }
  const content = categoryContent[resolvedSlug]
    ?? categoryContent[NAVIGATION_SLUG_MAPPING[resolvedSlug] ?? ''];

  const toggle = (id: string) => setOpenId(prev => (prev === id ? null : id));

  const items: AccordionItem[] = [];

  // --- Category-specific sections ---
  if (content) {
    items.push({
      id: 'product-details',
      title: 'Product Details',
      content: (
        <div className="space-y-4">
          {content.productDetails.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <div className="pt-1">
            <p className="font-semibold text-[#1a1a1a] mb-2">Key Features</p>
            <ul className="space-y-1.5 list-none">
              {content.keyFeatures.map((feat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 w-2 h-2 rounded-full bg-[#00473c] shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    });

    items.push({
      id: 'specifications',
      title: 'Specifications',
      content: (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {content.specifications.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2.5 px-3 font-medium text-[#1a1a1a] w-1/2">{row.label}</td>
                  <td className="py-2.5 px-3 text-[#484848]">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    });

    items.push({
      id: 'perfect-for',
      title: 'Perfect For',
      content: (
        <ul className="space-y-1.5 list-none">
          {content.perfectFor.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 w-2 h-2 rounded-full bg-[#00473c] shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ),
    });

    items.push({
      id: 'whats-in-the-box',
      title: "What's in the Box?",
      content: (
        <ul className="space-y-1.5 list-none">
          {content.whatsInTheBox.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 w-2 h-2 rounded-full bg-[#00473c] shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ),
    });

    items.push({
      id: 'easy-maintenance',
      title: 'Easy Maintenance',
      content: (
        <div className="space-y-2">
          <p>Our blinds are designed to be low maintenance and easy to clean. To keep them looking their best:</p>
          <ul className="space-y-1.5 list-none mt-2">
            {content.easyMaintenance.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 rounded-full bg-[#00473c] shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    });

    items.push({
      id: 'child-safety',
      title: 'Child Safety',
      content: (
        <div className="space-y-3">
          {content.childSafety.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ),
    });
  }

  const whyChooseFeatures = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      ),
      title: 'Custom Made to Measure',
      desc: 'Every blind is cut to your exact specifications for a perfect fit.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      ),
      title: 'Built to Last',
      desc: 'Premium materials engineered for durability and long-term performance.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
      ),
      title: 'Modern Styles',
      desc: 'Contemporary designs that complement any interior, traditional or modern.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      ),
      title: 'Easy Installation',
      desc: 'Simple DIY setup with all hardware and guides included.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      ),
      title: 'Full Light Control',
      desc: 'Filter or block light precisely — from bright mornings to total blackout.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
      ),
      title: 'Dedicated Support',
      desc: 'Friendly experts ready to help before, during, and after your purchase.',
    },
  ];

  const warrantyYears = resolvedSlug === 'waterproof-blackout-vertical-blinds' ? 10 : 5;

  return (
    <section className="bg-white border-t border-gray-100">
      {/* Guarantee — cohesive callout strip */}
      <div className="bg-[#f0fdf9] border-b border-[#00473c]/10 px-4 md:px-6 lg:px-20 py-8 md:py-10">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          {/* Icon + badge */}
          <div className="shrink-0 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#00473c] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[#1a1a1a] leading-tight">{warrantyYears}-Year Guarantee</p>
              <p className="text-xs text-[#00473c]/70 font-medium">Manufacturer backed</p>
            </div>
          </div>
          {/* Divider */}
          <div className="hidden sm:block h-10 w-px bg-[#00473c]/15 shrink-0" />
          {/* Text */}
          <p className="text-sm text-[#484848] leading-relaxed">
            Every blind we make is backed by a {warrantyYears}-Year Manufacturer Guarantee. If you experience a manufacturing
            defect, contact us at{' '}
            <a href="mailto:enquiries@yournextblinds.com" className="text-[#00473c] hover:underline">
              enquiries@yournextblinds.com
            </a>{' '}
            and we&apos;ll make it right. <span className="text-[#aaa]">(Photos may be required. Accidental damage not covered.)</span>
          </p>
        </div>
      </div>

      {/* Category-specific accordion */}
      {items.length > 0 && (
        <div className="px-4 md:px-6 lg:px-20 py-10 md:py-14">
          <div className="max-w-[1400px] mx-auto">
            {items.map(item => (
              <AccordionRow
                key={item.id}
                item={item}
                isOpen={openId === item.id}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Why Choose — icon grid on light background */}
      <div className="bg-[#f9f9f7] px-4 md:px-6 lg:px-20 py-14 md:py-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-3">
              Why Choose Your Next Blinds?
            </h2>
            <p className="text-sm md:text-base text-[#6b6b6b] max-w-xl mx-auto">
              At Your Next Blinds, we focus on delivering affordable, high-quality window blinds that combine
              style, durability, and performance for every home.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {whyChooseFeatures.map((feat, i) => (
              <div key={i} className="bg-white rounded-xl p-5 md:p-6 flex gap-4 items-start shadow-sm border border-gray-100 hover:shadow-md hover:border-[#00473c]/20 transition-all duration-200">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#00473c]/10 flex items-center justify-center text-[#00473c]">
                  {feat.icon}
                </div>
                <div>
                  <p className="font-semibold text-[#1a1a1a] text-sm md:text-base mb-1">{feat.title}</p>
                  <p className="text-xs md:text-sm text-[#6b6b6b] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Texas — full-width image overlay, matching Craftsmanship style */}
      <div className="relative min-h-80 md:min-h-[400px] overflow-hidden">
        <Image
          src="/home/craftsmanship-bg.jpg"
          alt="Proudly designed and manufactured in Texas"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 px-4 md:px-6 lg:px-20 py-16 md:py-24">
          <div className="max-w-[1400px] mx-auto flex flex-col items-center lg:items-start text-center lg:text-left gap-5 md:gap-6">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full border border-white/20">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
              Made in Texas, USA
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight max-w-2xl">
              Proudly Designed and{' '}
              <span className="font-semibold italic">Manufactured in Texas</span>
            </h2>
            <p className="text-white/75 text-sm md:text-base lg:text-lg leading-relaxed max-w-xl">
              Locally crafted in Texas, our blinds are made with care, quality, and sustainability. With local
              production and skilled craftsmanship, we ensure a perfect fit, lasting durability, and quicker lead
              times — all while supporting American manufacturing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
