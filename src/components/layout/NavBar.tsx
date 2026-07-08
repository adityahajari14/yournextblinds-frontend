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
      {/* Mobile Navigation (desktop nav now lives inline in the Header) */}
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
