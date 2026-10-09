import Image from 'next/image';
import Link from 'next/link';

const Craftsmanship = () => {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/home/craftsmanship-bg.webp"
          alt="Texas craftsmanship"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      <div className="relative z-10 px-4 md:px-6 lg:px-20 py-16 md:py-20 lg:py-24">
        <div className="max-w-[900px] flex flex-col gap-6 md:gap-7 text-center lg:text-left items-center lg:items-start">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl md:text-3xl lg:text-[36px] font-light text-white tracking-tight leading-[1.2] max-w-[760px]">
              Proudly Designed and Manufactured in{' '}
              <span className="font-medium italic">Texas</span>
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-white/80 leading-relaxed max-w-[640px]">
              Locally crafted in Texas, our blinds are made with care, quality, and sustainability. With local production and skilled craftsmanship, we ensure perfect fit, lasting durability, and quicker lead times.
            </p>
          </div>

          <Link
            href="/about"
            className="w-full md:w-fit border border-white text-white px-6 md:px-8 py-3 rounded-full text-sm md:text-base font-medium tracking-wide hover:bg-white hover:text-black transition-colors text-center"
          >
            Discover Craftsmanship
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Craftsmanship;
