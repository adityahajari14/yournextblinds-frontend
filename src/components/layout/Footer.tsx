import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-white px-4 md:px-6 lg:px-20 py-12 lg:py-16">
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
            <a href="#" className="hover:text-[#00473c] transition-colors">About.</a>
            <a href="#" className="hover:text-[#00473c] transition-colors">Testimonials.</a>
            <a href="#" className="hover:text-[#00473c] transition-colors">Pricing.</a>
            <a href="#" className="hover:text-[#00473c] transition-colors">Contacts.</a>
          </nav>
        </div>
        
        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end gap-8 mt-12 md:mt-16 lg:mt-24">
          <div className="flex flex-col gap-3 items-center lg:items-start">
            <div className="flex gap-5">
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Image src="/icons/okru.svg" alt="OK.ru" width={12} height={18} />
              </a>
            </div>
            <div className="flex gap-5">
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Image src="/icons/vk.svg" alt="VK" width={18} height={11} />
              </a>
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Image src="/icons/facebook.svg" alt="Facebook" width={16} height={16} />
              </a>
            </div>
            <div className="flex gap-5">
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Image src="/icons/telegram.svg" alt="Telegram" width={17} height={14} />
              </a>
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Image src="/icons/instagram.svg" alt="Instagram" width={16} height={16} />
              </a>
            </div>
          </div>
          
          <div className="text-xs text-[#666] leading-relaxed text-center">
            <p>© {new Date().getFullYear()} — Copyright</p>
            <p>All Rights reserved</p>
          </div>
          
          <div className="flex flex-col gap-4 text-center lg:text-left">
            <div className="text-sm text-[#484848] leading-relaxed">
              <a href="tel:+18326706705" className="hover:text-[#00473c] transition-colors">+1 832-670-6705</a>
              <br />
              <a href="mailto:enquiries@yournextblinds.com" className="hover:text-[#00473c] transition-colors">enquiries@yournextblinds.com</a>
            </div>
            <div className="text-sm text-[#484848] leading-relaxed">
              <p>16819 Gentle Stone Dr</p>
              <p>Houston, TX 77095</p>
            </div>
          </div>
          
          <div className="flex gap-4 text-sm text-[#666] justify-center lg:justify-start">
            <span className="hover:text-[#00473c] transition-colors cursor-pointer">Es</span>
            <span className="hover:text-[#00473c] transition-colors cursor-pointer">Fr</span>
            <span className="hover:text-[#00473c] transition-colors cursor-pointer">De</span>
            <span className="hover:text-[#00473c] transition-colors cursor-pointer">Ru</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
