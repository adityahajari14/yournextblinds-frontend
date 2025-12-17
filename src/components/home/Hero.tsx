import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative h-[450px] md:h-[600px] lg:h-[734px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/home/hero/hero-background.jpg"
          alt="Elegant window blinds"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 md:px-6 pt-12 md:pt-24">
        <div className="max-w-[845px] text-center flex flex-col gap-4 md:gap-5 lg:gap-6 items-center">
          <h1 className="text-2xl md:text-4xl lg:text-[44px] text-black tracking-wide leading-[1.2]">
            <span className="font-light">Drill-free shutters built for a </span>
            <span className="font-medium italic">perfect fit</span>
          </h1>
          
          <p className="text-sm md:text-lg lg:text-xl text-[#151515] leading-relaxed max-w-[680px] px-4 md:px-0">
            Discover blinds designed to complement your space and lifestyle crafted for beauty, built to last.
          </p>
          
          <Link href="/collections">
          <button className="mt-2 md:mt-3 bg-[#00473c] text-white px-6 md:px-8 py-3 md:py-4 rounded text-sm md:text-base lg:text-lg font-medium tracking-wider hover:bg-[#003a31] transition-colors">
            Explore Now
          </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
