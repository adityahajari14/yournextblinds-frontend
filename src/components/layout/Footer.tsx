import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-white px-4 md:px-6 lg:px-20 pt-12 lg:pt-16 pb-4">
      <div className="max-w-[1200px] mx-auto flex flex-col">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-0 justify-between items-center lg:items-start">
          <div className="flex flex-col gap-5 max-w-[360px] w-full md:w-auto text-center lg:text-left items-center lg:items-start">
            <Link href="/" className="flex gap-2 items-center">
              <Image src="/icons/logo.svg" alt="Your Next Blinds" width={19} height={23} />
              <span className="font-medium text-lg lg:text-xl text-[#00473c] leading-tight">
                Your <span className="italic">Next </span>Blinds
              </span>
            </Link>
            <p className="text-sm text-[#666] leading-relaxed">
              Premium custom blinds and shades, manufactured in Texas. Over 15 years of expertise — designed for light, built for life.
            </p>
          </div>
          <nav className="flex flex-wrap gap-6 lg:gap-8 text-sm text-[#484848] justify-center lg:justify-start">
            <Link href="/about" className="hover:text-[#00473c] transition-colors">About.</Link>
            <Link href="/collections" className="hover:text-[#00473c] transition-colors">Shop.</Link>
            <Link href="/guides" className="hover:text-[#00473c] transition-colors">Measure Guides.</Link>
            <Link href="/contact" className="hover:text-[#00473c] transition-colors">Contact.</Link>
          </nav>
        </div>
        
        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end gap-8 mt-12 md:mt-16 lg:mt-24">
          <div className="text-xs text-[#666] leading-relaxed text-center">
            <p>© {new Date().getFullYear()} — Copyright</p>
            <p>All Rights reserved</p>
          </div>

          <div className="flex flex-col gap-1 text-sm text-[#484848] text-center lg:text-right">
            <a href="tel:+18326706705" className="hover:text-[#00473c] transition-colors">+1 832-670-6705</a>
            <a href="mailto:enquiries@yournextblinds.com" className="hover:text-[#00473c] transition-colors">enquiries@yournextblinds.com</a>
            <span>16819 Gentle Stone Dr</span>
            <span>Houston, TX 77095</span>
          </div>
          
        </div>

        {/* Legal Row */}
        <div className="flex flex-col items-center gap-3 mt-8 pt-6 border-t border-[#e5e5e5]">
          <div className="flex gap-6 text-sm text-[#484848]">
            <Link href="/privacy-policy" className="hover:text-[#00473c] transition-colors">Privacy Policy</Link>
            <Link href="/shipping-policy" className="hover:text-[#00473c] transition-colors">Shipping Policy</Link>
            <Link href="/refund-policy" className="hover:text-[#00473c] transition-colors">Refund Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-[#00473c] transition-colors">Terms &amp; Conditions</Link>
          </div>
          <p className="text-xs text-[#999]">© {new Date().getFullYear()} Your Next Blinds. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] uppercase tracking-[0.18em] text-[#8a8a8a]">
            <span>Made in Texas, USA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
