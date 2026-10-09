'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { navigationData, NavigationItem } from '@/data/navigation';

const DEFAULT_NAV_ICON = '/nav-icons/vertical-blinds.webp';

/** Does this item expand into a submenu / mega menu / room grid? */
const hasDropdown = (item: NavigationItem): boolean =>
  Boolean(item.submenu?.length || item.megaMenu?.columns.length || item.roomMenu?.length);

/** One tappable link row inside a mobile accordion: icon tile + label. */
const MobileLinkRow = ({
  href,
  label,
  icon,
  onClose,
}: {
  href?: string;
  label: string;
  icon?: string;
  onClose: () => void;
}) => {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f4f2ec]">
        <Image src={icon ?? DEFAULT_NAV_ICON} alt="" width={18} height={18} className="opacity-80" />
      </span>
      <span className="text-[15px] leading-tight text-gray-800">{label}</span>
    </>
  );
  const className =
    'flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 transition-colors active:bg-[#f2f0ea]';
  return href ? (
    <Link href={href} className={className} onClick={onClose}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
};

// Mobile Menu Item Component with Accordion
const MobileMenuItem = ({ item, onClose }: { item: NavigationItem; onClose: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!hasDropdown(item)) {
    return (
      <div className="border-b border-gray-100 last:border-0">
        {item.href ? (
          <Link
            href={item.href}
            className="flex min-h-12 items-center py-3 text-[15px] font-semibold text-black transition-colors active:text-[#00473c]"
            onClick={onClose}
          >
            <span>{item.label}</span>
          </Link>
        ) : (
          <div className="flex min-h-12 items-center py-3 text-[15px] font-semibold text-black">
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
        aria-expanded={isOpen}
        className="flex min-h-12 w-full items-center justify-between py-3 text-[15px] font-semibold text-black"
      >
        <span>{item.label}</span>
        <Image
          src="/icons/CaretDown.svg"
          alt=""
          width={12}
          height={12}
          className={`opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="animate-fade-in space-y-4 pb-4">
          {item.submenu && (
            <ul className="space-y-0.5">
              {item.submenu.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <MobileLinkRow {...link} onClose={onClose} />
                </li>
              ))}
            </ul>
          )}

          {item.megaMenu?.columns.map((column, columnIndex) => (
            <div key={columnIndex}>
              {column.title && (
                <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#00473c]">
                  {column.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <MobileLinkRow {...link} onClose={onClose} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {item.roomMenu && (
            <div>
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#00473c]">
                Shop by Room
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {item.roomMenu.map((room, roomIndex) => (
                  <Link
                    key={roomIndex}
                    href={room.href}
                    onClick={onClose}
                    className="relative block aspect-16/10 overflow-hidden rounded-lg ring-1 ring-black/5"
                  >
                    <Image src={room.image} alt={room.name} fill className="object-cover" />
                    <span className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                    <span className="absolute bottom-1.5 left-2 right-2 text-[13px] font-semibold text-white drop-shadow-sm">
                      {room.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
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
      <nav className="lg:hidden bg-white border-t border-[#eaeaea] px-3 sm:px-4 py-2.5 sm:py-3 relative">
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
            <div className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col overflow-hidden rounded-r-2xl bg-white shadow-2xl animate-slide-in-left">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h2 className="text-base font-semibold tracking-wide text-[#00473c]">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="-mr-2 rounded-full p-2 transition-colors active:bg-gray-100"
                  aria-label="Close menu"
                >
                  <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-2">
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
