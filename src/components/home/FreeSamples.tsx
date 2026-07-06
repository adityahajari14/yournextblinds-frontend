import Image from 'next/image';
import Link from 'next/link';

const features = [
  { id: 1, title: 'First in your Letterbox', description: 'Samples are posted directly through your letterbox — no signature required.' },
  { id: 2, title: 'Available on Selected Products', description: 'Free samples are offered on specific fabric ranges. Look for the sample option on eligible product pages.' },
  { id: 3, title: 'Find Your Perfect Match', description: 'See how our fabrics and colours look in your own home before placing your order.' },
];

const FreeSamples = () => {
  return (
    <section className="bg-neutral-50 px-4 md:px-6 lg:px-20 py-12 md:py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8 md:gap-10 lg:gap-12">
        <div className="flex flex-col gap-3 md:gap-4 text-center lg:text-left">
          <h2 className="text-2xl md:text-3xl lg:text-[40px] font-medium text-[#3a3a3a] tracking-tight leading-tight">
            Fast, Free Samples
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-[#484848] leading-relaxed max-w-[700px] mx-auto lg:mx-0">
            Want to feel the quality before you buy? Order up to 10 FREE fabric samples for selected products — delivered straight to your door at absolutely no cost.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 md:gap-10 lg:gap-16 justify-between">
          <div className="flex flex-col justify-between h-auto lg:h-[480px] w-full lg:w-[380px] order-2 lg:order-1">
            <div className="flex flex-col gap-5 md:gap-6 lg:gap-0 lg:justify-between lg:h-[380px]">
              {features.map((feature, index) => (
                <div key={feature.id}>
                  <div className="pb-4 md:pb-5 text-center lg:text-left">
                    <h3 className="text-base md:text-lg lg:text-xl font-medium text-[#3a3a3a] leading-snug mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm md:text-base lg:text-lg text-[#484848] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  {index < features.length - 1 && (
                    <div className="h-px bg-[#e1dcd4] w-full" />
                  )}
                </div>
              ))}
            </div>
            
            <Link
              href="/samples"
              className="mt-6 md:mt-8 lg:mt-0 w-full md:w-fit mx-auto lg:mx-0 bg-[#00473c] text-white px-6 md:px-8 py-3 md:py-4 rounded text-sm md:text-base lg:text-lg font-medium tracking-wider hover:bg-[#003a31] transition-colors text-center"
            >
              Order Now
            </Link>
          </div>
          
          <div className="relative w-full lg:w-[787px] h-[300px] md:h-[400px] lg:h-[525px] order-1 lg:order-2">
            <Image
              src="/home/samples.jpg"
              alt="Free samples"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreeSamples;
