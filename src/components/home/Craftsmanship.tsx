import Image from 'next/image';

const Craftsmanship = () => {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/home/craftsmanship-bg.jpg"
          alt="Yorkshire craftsmanship"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      <div className="relative z-10 px-4 md:px-6 lg:px-20 py-16 md:py-20 lg:py-28">
        <div className="max-w-[900px] flex flex-col gap-6 md:gap-8 text-center lg:text-left items-center lg:items-start">
          <div className="flex flex-col gap-4 md:gap-5">
            <h2 className="text-2xl md:text-3xl lg:text-[46px] font-light text-white tracking-tight leading-[1.2] max-w-[800px]">
              Proudly Designed and Manufactured in{' '}
              <span className="font-medium italic">Texas</span>
            </h2>
            <p className="text-sm md:text-base lg:text-xl text-white/80 leading-relaxed max-w-[700px]">
              Locally crafted in Texas, our blinds are made with care, quality, and sustainability. With local production and skilled craftsmanship, we ensure perfect fit, lasting durability, and quicker lead times.
            </p>
          </div>
          
          <button className="w-full md:w-fit border border-white text-white px-6 md:px-8 py-3 md:py-3.5 rounded-full text-sm md:text-base lg:text-lg font-medium tracking-wide hover:bg-white hover:text-black transition-colors">
            Discover Craftsmanship
          </button>
        </div>
      </div>
    </section>
  );
};

export default Craftsmanship;
