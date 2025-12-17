'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { navigationData } from '@/data/navigation';

// Mobile Menu Item Component with Accordion
const MobileMenuItem = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubmenu = item.megaMenu || item.colorMenu || item.roomMenu;

  if (!hasSubmenu) {
    return (
      <div className="border-b border-gray-100 last:border-0">
        <Link
          href={item.href || '#'}
          onClick={onClose}
          className="flex items-center justify-between py-3 text-sm font-semibold text-black hover:text-[#00473c] transition-colors"
        >
          <span>{item.label}</span>
        </Link>
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
      
      {isOpen && (
        <div className="pb-3 pl-4">
          {item.megaMenu && (
            <div className="space-y-4">
              {item.megaMenu.map((column: any, colIndex: number) => (
                <div key={colIndex}>
                  {column.title && (
                    <h4 className="text-sm font-medium text-black mb-2">{column.title}</h4>
                  )}
                  {column.links && (
                    <ul className="space-y-2">
                      {column.links.map((link: any, linkIndex: number) => (
                        <li key={linkIndex}>
                          <Link
                            href={link.href}
                            onClick={onClose}
                            className="text-sm text-gray-700 hover:text-[#00473c] transition-colors flex items-center gap-2"
                          >
                            {link.icon && (
                              <Image src={link.icon} alt="" width={16} height={16} className="opacity-70" />
                            )}
                            <span>{link.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {item.colorMenu && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-black mb-2">Colours</h4>
                <ul className="space-y-2">
                  {item.colorMenu.colors.map((color: any, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span 
                        className="w-5 h-5 rounded-full border border-gray-300 shrink-0" 
                        style={{ backgroundColor: color.color }}
                      />
                      <Link
                        href={color.href}
                        onClick={onClose}
                        className="text-sm text-gray-700 hover:text-[#00473c] transition-colors"
                      >
                        {color.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-black mb-2">Wood Finish</h4>
                <ul className="space-y-2">
                  {item.colorMenu.woodFinish.map((wood: any, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Image src={wood.color} alt="" width={20} height={20} className="rounded-full shrink-0" />
                      <Link
                        href={wood.href}
                        onClick={onClose}
                        className="text-sm text-gray-700 hover:text-[#00473c] transition-colors"
                      >
                        {wood.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {item.roomMenu && (
            <ul className="space-y-2">
              {item.roomMenu.map((room: any, idx: number) => (
                <li key={idx}>
                  <Link
                    href={room.href}
                    onClick={onClose}
                    className="text-sm text-gray-700 hover:text-[#00473c] transition-colors"
                  >
                    {room.name}
                  </Link>
                </li>
              ))}
            </ul>
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
      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white border-t border-[#eaeaea] px-6 lg:px-20 relative">
        <div className="max-w-[1200px] mx-auto">
          <ul className="flex gap-8 items-center justify-center">
            {navigationData.map((item, index) => (
              <li key={index} className="group py-4 static">
                <Link
                  href={item.href || '#'}
                  className="flex items-center gap-1.5 text-[15px] font-semibold text-black hover:text-[#00473c] transition-colors"
                >
                  <span>{item.label}</span>
                  <Image 
                    src="/icons/CaretDown.svg" 
                    alt="" 
                    width={12} 
                    height={12} 
                    className="opacity-60 transition-transform group-hover:rotate-180" 
                  />
                </Link>

                {/* Mega Menu Dropdown */}
                {item.megaMenu && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-[1200px]">
                    <div className="bg-white border-t-2 border-[#00473c] shadow-xl p-8">
                      <div className={`grid gap-6 ${item.megaMenu.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} max-w-4xl mx-auto`}>
                        {item.megaMenu.map((column, colIndex) => (
                          <div key={colIndex}>
                            {column.title && (
                              <h3 className="text-lg font-medium text-black mb-4">{column.title}</h3>
                            )}
                            {column.links.length > 0 && (
                              <ul className="space-y-3">
                                {column.links.map((link, linkIndex) => (
                                  <li key={linkIndex} className="flex items-start gap-2">
                                    {link.icon && (
                                      <Image src={link.icon} alt="" width={20} height={20} className="opacity-70 mt-0.5 shrink-0" />
                                    )}
                                    <Link 
                                      href={link.href} 
                                      className="text-[15px] text-gray-700 hover:text-[#00473c] transition-colors flex items-center gap-2 flex-wrap"
                                    >
                                      <span>{link.label}</span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {column.image && (
                              <Link href={column.image.href || '#'} className="block mt-4 overflow-hidden rounded group/img">
                                <Image 
                                  src={column.image.src} 
                                  alt={column.image.alt} 
                                  width={200} 
                                  height={250} 
                                  className="w-full h-auto object-cover transition-transform duration-500 group-hover/img:scale-105" 
                                />
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Color Menu Dropdown */}
                {item.colorMenu && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-[1200px]">
                    <div className="bg-white border-t-2 border-[#00473c] shadow-xl p-8">
                      <div className="grid grid-cols-4 gap-6 max-w-4xl mx-auto">
                        <div>
                          <h3 className="text-base font-medium text-black mb-4">Colours</h3>
                          <ul className="space-y-3">
                            {item.colorMenu.colors.slice(0, 5).map((color, idx) => (
                              <li key={idx} className="flex items-center gap-3">
                                <span 
                                  className="w-7 h-7 rounded-full border border-gray-300 shrink-0" 
                                  style={{ backgroundColor: color.color }}
                                />
                                <Link href={color.href} className="text-[15px] text-gray-700 hover:text-[#00473c] transition-colors">
                                  {color.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-black mb-4">Colours</h3>
                          <ul className="space-y-3">
                            {item.colorMenu.colors.slice(5).map((color, idx) => (
                              <li key={idx} className="flex items-center gap-3">
                                <span 
                                  className="w-7 h-7 rounded-full border border-gray-300 shrink-0" 
                                  style={{ backgroundColor: color.color }}
                                />
                                <Link href={color.href} className="text-[15px] text-gray-700 hover:text-[#00473c] transition-colors">
                                  {color.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-black mb-4">Wood Finish</h3>
                          <ul className="space-y-3">
                            {item.colorMenu.woodFinish.map((wood, idx) => (
                              <li key={idx} className="flex items-center gap-3">
                                <Image src={wood.color} alt="" width={30} height={30} className="rounded-full shrink-0" />
                                <Link href={wood.href} className="text-[15px] text-gray-700 hover:text-[#00473c] transition-colors">
                                  {wood.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-black mb-4">Pattern Design</h3>
                          <ul className="space-y-3">
                            {item.colorMenu.patterns.map((pattern, idx) => (
                              <li key={idx} className="flex items-center gap-3">
                                {pattern.icon && (
                                  <Image src={pattern.icon} alt="" width={30} height={30} className="rounded-full shrink-0" />
                                )}
                                <Link href={pattern.href} className="text-[15px] text-gray-700 hover:text-[#00473c] transition-colors">
                                  {pattern.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Room Menu Dropdown */}
                {item.roomMenu && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-[1200px]">
                    <div className="bg-white border-t-2 border-[#00473c] shadow-xl p-8">
                      <h3 className="text-xl font-semibold text-black mb-6 text-center">Rooms</h3>
                      <div className="grid grid-cols-4 gap-x-6 gap-y-8 max-w-4xl mx-auto">
                        {item.roomMenu.map((room, idx) => (
                          <Link key={idx} href={room.href} className="group/room text-center">
                            <div className="overflow-hidden rounded-lg mb-3">
                              <Image 
                                src={room.image} 
                                alt={room.name} 
                                width={200} 
                                height={120} 
                                className="w-full h-28 object-cover transition-transform duration-300 group-hover/room:scale-105" 
                              />
                            </div>
                            <span className="text-[15px] font-medium text-gray-800 group-hover/room:text-[#00473c] transition-colors">
                              {room.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
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
