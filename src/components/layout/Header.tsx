'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';

const Header = () => {
  const { cart } = useCart();

  return (
    <div className="bg-white backdrop-blur-sm px-4 md:px-6 lg:px-20 py-4 md:py-5 lg:py-6 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex gap-1.5 md:gap-2 items-center">
        <Image src="/icons/logo.svg" alt="Your Next Blinds" width={16} height={20} className="md:w-[19px] md:h-[23px]" />
        <span className="font-medium text-base md:text-lg lg:text-[23px] text-[#00473c] leading-tight">
          Your <span className="italic">Next </span>Blinds
        </span>
      </Link>
      
      {/* Action Icons */}
      <div className="flex gap-4 md:gap-5 lg:gap-6 items-center">
        <Link href="/search" aria-label="Search" className="hover:opacity-70 transition-opacity">
          <Image src="/icons/search.svg" alt="Search" width={20} height={20} className="md:w-6 md:h-6" />
        </Link>
        <button aria-label="Account" className="hover:opacity-70 transition-opacity">
          <Image src="/icons/profile.svg" alt="Profile" width={20} height={20} className="md:w-6 md:h-6" />
        </button>
        <Link href="/cart" aria-label="Cart" className="hover:opacity-70 transition-opacity relative">
          <Image src="/icons/cart.svg" alt="Cart" width={20} height={20} className="md:w-6 md:h-6" />
          {cart.itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#00473c] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cart.itemCount > 99 ? '99+' : cart.itemCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Header;
