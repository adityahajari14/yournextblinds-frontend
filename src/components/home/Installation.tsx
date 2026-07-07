import Image from 'next/image';
import Link from 'next/link';

const Installation = () => {
  return (
    <section className="relative px-4 md:px-6 lg:px-20 py-12 md:py-16 lg:py-24 overflow-hidden">
      <div className="hidden lg:flex flex-col gap-6 absolute top-1/2 -translate-y-1/2 right-0">
        <div className="w-[200px] h-8 bg-[#00473c]" />
        <div className="w-[200px] h-8 bg-[#00473c]" />
        <div className="w-[200px] h-8 bg-[#00473c]" />
      </div>

      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8 md:gap-10 lg:gap-20 items-center">
        <div className="flex flex-col gap-6 md:gap-8 max-w-[520px] w-full text-center lg:text-left items-center lg:items-start">
          <div className="flex flex-col gap-4 md:gap-5">
            <h2 className="text-xl md:text-2xl lg:text-[32px] font-medium text-[#3a3a3a] tracking-tight leading-snug">
              Professional Installation Available at your Doorstep
            </h2>
            <div className="relative w-full h-[300px] md:h-[350px] lg:hidden">
              <Image
                src="/home/installation.jpg"
                alt="Professional installation"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-sm md:text-base lg:text-lg text-[#484848] leading-relaxed">
              We offer a complete blinds installation service. Simply order your chosen blinds and add contact us about installation once your order is confirmed. Our team will give you a call to arrange a convenient installation date and time.
            </p>
          </div>
          <Link
            href="/contact"
            className="w-full md:w-fit bg-[#00473c] text-white px-6 md:px-8 py-3 md:py-4 rounded text-sm md:text-base lg:text-lg font-medium tracking-wider hover:bg-[#003a31] transition-colors text-center"
          >
            Book Now
          </Link>
        </div>
        
        <div className="relative w-full lg:w-[578px] h-[300px] md:h-[350px] lg:h-[488px] max-lg:hidden">
          <Image
            src="/home/installation.jpg"
            alt="Professional installation"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default Installation;
