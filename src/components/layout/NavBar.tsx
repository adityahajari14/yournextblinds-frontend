'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { navigationData, NavigationItem, NavigationLink } from '@/data/navigation';

// Mobile Menu Item Component with Accordion
const MobileMenuItem = ({ item, onClose }: { item: NavigationItem; onClose: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  if (!hasSubmenu) {
    return (
      <div className="border-b border-gray-100 last:border-0">
        {item.href ? (
          <Link
            href={item.href}
            className="flex items-center justify-between py-3 text-sm font-semibold text-black hover:text-[#00473c] transition-colors"
            onClick={onClose}
          >
            <span>{item.label}</span>
          </Link>
        ) : (
          <div className="flex items-center justify-between py-3 text-sm font-semibold text-black">
            <span>{item.label}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between py-3 text-sm font-semibold text-black w-full"
      >
        <span>{item.label}</span>
        <Image
          src="/icons/CaretDown.svg"
          alt=""
          width={12}
          height={12}
          className={`opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && item.submenu && (
        <div className="pb-3 pl-4">
          <ul className="space-y-2">
            {item.submenu.map((link: NavigationLink, linkIndex: number) => (
              <li key={linkIndex}>
                {link.href ? (
                  <Link
                    href={link.href}
                    className="text-sm text-gray-700 hover:text-[#00473c] transition-colors block py-1"
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <div className="text-sm text-gray-700 block py-1">
                    {link.label}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const NavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white border-t border-[#eaeaea] px-6 lg:px-20 relative">
        <div className="max-w-[1200px] mx-auto">
          <ul className="flex gap-8 items-center justify-center">
            {navigationData.map((item, index) => (
              <li key={index} className="group py-4 static">
                {item.submenu ? (
                  <>
                    <div className="flex items-center gap-1.5 text-[15px] font-semibold text-black hover:text-[#00473c] transition-colors cursor-pointer">
                      <span>{item.label}</span>
                      <Image
                        src="/icons/CaretDown.svg"
                        alt=""
                        width={12}
                        height={12}
                        className="opacity-60 transition-transform group-hover:rotate-180"
                      />
                    </div>

                    {/* Dropdown Menu */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-[1200px]">
                      <div className="bg-white border-t-2 border-[#00473c] shadow-xl p-8">
                        <div className="max-w-4xl mx-auto">
                          <ul className="space-y-3">
                            {item.submenu.map((link, linkIndex) => {
                              // Assign icons based on menu labels
                              let icon = '/nav-icons/vertical-blinds.webp'; // default

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
                    className="flex items-center gap-1.5 text-[15px] font-semibold text-black hover:text-[#00473c] transition-colors"
                  >
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5 text-[15px] font-semibold text-black">
                    <span>{item.label}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden bg-white border-t border-[#eaeaea] px-4 py-3 relative">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-black"
          >
            <div className="flex flex-col gap-1">
              <span className={`w-5 h-0.5 bg-black transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`w-5 h-0.5 bg-black transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-0.5 bg-black transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
            <span>Menu</span>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white z-50 shadow-2xl animate-slide-in-left overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-4 py-4">
                {navigationData.map((item, index) => (
                  <MobileMenuItem
                    key={index}
                    item={item}
                    onClose={() => setMobileMenuOpen(false)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </nav>
    </>
  );
};

export default NavBar;
