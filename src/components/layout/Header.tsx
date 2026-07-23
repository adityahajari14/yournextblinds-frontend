'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useSamples } from '@/context/SampleContext';
import { navigationData } from '@/data/navigation';
import SearchPopup from './SearchPopup';

const Header = () => {
  const { cart } = useCart();
  const { count: sampleCount } = useSamples();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
    <div className="bg-white backdrop-blur-sm px-3 md:px-4 lg:px-12 py-2.5 md:py-3 flex items-center justify-between gap-3 md:gap-4">
      {/* Logo */}
      <Link href="/" className="flex gap-1.5 md:gap-2 items-center shrink-0">
        <Image src="/icons/logo.svg" alt="Your Next Blinds" width={16} height={20} className="md:w-[18px] md:h-[22px]" />
        <span className="font-medium text-base md:text-lg lg:text-xl text-[#00473c] leading-tight whitespace-nowrap">
          Your <span className="italic">Next </span>Blinds
        </span>
      </Link>

      {/* Desktop Navigation (inline, single row) */}
      <nav className="hidden lg:block flex-1">
        <ul className="flex gap-6 items-center justify-center">
          {navigationData.map((item, index) => (
            <li key={index} className="group static">
              {item.submenu ? (
                <>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-black hover:text-[#00473c] transition-colors cursor-pointer">
                    <span>{item.label}</span>
                    <Image
                      src="/icons/CaretDown.svg"
                      alt=""
                      width={11}
                      height={11}
                      className="opacity-60 transition-transform group-hover:rotate-180"
                    />
                  </div>

                  {/* Dropdown Menu */}
                  <div className="absolute left-0 right-0 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="bg-white border-t-2 border-[#00473c] shadow-xl p-8">
                      <div className="max-w-4xl mx-auto">
                        <ul className="space-y-3">
                          {item.submenu.map((link, linkIndex) => {
                            let icon = '/nav-icons/vertical-blinds.webp';

                            if (item.label === 'Blinds') {
                              if (link.label.includes('Light filtering Vertical')) icon = '/nav-icons/vertical-blinds.webp';
                              else if (link.label.includes('Blackout vertical')) icon = '/nav-icons/blackout-blinds.svg';
                              else if (link.label.includes('All blinds')) icon = '/nav-icons/roller-blinds.webp';
                            } else if (item.label === 'Shades') {
                              if (link.label.includes('Light filtering roller')) icon = '/nav-icons/roller-blinds.webp';
                              else if (link.label.includes('Blackout roller')) icon = '/nav-icons/blackout-blinds.svg';
                              else if (link.label.includes('Waterproof')) icon = '/nav-icons/waterproof-blinds.svg';
                              else if (link.label.includes('Dual zebra')) icon = '/nav-icons/day-night-blinds.webp';
                              else if (link.label.includes('All blinds')) icon = '/nav-icons/roller-blinds.webp';
                            } else if (item.label === 'Motorization') {
                              if (link.label.includes('roller')) icon = '/nav-icons/roller-blinds.webp';
                              else if (link.label.includes('Dual')) icon = '/nav-icons/day-night-blinds.webp';
                              else if (link.label.includes('EclipseCore')) icon = '/nav-icons/blackout-blinds.svg';
                            } else if (item.label === 'Blackout') {
                              if (link.label.includes('Roller')) icon = '/nav-icons/blackout-blinds.svg';
                              else if (link.label.includes('Dual')) icon = '/nav-icons/day-night-blinds.webp';
                              else if (link.label.includes('Vertical')) icon = '/nav-icons/vertical-blinds.webp';
                              else if (link.label.includes('EclipseCore')) icon = '/nav-icons/blackout-blinds.svg';
                            } else if (item.label === 'Shop by') {
                              if (link.label.includes('Feature')) icon = '/nav-icons/thermal-blinds.svg';
                              else if (link.label.includes('room')) icon = '/nav-icons/rooms-livingroom.webp';
                            }

                            return (
                              <li key={linkIndex} className="flex items-start gap-2">
                                <Image src={icon} alt="" width={20} height={20} className="opacity-70 mt-0.5 shrink-0" />
                                {link.href ? (
                                  <Link href={link.href} className="text-[15px] text-gray-700 hover:text-[#00473c] transition-colors">
                                    {link.label}
                                  </Link>
                                ) : (
                                  <span className="text-[15px] text-gray-700">
                                    {link.label}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 text-sm font-semibold text-black hover:text-[#00473c] transition-colors"
                >
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-black">
                  <span>{item.label}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Action Icons */}
      <div className="flex gap-3 md:gap-4 items-center shrink-0">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Search"
          className="group relative flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity"
        >
          <Image src="/icons/search.svg" alt="Search" width={24} height={24} className="w-6 h-6 md:w-[22px] md:h-[22px]" />
          <span className="md:hidden text-[11px] font-medium leading-none text-black">Search</span>
          <span className="hidden md:block pointer-events-none absolute top-full right-1/2 translate-x-1/2 mt-2 whitespace-nowrap rounded bg-[#00473c] px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
            Search
          </span>
        </button>
        <Link href="/account" aria-label="Account" className="group relative flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
          <Image src="/icons/profile.svg" alt="Profile" width={24} height={24} className="w-6 h-6 md:w-[22px] md:h-[22px]" />
          <span className="md:hidden text-[11px] font-medium leading-none text-black">Account</span>
          <span className="hidden md:block pointer-events-none absolute top-full right-1/2 translate-x-1/2 mt-2 whitespace-nowrap rounded bg-[#00473c] px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
            Account
          </span>
        </Link>
        <Link href="/samples" aria-label="Free samples" className="group relative flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
          <span className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00473c"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 md:w-[22px] md:h-[22px]"
            >
              <path d="M2 13.5V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9.5" />
              <path d="M14.5 5.5 20 11a2 2 0 0 1 0 2.83l-6.59 6.59a2 2 0 0 1-2.82 0L4 13.83" />
              <path d="M2 13.5a5 5 0 0 0 10 0" />
              <circle cx="7" cy="7" r="0.5" fill="#00473c" />
            </svg>
            {sampleCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#00473c] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {sampleCount > 99 ? '99+' : sampleCount}
              </span>
            )}
          </span>
          <span className="md:hidden text-[11px] font-medium leading-none text-black">Samples</span>
          <span className="hidden md:block pointer-events-none absolute top-full right-1/2 translate-x-1/2 mt-2 whitespace-nowrap rounded bg-[#00473c] px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
            Free samples
          </span>
        </Link>
        <Link href="/cart" aria-label="Cart" className="group relative flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
          <span className="relative">
            <Image src="/icons/cart.svg" alt="Cart" width={24} height={24} className="w-6 h-6 md:w-[22px] md:h-[22px]" />
            {cart.itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#00473c] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cart.itemCount > 99 ? '99+' : cart.itemCount}
              </span>
            )}
          </span>
          <span className="md:hidden text-[11px] font-medium leading-none text-black">Cart</span>
          <span className="hidden md:block pointer-events-none absolute top-full right-1/2 translate-x-1/2 mt-2 whitespace-nowrap rounded bg-[#00473c] px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
            Cart
          </span>
        </Link>
      </div>
    </div>
    <SearchPopup open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;
